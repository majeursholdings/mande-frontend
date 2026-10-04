"use client";

import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, FileText, ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { API_DOCUMENT_ACCEPT, API_PHOTO_ACCEPT, DEFAULT_MAX_FILE_SIZE_MB } from "@/components/form/fileRules";
import { cleanupFormFieldUploads, clearFormUploadedFiles } from "@/components/form/fileInput";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";
import { formatDuration } from "@/lib/date";
import {
    ADMIN_POSITION_OPTIONS,
    JOB_DESCRIPTION_MAX_LENGTH,
    MAX_JOB_MANUFACTURERS,
    formatJobCodeTimestamp,
    generateJobCode,
    getJobCategoryCode,
    type AdminJob,
    type AdminJobAttachment,
} from "@/constant/admin";
import { COMPANY_SPECIALITY_OPTIONS } from "@/constant/manufacturer";
import { useAdminManufacturers } from "@/components/adminPlatform/dashboardLayout/adminManufacturersContext";
import { useAdminJobs } from "@/components/adminPlatform/dashboardLayout/adminJobsContext";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";
import { FormSubmitButton } from "./formButtons";
import { useProjectLeads } from "@/components/adminPlatform/dashboardLayout/useProjectLeads";

type DetailsValues = {
    title: string;
    category: string;
    /** A project lead's id — asked for when a super admin creates or edits the job. */
    projectLeadId: string;
    manufacturerIds: string[];
    /** Digits only — the amount field's value. */
    amount: string;
};

type ScheduleValues = {
    dueDate: string;
    description: string;
    deliveryStreet?: string;
    deliveryCity: string;
    deliveryState: string;
    deliveryCountry?: string;
};

type AttachmentsValues = {
    documents: FileList | File[] | null;
    featuredImage: FileList | File[] | null;
    images: FileList | File[] | null;
};

/** How many of each a job can hold, counting files already on it when editing. */
const MAX_JOB_DOCUMENTS = 5;
const MAX_JOB_IMAGES = 10;

const STEP_COUNT = 3;

// Trimmed so a value made of only spaces doesn't pass
const notBlank = (message: string) => (value: string) => value.trim().length > 0 || message;

/** A label with a muted note after it, e.g. "Start date (optional)". */
const labelWithNote = (label: string, note: string) => (
    <>
        {label} <span className="font-normal text-mist-400">({note})</span>
    </>
);

const fileCount = (files: FileList | File[] | null | undefined) => (files ? Array.from(files).length : 0);

// ─────────────────────────────────────────────────────────────────────────────
// JobFormDialog — create a job (or edit one) in three steps: the job, its
// schedule and description, then its documents and images. Each step keeps
// its own form here, so going Back and forth never loses what was typed.
// The job code is generated as soon as a name goes in (MD-category-date-time)
// and shown above the name. Whoever creates the job leads it; a super admin,
// who doesn't lead jobs, picks the admin who will (and can hand an edited
// job to another). Closing with changes asks first ("Your changes won't be
// saved").
// ─────────────────────────────────────────────────────────────────────────────

