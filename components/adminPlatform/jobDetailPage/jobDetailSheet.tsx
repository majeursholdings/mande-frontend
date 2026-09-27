"use client";

import { useState, type ReactNode } from "react";
import { Check, CircleAlert, Copy, Ellipsis, PhoneCall, Pencil, Repeat, X, XIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
    ADMIN_ME_ID,
    ADMIN_PROFILE,
    MAX_ADMIN_JOB_REJECTIONS,
    getAdminManufacturer,
    getJobCountdownLabel,
    getProjectLead,
    isRejectionFinal,
    type AdminJob,
} from "@/constant/admin";
import { COMPANY_SPECIALITY_OPTIONS, getOptionLabel } from "@/constant/manufacturer";
import RejectJobForm from "@/components/adminPlatform/form/rejectJobForm";
import ReassignJobForm from "@/components/adminPlatform/form/reassignJobForm";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import { JobStatusBadge, PersonLabel } from "../jobsPage/jobPeople";
import AssignmentHistory from "./assignmentHistory";
import { AttachmentList, ContactManufacturerDialog, DetailSection, ImagePreviewGrid } from "./detailParts";
import { ExtensionHistory, PendingExtensionRequest } from "./extensionRequests";
import JobNotes from "./jobNotes";
import ManufacturerRating from "./manufacturerRating";
import ProductionSteps from "./productionSteps";
import { FinishedFurniture, RejectionHistory, photoItems } from "./workReview";

type JobDialog = "approve" | "reject" | "reassign" | "contact" | null;

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailSheet — one job, docked on the right (full screen on phones).
// What shows and what can be done follow the job's status (see the jobs
// section of constant/admin.ts): pending jobs can be edited and reassigned,
// with their assignment history; in-progress jobs show the production steps
// and any request for more time; work in review can be approved (after
// seeing the photos) or rejected with a review; completed jobs close their
// notes and take a rating instead. Only the job's project lead acts; anyone
// else can read it all, and is told why the actions are off.
// ─────────────────────────────────────────────────────────────────────────────

export default function JobDetailSheet({
    job,
    onClose,
    onEdit,
}: {
    job: AdminJob | undefined;
    onClose: () => void;
    onEdit: (jobId: string) => void;
}) {
    return (
        <Sheet
            open={!!job}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <SheetContent
                side="right"
                showCloseButton={false}
                className="gap-0 bg-white p-0 data-[side=right]:inset-0 data-[side=right]:w-full data-[side=right]:max-w-full data-[side=right]:border-l-0 md:data-[side=right]:inset-y-0 md:data-[side=right]:left-auto md:data-[side=right]:max-w-120 md:data-[side=right]:border-l md:data-[side=right]:border-border"
            >
                {job && <JobDetail key={job.id} job={job} onEdit={() => onEdit(job.id)} />}
            </SheetContent>
        </Sheet>
    );
}