export default function JobFormDialog({
    job,
    onClose,
}: {
    /** The job to edit — omit to create one. */
    job?: AdminJob;
    onClose: () => void;
}) {
    const { createJob, updateJob } = useAdminJobs();
    // Someone who doesn't lead jobs picks the admin who will
    const picksLead = !useStaffPlatform().leadId;
    const isEditing = !!job;
    const { manufacturers, getAssignBlocker } = useAdminManufacturers();
    // Suspended manufacturers, and flagged ones with a job already, can't take this one
    const manufacturerOptions = manufacturers
        .filter(
            (manufacturer) =>
                job?.manufacturerIds.includes(manufacturer.id) || !getAssignBlocker(manufacturer.id),
        )
        .map((manufacturer) => ({ label: manufacturer.companyName, value: manufacturer.id }));

    const { leads: activeProjectLeads } = useProjectLeads();

    const projectLeadOptions = activeProjectLeads.map((lead: { id: string; name: string; position?: string | null }) => ({
        label: `${lead.name} (${ADMIN_POSITION_OPTIONS.find((option) => option.value === lead.position)?.label ?? "Admin"})`,
        value: lead.id,
    }));

    const [step, setStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isDiscardOpen, setIsDiscardOpen] = useState(false);
    // When the name first went in — the job code's date and time
    const [namedAt, setNamedAt] = useState<Date | null>(null);
    // Edit only: files already on the job, which can be removed
    const [keptAttachments, setKeptAttachments] = useState<AdminJobAttachment[]>(
        job?.attachments ?? [],
    );

    const details = useForm<DetailsValues>({
        mode: "onTouched",
        defaultValues: {
            title: job?.title ?? "",
            category: job?.category ?? "",
            projectLeadId: job?.projectLeadIds[0] ?? "",
            manufacturerIds: job?.manufacturerIds ?? [],
            amount: job ? String(job.amount) : "",
        },
    });
    const schedule = useForm<ScheduleValues>({
        mode: "onTouched",
        defaultValues: {
            dueDate: job?.dueDate ?? "",
            description: job?.description ?? "",
            deliveryStreet: job?.deliveryLocation?.street ?? "",
            deliveryCity: job?.deliveryLocation?.city ?? "",
            deliveryState: job?.deliveryLocation?.state ?? "",
            deliveryCountry: job?.deliveryLocation?.country ?? "NG",
        },
    });
    const attachments = useForm<AttachmentsValues>({ defaultValues: { documents: null, featuredImage: null, images: null } });
    const category = useWatch({ control: details.control, name: "category" });
    const dueDate = useWatch({ control: schedule.control, name: "dueDate" });
    const documents = useWatch({ control: attachments.control, name: "documents" });
    const featuredImage = useWatch({ control: attachments.control, name: "featuredImage" });
    const images = useWatch({ control: attachments.control, name: "images" });
    const newFileCount = fileCount(documents) + fileCount(featuredImage) + fileCount(images);
    const keptImageCount = keptAttachments.filter((a) => a.kind === "image").length;
    const keptDocumentCount = keptAttachments.length - keptImageCount;
    const relativeDuration = dueDate ? formatDuration(new Date(), new Date(dueDate)) : null;

    const isDirty =
        details.formState.isDirty ||
        schedule.formState.isDirty ||
        newFileCount > 0 ||
        keptAttachments.length !== (job?.attachments.length ?? 0);

    // Escape, the backdrop, the X — all ask before throwing work away
    const requestClose = () => {
        if (isDirty && !isSaving) setIsDiscardOpen(true);
        else onClose();
    };

    const detailsFields: FormFieldConfig[] = [
        {
            name: "title",
            type: "text",
            label: "Job name",
            placeholder: "Enter job name",
            validation: {
                required: "Job name is required",
                validate: notBlank("Job name is required"),
                // Stamp the code's date and time when a name first goes in;
                // clearing the name clears it, so the next name re-stamps
                onChange: (event: { target: { value: string } }) => {
                    const hasName = event.target.value.trim() !== "";
                    setNamedAt((current) => (hasName ? (current ?? new Date()) : null));
                },
            },
        },
        {
            name: "category",
            type: "select",
            label: "Category",
            placeholder: "Select category",
            options: COMPANY_SPECIALITY_OPTIONS,
            clearable: true,
            validation: { required: "Select a category" },
        },
        ...(picksLead
            ? [
                  {
                      name: "projectLeadId",
                      type: "select",
                      label: "Project lead",
                      placeholder: "Select an admin",
                      description: "The admin who reviews the work and looks after this job.",
                      options: projectLeadOptions,
                      validation: { required: "Pick the admin who'll lead this job" },
                  } satisfies FormFieldConfig,
              ]
            : []),
        {
            name: "manufacturerIds",
            type: "multiselect",
            label: labelWithNote("Manufacturer", `optional, max. of ${MAX_JOB_MANUFACTURERS}`),
            placeholder: "Select manufacturer",
            options: manufacturerOptions,
            maxSelections: MAX_JOB_MANUFACTURERS,
        },
        {
            name: "amount",
            type: "amount",
            label: "Amount",
            placeholder: "₦0",
            validation: {
                required: "Amount is required",
                validate: (value: string) => Number(value) > 0 || "Amount must be more than ₦0",
            },
        },
    ];

    const scheduleFields: FormFieldConfig[] = [
        {
            name: "dueDate",
            type: "date",
            label: "End date",
            placeholder: "Pick an end date",
            minDate: new Date(),
            validation: {
                required: "End date is required",
            },
        },
        {
            name: "deliveryStreet",
            type: "text",
            label: labelWithNote("Delivery street", "optional"),
            placeholder: "e.g. 14 Victoria Island Way",
        },
        {
            name: "deliveryCity",
            type: "text",
            label: "Delivery city",
            placeholder: "e.g. Lagos",
            validation: {
                required: "Delivery city is required",
                validate: notBlank("Delivery city is required"),
            },
        },
        {
            name: "deliveryState",
            type: "text",
            label: "Delivery state",
            placeholder: "e.g. Lagos",
            validation: {
                required: "Delivery state is required",
                validate: notBlank("Delivery state is required"),
            },
        },
        {
            name: "deliveryCountry",
            type: "text",
            label: labelWithNote("Delivery country", "optional"),
            placeholder: "e.g. NG",
        },
        {
            name: "description",
            type: "textarea",
            label: "Description",
            placeholder: "Enter job description",
            height: 120,
            validation: {
                required: "Description is required",
                validate: notBlank("Description is required"),
                maxLength: {
                    value: JOB_DESCRIPTION_MAX_LENGTH,
                    message: `Keep it under ${JOB_DESCRIPTION_MAX_LENGTH} characters`,
                },
            },
        },
    ];

    const attachmentFields: FormFieldConfig[] = [
        {
            name: "documents",
            type: "file",
            label: "Documents",
            description: `PDFs, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB each`,
            accept: API_DOCUMENT_ACCEPT,
            multiple: true,
            maxFiles: Math.max(0, MAX_JOB_DOCUMENTS - keptDocumentCount),
            disabled: keptDocumentCount >= MAX_JOB_DOCUMENTS,
            uploadPurpose: "job-attachment",
        },
        {
            name: "featuredImage",
            type: "image",
            label: "Featured image",
            description: job?.imagePublicId
                ? `Replaces the job's current featured image: JPG, PNG or WebP, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB`
                : `The photo manufacturers see on the job: JPG, PNG or WebP, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB`,
            accept: API_PHOTO_ACCEPT,
            // Kept as a list (of at most one) like the other fields
            multiple: true,
            maxFiles: 1,
            uploadPurpose: "job-image",
        },
        {
            name: "images",
            type: "image",
            label: "Job images",
            description: `Up to ${MAX_JOB_IMAGES} more photos: JPG, PNG or WebP, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB each`,
            accept: API_PHOTO_ACCEPT,
            multiple: true,
            maxFiles: Math.max(0, MAX_JOB_IMAGES - keptImageCount),
            disabled: keptImageCount >= MAX_JOB_IMAGES,
            uploadPurpose: "job-attachment",
        },
    ];

    const save = async () => {
        setIsSaving(true);
        try {
            const detailsValues = details.getValues();
            const scheduleValues = schedule.getValues();
            // Only finished uploads can go on the job: the API claims each by its publicId
            const upload = (files: unknown, kind: AdminJobAttachment["kind"]) =>
                Array.from((files as Array<{ name?: string; originalName?: string; url?: string; publicId?: string }>) ?? []).map((f) => {
                    if (!f?.publicId || !f.url) {
                        throw new Error("Some files are still uploading. Wait for them to finish, then try again.");
                    }
                    return { name: f.originalName || f.name || "attachment", url: f.url, kind, publicId: f.publicId };
                });
            const draft = {
                title: detailsValues.title.trim(),
                category: detailsValues.category,
                manufacturerIds: detailsValues.manufacturerIds,
                amount: Number(detailsValues.amount),
                startDate: job?.startDate ?? null,
                dueDate: scheduleValues.dueDate,
                description: scheduleValues.description.trim(),
                deliveryLocation: scheduleValues.deliveryCity && scheduleValues.deliveryState ? {
                    street: scheduleValues.deliveryStreet?.trim() || "",
                    city: scheduleValues.deliveryCity.trim(),
                    state: scheduleValues.deliveryState.trim(),
                    country: scheduleValues.deliveryCountry?.trim() || "NG",
                } : null,
                ...(picksLead && detailsValues.projectLeadId ? { projectLeadIds: [detailsValues.projectLeadId] } : {}),
                attachments: [
                    ...keptAttachments,
                    ...upload(attachments.getValues("documents"), "document"),
                    ...upload(attachments.getValues("featuredImage"), "image"),
                    ...upload(attachments.getValues("images"), "image"),
                ],
            };
            const leadName = activeProjectLeads.find((lead: { id: string; name: string }) => lead.id === detailsValues.projectLeadId)?.name;
            if (job) {
                await updateJob(job.id, draft);
                toast.success("Job updated successfully");
            } else {
                await createJob(draft, generateJobCode(draft.category, namedAt ?? new Date()));
                toast.success(picksLead && leadName ? `Job created and assigned to ${leadName}` : "Job created successfully");
            }
            clearFormUploadedFiles("documents");
            clearFormUploadedFiles("featuredImage");
            clearFormUploadedFiles("images");
            onClose();
        } catch (err: unknown) {
            await Promise.allSettled([
                cleanupFormFieldUploads("documents"),
                cleanupFormFieldUploads("featuredImage"),
                cleanupFormFieldUploads("images"),
            ]);
            const errorMsg = getErrorMessage(err, `Couldn't ${isEditing ? "update" : "create"} the job. Please try again.`);
            toast.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    const footer = ({ canContinue, isLast }: { canContinue: boolean; isLast: boolean }) => (
        <div className="flex flex-col gap-6 pt-2">
            <StepDots current={step} />
            <div className="flex items-center justify-between gap-3">
                {step > 0 ? (
                    <button
                        type="button"
                        onClick={() => setStep((current) => current - 1)}
                        disabled={isSaving}
                        className="flex items-center gap-2 text-sm font-medium font-text text-mist-800 hover:text-mist-950 cursor-pointer disabled:opacity-50"
                    >
                        <ArrowLeft className="size-4" />
                        Back
                    </button>
                ) : (
                    <span />
                )}
                <FormSubmitButton
                    label={isLast ? (isEditing ? "Save changes" : "Create Job") : "Next"}
                    loadingLabel={isEditing ? "Saving..." : "Creating..."}
                    isLoading={isSaving}
                    disabled={!canContinue}
                    className="w-auto px-6"
                />
            </div>
        </div>
    );

    return (
        <>
            <Dialog
                open
                onOpenChange={(open) => {
                    if (!open) requestClose();
                }}
            >
                <DialogContent>
                    <DialogTitle>{isEditing ? "Edit Job" : "Create a Job"}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Step {step + 1} of {STEP_COUNT}
                    </DialogDescription>

                    {step === 0 && (
                        <div className="flex flex-col gap-4">
                            <JobCode existingCode={job?.code} category={category} namedAt={namedAt} />
                            <MainForm<DetailsValues>
                                methods={details}
                                fields={detailsFields}
                                hideRequiredMarks
                                onSubmit={() => setStep(1)}
                                renderFooter={({ canSubmit }) => footer({ canContinue: canSubmit, isLast: false })}
                            />
                        </div>
                    )}

                    {step === 1 && (
                        <div className="flex flex-col gap-4">
                            {dueDate && (
                                <div className="rounded-lg border border-primary-100 bg-primary-50/60 p-3.5 flex flex-col gap-1 text-xs font-text">
                                    <div className="flex items-center justify-between">
                                        <span className="text-mist-600 font-medium">Estimated project duration:</span>
                                        <span className="font-semibold text-primary-700 font-text text-sm">
                                            {relativeDuration}
                                        </span>
                                    </div>
                                    <p className="text-mist-500 text-[11px] leading-relaxed">
                                        Note: The duration starts counting from when the manufacturer accepts the job.
                                    </p>
                                </div>
                            )}
                            <MainForm<ScheduleValues>
                                methods={schedule}
                                fields={scheduleFields}
                                hideRequiredMarks
                                onSubmit={() => setStep(2)}
                                renderFooter={({ canSubmit }) => (
                                    <div className="flex flex-col gap-3">
                                        {!dueDate && (
                                            <p className="text-[11px] font-text text-mist-500 italic">
                                                Select an end date to calculate duration. Note: The duration starts counting from when the manufacturer accepts the job.
                                            </p>
                                        )}
                                        {footer({ canContinue: canSubmit, isLast: false })}
                                    </div>
                                )}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <MainForm<AttachmentsValues>
                            methods={attachments}
                            fields={attachmentFields}
                            description="Upload and attach files to this job: documents, images or both."
                            requireValidToSubmit={false}
                            onSubmit={save}
                            isLoading={isSaving}
                            footerSlot={
                                keptAttachments.length > 0 && (
                                    <KeptAttachments
                                        attachments={keptAttachments}
                                        onRemove={(name) =>
                                            setKeptAttachments((current) =>
                                                current.filter((attachment) => attachment.name !== name),
                                            )
                                        }
                                    />
                                )
                            }
                            renderFooter={() =>
                                // At least one file on the job, of either kind
                                footer({ canContinue: newFileCount + keptAttachments.length > 0, isLast: true })
                            }
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isDiscardOpen} onOpenChange={setIsDiscardOpen}>
                <DialogContent showCloseButton={false} className="max-w-100 items-center text-center">
                    <div className="flex flex-col gap-2">
                        <DialogTitle className="pr-0">Your changes won&apos;t be saved</DialogTitle>
                        <DialogDescription>
                            We won&apos;t be able to save the details of this job if you move away from this page.
                        </DialogDescription>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-3">
                        <DiscardButton onClick={() => setIsDiscardOpen(false)} tone="neutral">
                            Go back
                        </DiscardButton>
                        <DiscardButton
                            onClick={() => {
                                setIsDiscardOpen(false);
                                onClose();
                            }}
                            tone="danger"
                        >
                            Discard
                        </DiscardButton>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

/**
 * The job code, above the name. New jobs: generated from the category and
 * when the name went in, and filled in part by part as those arrive.
 * Existing jobs keep theirs.
 */
function JobCode({
    existingCode,
    category,
    namedAt,
}: {
    existingCode?: string;
    category: string;
    namedAt: Date | null;
}) {
    const placeholder = <span className="text-mist-300">···</span>;

    return (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-mist-50 px-4 py-3">
            <div className="min-w-0">
                <p className="text-xs font-text text-mist-500">Job code</p>
                <p className="truncate font-mono text-sm font-medium tracking-wide text-mist-950" aria-live="polite">
                    {existingCode ?? (
                        <>
                            MD-{category ? getJobCategoryCode(category) : placeholder}-
                            {namedAt ? formatJobCodeTimestamp(namedAt) : placeholder}
                        </>
                    )}
                </p>
            </div>
            <span className="shrink-0 text-xs font-text text-mist-400">
                {existingCode ? "Can't be changed" : namedAt ? "Auto-generated" : "Starts with the job name"}
            </span>
        </div>
    );
}

/** Where the admin is in the three steps — the current one is a wider red pill. */
function StepDots({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-center gap-1.5" aria-hidden>
            {Array.from({ length: STEP_COUNT }, (_, index) => (
                <span
                    key={index}
                    className={cn(
                        "h-1.5 rounded-full transition-all duration-200",
                        index === current ? "w-4 bg-error-600" : "w-1.5 bg-mist-200",
                    )}
                />
            ))}
        </div>
    );
}

/** Edit only: the files already on the job. */
function KeptAttachments({
    attachments,
    onRemove,
}: {
    attachments: AdminJobAttachment[];
    onRemove: (name: string) => void;
}) {
    return (
        <ul className="flex flex-col gap-2">
            {attachments.map((attachment) => {
                const Icon = attachment.kind === "image" ? ImageIcon : FileText;
                return (
                    <li
                        key={attachment.name}
                        className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
                    >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-600">
                            <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium font-text text-mist-950">
                            {attachment.name}
                        </span>
                        <button
                            type="button"
                            onClick={() => onRemove(attachment.name)}
                            aria-label={`Remove ${attachment.name}`}
                            className="shrink-0 text-error-600 hover:text-error-700 cursor-pointer"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

function DiscardButton({
    onClick,
    tone,
    children,
}: {
    onClick: () => void;
    tone: "neutral" | "danger";
    children: ReactNode;
}) {
    return (
        <Button
            type="button"
            onClick={onClick}
            className={cn(
                "h-11 font-medium font-text rounded-button cursor-pointer transition-colors duration-300",
                tone === "danger"
                    ? "bg-error-600 hover:bg-error-700 text-white"
                    : "bg-mist-100 hover:bg-mist-200 text-mist-950",
            )}
        >
            {children}
        </Button>
    );
}