function JobDetail({ job, onEdit }: { job: AdminJob; onEdit: () => void }) {
    const { approveJob, rejectJob, decideExtension, reassignJob, rateManufacturer, addNote } = useAdminJobs();
    const [dialog, setDialog] = useState<JobDialog>(null);
    const closeDialog = () => setDialog(null);

    const leads = job.projectLeadIds.map(getProjectLead).filter((lead) => !!lead);
    const leadNames = leads.map((lead) => lead.name).join(" and ") || "the project lead";
    const manufacturerNames =
        job.manufacturerIds.map((id) => getAdminManufacturer(id)?.companyName).filter(Boolean).join(" & ") ||
        "the manufacturer";
    const isLead = job.projectLeadIds.includes(ADMIN_ME_ID);
    const { status } = job;
    const isFinal = isRejectionFinal(job);

    // Only the lead acts, and only at the right point in the job's life
    const canEdit = isLead && status === "pending";
    const canReassign = isLead && status === "pending";
    const canReview = isLead && status === "in-review";
    const canDecideExtensions = isLead && status === "in-progress";
    const canPostNotes = isLead && status !== "completed";
    const canRate = isLead && status === "completed" && !job.manufacturerReview;

    const pendingExtension = job.extensionRequests.find((request) => request.status === "pending");
    const decidedExtensions = job.extensionRequests.filter((request) => request.status !== "pending");
    const latestApprovedExtension = decidedExtensions.find((request) => request.status === "approved");
    const nextRejectionNumber = job.rejections.length + 1;

    // Why "Mark as completed" is off, shown under it
    const completeHint =
        status === "completed"
            ? null
            : !isLead
              ? `Only ${leadNames} can review this job.`
              : status === "pending" || status === "in-progress"
                ? "You can mark it as completed once the manufacturer submits it for review."
                : isFinal
                  ? `Closed after ${MAX_ADMIN_JOB_REJECTIONS} rejections.`
                  : status === "rejected"
                    ? "Waiting for the manufacturer to fix and resubmit it."
                    : null;

    const run = (action: () => void, success: string, failure: string) => {
        try {
            action();
            toast.success(success);
        } catch {
            toast.error(failure);
        }
    };

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(job.code);
            toast.success(`Copied ${job.code}`);
        } catch {
            toast.error("Couldn't copy the job code");
        }
    };

    return (
        <div className="flex h-full flex-col overflow-y-auto">
            <div className="flex flex-col gap-2 px-5 pt-6 pb-4 md:px-10 md:pt-10">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={!canReview}
                            onClick={() => setDialog("approve")}
                            className={cn(
                                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium font-text transition-colors",
                                status === "completed"
                                    ? "border-primary-200 bg-primary-50 text-primary-700"
                                    : canReview
                                      ? "border-error-300 text-error-600 hover:bg-error-50 cursor-pointer"
                                      : "border-border text-mist-400",
                            )}
                        >
                            <Check className="size-3.5" strokeWidth={2.5} />
                            {status === "completed" ? "Completed" : "Mark as completed"}
                        </button>
                        {canReview && (
                            <button
                                type="button"
                                onClick={() => setDialog("reject")}
                                className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium font-text text-mist-700 transition-colors hover:bg-mist-50 cursor-pointer"
                            >
                                <X className="size-3.5" strokeWidth={2.5} />
                                Reject
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <MoreMenu
                            items={[
                                canEdit && { label: "Edit job", icon: <Pencil className="size-4" />, onSelect: onEdit },
                                canReassign && {
                                    label: job.manufacturerIds.length > 0 ? "Reassign" : "Assign manufacturer",
                                    icon: <Repeat className="size-4" />,
                                    onSelect: () => setDialog("reassign"),
                                },
                                job.manufacturerIds.length > 0 && {
                                    label: "Contact manufacturer",
                                    icon: <PhoneCall className="size-4" />,
                                    onSelect: () => setDialog("contact"),
                                },
                                { label: "Copy job code", icon: <Copy className="size-4" />, onSelect: copyCode },
                            ]}
                        />
                        <SheetClose className="flex size-8 items-center justify-center rounded-full text-mist-700 transition-colors hover:bg-mist-100 cursor-pointer">
                            <XIcon className="size-5" />
                            <span className="sr-only">Close</span>
                        </SheetClose>
                    </div>
                </div>
                {completeHint && <p className="text-xs font-text text-mist-500">{completeHint}</p>}
            </div>

            <div className="flex flex-col gap-8 px-5 pb-10 md:px-10">
                <div className="flex items-center justify-between gap-3 border-b border-border py-4">
                    <SheetTitle className="text-lg font-semibold font-text text-mist-950">{job.title}</SheetTitle>
                    {canEdit && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="flex shrink-0 items-center gap-1 text-sm font-medium font-text text-error-600 hover:underline cursor-pointer"
                        >
                            <Pencil className="size-3.5" />
                            Edit
                        </button>
                    )}
                </div>

                {pendingExtension && (
                    <PendingExtensionRequest
                        request={pendingExtension}
                        canDecide={canDecideExtensions}
                        leadNames={leadNames}
                        onDecide={(decision) =>
                            run(
                                () => decideExtension(job.id, pendingExtension.id, decision),
                                decision === "approved" ? "New due date approved" : "Extension request rejected",
                                "Couldn't save your decision. Please try again.",
                            )
                        }
                    />
                )}

                <dl className="-mt-4 flex flex-col gap-5 text-sm font-text">
                    <DetailRow label="Job code">{job.code}</DetailRow>
                    <DetailRow label={leads.length > 1 ? "Project leads" : "Project lead"}>
                        {leads.length > 0 ? (
                            <span className="flex flex-col gap-2">
                                {leads.map((lead) => (
                                    <PersonLabel key={lead.id} name={lead.name} avatarUrl={lead.avatarUrl} size="sm" />
                                ))}
                            </span>
                        ) : (
                            "Unassigned"
                        )}
                    </DetailRow>
                    <DetailRow label={job.manufacturerIds.length > 1 ? "Manufacturers" : "Manufacturer"}>
                        {job.manufacturerIds.length > 0 ? (
                            <span className="flex flex-col gap-2">
                                {job.manufacturerIds.map((id) => {
                                    const manufacturer = getAdminManufacturer(id);
                                    return manufacturer ? (
                                        <PersonLabel key={id} name={manufacturer.companyName} size="sm" />
                                    ) : null;
                                })}
                            </span>
                        ) : (
                            <span className="text-mist-500">Not yet assigned</span>
                        )}
                    </DetailRow>
                    <DetailRow label="Amount">{formatPrice(job.amount)}</DetailRow>
                    <DetailRow label="Category">{getOptionLabel(COMPANY_SPECIALITY_OPTIONS, job.category)}</DetailRow>
                    <DetailRow label="Countdown">{getJobCountdownLabel(job)}</DetailRow>
                    <DetailRow label="Date assigned">
                        {job.dateAssigned ? formatOrdinalDate(new Date(job.dateAssigned)) : "Not yet assigned"}
                    </DetailRow>
                    <DetailRow label="Start date">
                        {job.startDate ? (
                            formatOrdinalDate(new Date(job.startDate))
                        ) : (
                            <span className="text-mist-500">Not set</span>
                        )}
                    </DetailRow>
                    <DetailRow label="Due date">
                        <span className="flex flex-col gap-1">
                            <span>{formatOrdinalDate(new Date(job.dueDate))}</span>
                            {latestApprovedExtension && (
                                <span className="text-xs text-mist-500">
                                    Extended from {formatOrdinalDate(new Date(latestApprovedExtension.previousDueDate))}
                                </span>
                            )}
                            {pendingExtension && (
                                <span className="w-fit rounded-full bg-warning-50 px-2 py-0.5 text-xs text-warning-700">
                                    Extension requested
                                </span>
                            )}
                        </span>
                    </DetailRow>
                    <DetailRow label="Status">
                        <JobStatusBadge status={status} />
                    </DetailRow>
                    <DetailRow label="Description">{job.description}</DetailRow>
                </dl>

                {status === "in-progress" && <ProductionSteps completedStepKeys={job.completedStepKeys} />}

                {(status === "in-review" || status === "rejected" || status === "completed") && (
                    <FinishedFurniture job={job} />
                )}

                <RejectionHistory job={job} onContact={() => setDialog("contact")} />

                {(status === "pending" || job.assignmentHistory.length > 1) && (
                    <AssignmentHistory
                        history={job.assignmentHistory}
                        canReassign={canReassign}
                        onReassign={() => setDialog("reassign")}
                    />
                )}

                {decidedExtensions.length > 0 && <ExtensionHistory requests={decidedExtensions} />}

                {job.attachments.length > 0 && (
                    <DetailSection title="Attachments" count={job.attachments.length}>
                        <AttachmentList attachments={job.attachments} />
                    </DetailSection>
                )}

                {status === "completed" && (
                    <ManufacturerRating
                        job={job}
                        canRate={canRate}
                        leadNames={leadNames}
                        onRate={(review) =>
                            run(
                                () => rateManufacturer(job.id, review),
                                "Thanks — your rating was saved",
                                "Couldn't save your rating. Please try again.",
                            )
                        }
                    />
                )}

                <JobNotes
                    notes={job.notes}
                    canPost={canPostNotes}
                    info={
                        status === "completed"
                            ? "Notes are closed now the job is completed. Rate the manufacturer above instead."
                            : canPostNotes
                              ? "Leave notes, comments or feedback on this job. The manufacturer can see them."
                              : `You can read the notes on this job. Only ${leadNames} can add to them.`
                    }
                    onPost={(message) =>
                        addNote(job.id, {
                            authorName: `${ADMIN_PROFILE.firstName} ${ADMIN_PROFILE.lastName}`,
                            authorRole: "Project lead",
                            message,
                        })
                    }
                />
            </div>

            <Dialog open={dialog === "approve"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Mark this job as completed?</DialogTitle>
                        <DialogDescription>
                            Check the finished furniture {manufacturerNames} submitted. Marking it as completed signs off{" "}
                            {job.title} and lets them know the work has been accepted.
                        </DialogDescription>
                    </div>
                    {job.completionImageUrls.length > 0 ? (
                        <ImagePreviewGrid images={photoItems(job.completionImageUrls)} />
                    ) : (
                        <p className="rounded-lg bg-mist-50 px-4 py-6 text-center text-sm font-text text-mist-500">
                            No photos were submitted.
                        </p>
                    )}
                    <div className="flex justify-end gap-3">
                        <DialogButton onClick={closeDialog} tone="neutral">
                            Cancel
                        </DialogButton>
                        <DialogButton
                            onClick={() => {
                                run(
                                    () => approveJob(job.id),
                                    "Job marked as completed",
                                    "Couldn't mark the job as completed. Please try again.",
                                );
                                closeDialog();
                            }}
                            tone="primary"
                        >
                            Mark as completed
                        </DialogButton>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={dialog === "reject"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Reject this job?</DialogTitle>
                        <DialogDescription>
                            Rejection {nextRejectionNumber} of {MAX_ADMIN_JOB_REJECTIONS}. {manufacturerNames} will get your
                            review{nextRejectionNumber < MAX_ADMIN_JOB_REJECTIONS ? " and can fix the work and resubmit it" : ""}.
                        </DialogDescription>
                    </div>
                    {nextRejectionNumber >= MAX_ADMIN_JOB_REJECTIONS && (
                        <p className="flex gap-2.5 rounded-lg bg-warning-50 px-3.5 py-3 text-xs leading-5 font-text text-warning-800">
                            <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                            This is the last rejection. After it, {manufacturerNames} can&apos;t resubmit this job and it
                            stays rejected.
                        </p>
                    )}
                    <RejectJobForm
                        onCancel={closeDialog}
                        onReject={(review) => {
                            run(
                                () => rejectJob(job.id, review),
                                nextRejectionNumber >= MAX_ADMIN_JOB_REJECTIONS
                                    ? "Job rejected for the last time"
                                    : "Job rejected — the manufacturer has your review",
                                "Couldn't reject the job. Please try again.",
                            );
                            closeDialog();
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={dialog === "reassign"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>{job.manufacturerIds.length > 0 ? "Reassign job" : "Assign job"}</DialogTitle>
                        <DialogDescription>
                            They&apos;ll be asked to accept it. The assignment history keeps who had it before.
                        </DialogDescription>
                    </div>
                    <ReassignJobForm
                        currentManufacturerIds={job.manufacturerIds}
                        onCancel={closeDialog}
                        onReassign={(manufacturerIds) => {
                            const isFirst = job.manufacturerIds.length === 0;
                            run(
                                () => reassignJob(job.id, manufacturerIds),
                                isFirst ? "Job assigned" : "Job reassigned",
                                "Couldn't save the assignment. Please try again.",
                            );
                            closeDialog();
                        }}
                    />
                </DialogContent>
            </Dialog>

            <ContactManufacturerDialog
                manufacturerIds={job.manufacturerIds}
                open={dialog === "contact"}
                onOpenChange={(open) => !open && closeDialog()}
            />
        </div>
    );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-4">
            <dt className="text-mist-500">{label}</dt>
            <dd className="text-mist-950">{children}</dd>
        </div>
    );
}

function DialogButton({
    onClick,
    tone,
    children,
}: {
    onClick: () => void;
    tone: "neutral" | "primary";
    children: ReactNode;
}) {
    return (
        <Button
            type="button"
            onClick={onClick}
            className={cn(
                "h-11 px-5 font-medium font-text rounded-button cursor-pointer transition-colors duration-300",
                tone === "primary"
                    ? "bg-secondary-700 hover:bg-secondary-900 text-white"
                    : "bg-mist-100 hover:bg-mist-200 text-mist-950",
            )}
        >
            {children}
        </Button>
    );
}

type MenuItem = { label: string; icon: ReactNode; onSelect: () => void };

function MoreMenu({ items }: { items: (MenuItem | false)[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const visible = items.filter((item): item is MenuItem => !!item);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger
                aria-label="More actions"
                className="flex size-8 items-center justify-center rounded-full text-mist-700 transition-colors hover:bg-mist-100 cursor-pointer"
            >
                <Ellipsis className="size-5" />
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={6} className="w-52 gap-0.5 p-1.5">
                {visible.map((item) => (
                    <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            item.onSelect();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium font-text text-mist-700 transition-colors hover:bg-mist-50 hover:text-mist-950 cursor-pointer"
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}
