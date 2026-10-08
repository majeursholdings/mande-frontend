"use client";

import { useState, type ReactNode } from "react";
import { Check, CircleAlert, Copy, Ellipsis, Loader2, PauseCircle, PhoneCall, Pencil, Repeat, Trash2, X, XIcon } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { formatDuration, formatOrdinalDate, getTimeUntilLabel } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
    MAX_ADMIN_JOB_REJECTIONS,
    getAdminJobPayments,
    getAdminManufacturer,
    getJobCountdownLabel,
    getProjectLead,
    isRejectionFinal,
    type AdminJob,
} from "@/constant/admin";
import { COMPANY_SPECIALITY_OPTIONS, getOptionLabel } from "@/constant/manufacturer";
import {
    JOB_PRODUCTION_STEPS,
    MIN_SIGN_OFF_RATING,
    REJECTION_CHARGE_PERCENT,
    getAutoApproveAt,
    getRejectionCharge,
    type ProductionStepKey,
} from "@/constant/jobWorkflow";
import ReasonForm from "@/components/adminPlatform/form/reasonForm";
import RejectJobForm from "@/components/adminPlatform/form/rejectJobForm";
import ReassignJobForm from "@/components/adminPlatform/form/reassignJobForm";
import TypeToConfirmForm from "@/components/adminPlatform/form/typeToConfirmForm";
import RatingReviewForm from "@/components/form/ratingReviewForm";
import { getJobDeleteBlocker, useAdminJobs } from "../dashboardLayout/adminJobsContext";
import { useAdminManufacturers } from "../dashboardLayout/adminManufacturersContext";
import { useAdminProfile } from "../dashboardLayout/adminProfileContext";
import { canActOnJob, useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import { JobStatusBadge, PersonLabel } from "../jobsPage/jobPeople";
import AssignmentHistory from "./assignmentHistory";
import { AttachmentList, ContactManufacturerDialog, DetailSection, ImagePreviewGrid } from "./detailParts";
import { ExtensionHistory, PendingExtensionRequest } from "./extensionRequests";
import JobNotes from "./jobNotes";
import JobPayments from "./jobPayments";
import ManufacturerRating, { LeadRating, RatingStarsDisplay } from "./manufacturerRating";
import ProductionSteps from "./productionSteps";
import { FinishedFurniture, RejectionHistory, photoItems } from "./workReview";

type JobDialog = "approve" | "sign-off-held" | "reject" | "reassign" | "contact" | "fault" | "delete" | null;

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailSheet — one job, docked on the right (full screen on phones).
// What shows and what can be done follow the job's status (see the jobs
// section of constant/admin.ts): pending jobs can be edited and reassigned,
// with their assignment history and anyone who applied for them; in-progress
// jobs show the production steps, whose proof the lead approves or sends
// back, and any request for more time; work in review is signed off by
// rating the manufacturer (3 stars or less holds it for a super admin to
// sign off or reject instead), or rejected with a review; completed jobs
// close their notes and show both ratings (the lead's of the manufacturer,
// and theirs of the lead) — and, for a few days, take a fault report. The payments show what the manufacturer has been paid so far.
// Only the job's project lead acts (and a super admin, on any job, who can
// also delete a job no one has been paid for yet); anyone else can read it
// all, and is told why the actions are off.
// ─────────────────────────────────────────────────────────────────────────────

export default function JobDetailSheet({
    job,
    loading = false,
    onClose,
    onEdit,
}: {
    job: AdminJob | undefined;
    /** The job is still loading: the panel opens with its fields as skeletons. */
    loading?: boolean;
    onClose: () => void;
    onEdit: (jobId: string) => void;
}) {
    return (
        <Sheet
            open={!!job || loading}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            {/* Full screen on phones and docked on tablets — both stopping above the
                bottom bar, which stays in view and usable — and full height from lg */}
            <SheetContent
                side="right"
                showCloseButton={false}
                overlayClassName="bottom-(--mobile-bottom-nav-height) lg:bottom-0"
                className="gap-0 bg-white p-0 data-[side=right]:inset-x-0 data-[side=right]:top-0 data-[side=right]:bottom-(--mobile-bottom-nav-height) data-[side=right]:h-auto data-[side=right]:w-full data-[side=right]:max-w-full data-[side=right]:border-l-0 md:data-[side=right]:left-auto md:data-[side=right]:max-w-120 md:data-[side=right]:border-l md:data-[side=right]:border-border lg:data-[side=right]:bottom-0"
            >
                {job ? (
                    <JobDetail key={job.id} job={job} onEdit={() => onEdit(job.id)} onDeleted={onClose} />
                ) : (
                    loading && <JobDetailSkeleton />
                )}
            </SheetContent>
        </Sheet>
    );
}

function JobDetail({ job, onEdit, onDeleted }: { job: AdminJob; onEdit: () => void; onDeleted: () => void }) {
    const {
        completeJob,
        signOffHeldJob,
        rejectJob,
        decideExtension,
        reassignJob,
        rateManufacturer,
        addNote,
        approveStep,
        sendBackStep,
        acceptApplication,
        declineApplication,
        reportFault,
        deleteJob,
    } = useAdminJobs();
    const platform = useStaffPlatform();
    const { fullName } = useAdminProfile();
    const { getAssignBlocker, getManufacturer } = useAdminManufacturers();
    const [dialog, setDialog] = useState<JobDialog>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    /** The step whose proof is being sent back, while its dialog is open. */
    const [sendingBack, setSendingBack] = useState<ProductionStepKey | null>(null);
    /** The step whose proof is being approved, while its dialog is open. */
    const [approvingStep, setApprovingStep] = useState<ProductionStepKey | null>(null);
    const [isApprovingStep, setIsApprovingStep] = useState(false);
    const closeDialog = () => setDialog(null);

    const approvingStepConfig = JOB_PRODUCTION_STEPS.find((step) => step.key === approvingStep);
    const approvingSubmission = approvingStep
        ? job.stepSubmissions.filter((sub) => sub.step === approvingStep).at(-1)
        : undefined;
    const { payments: jobPayments } = getAdminJobPayments(job);
    const approvingPayment = jobPayments.find((p) => p.milestone === approvingStep);

    const leads = job.projectLeadIds.map(getProjectLead).filter((lead) => !!lead);
    const leadNames = leads.map((lead) => lead.name).join(" and ") || "the project lead";
    const jobManufacturers = job.manufacturers ?? [];
    const getMfrName = (id: string) => {
        const fromJob = jobManufacturers.find((m) => m.id === id);
        const fromContext = getManufacturer(id);
        const fromRegistry = getAdminManufacturer(id);
        return (
            fromJob?.companyName ||
            fromContext?.companyName ||
            fromRegistry?.companyName ||
            fromJob?.name ||
            fromContext?.contactName ||
            fromRegistry?.contactName ||
            null
        );
    };
    const manufacturerNames =
        job.manufacturerIds.map(getMfrName).filter(Boolean).join(" & ") ||
        (jobManufacturers.length > 0 ? jobManufacturers.map((m) => m.companyName || m.name).filter(Boolean).join(" & ") : null) ||
        "the manufacturer";
    const isLead = canActOnJob(platform, job);
    const deleteBlocker = getJobDeleteBlocker(job);
    const { status } = job;
    const isFinal = isRejectionFinal(job);

    // Only the lead acts, and only at the right point in the job's life
    const canEdit = isLead && status === "pending";
    const canReassign = isLead && status === "pending";
    const heldReview = status === "in-review" ? job.furtherReview : null;
    // Signing off: not while it's held for a super admin
    const canReview = isLead && status === "in-review" && !heldReview;
    const canDecideHeld = platform.permissions.decidesHeldJobs && !!heldReview;
    // Held work is a super admin's to reject (the API refuses anyone else)
    const canReject = isLead && status === "in-review" && (!heldReview || canDecideHeld);
    const hasDeliveryRejection =
        job.rejections.length > 0 ||
        job.stepSubmissions.some((sub) => sub.step === "delivery" && sub.review?.outcome === "sent-back");
    // The job's lead approves steps for payout; a super admin only steps in after a delivery rejection
    const canReviewSteps =
        status === "in-progress" &&
        ((platform.key === "admin" && isLead) || (platform.key === "super-admin" && hasDeliveryRejection));
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
            : heldReview
              ? canDecideHeld
                  ? "Held for further review. Sign it off or reject it below."
                  : "Held for further review. A super admin decides whether it's signed off."
              : !isLead
              ? `Only ${leadNames} can review this job.`
              : status === "pending" || status === "in-progress"
                ? "You can mark it as completed once the manufacturer submits it for review."
                : status === "in-review" && job.submittedForReviewAt
                  ? `If no one reviews it, it's approved automatically ${getTimeUntilLabel(getAutoApproveAt(job.submittedForReviewAt))}.`
                : isFinal
                  ? `Closed after ${MAX_ADMIN_JOB_REJECTIONS} rejections.`
                  : status === "rejected"
                    ? "Waiting for the manufacturer to fix and resubmit it."
                    : null;

    const run = async (action: () => Promise<unknown> | void, success: string, failure: string): Promise<boolean> => {
        try {
            await action();
            toast.success(success);
            return true;
        } catch (err: unknown) {
            const message = getErrorMessage(err, failure);
            toast.error(message);
            return false;
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
        <div
            className="flex h-full flex-col overflow-y-auto"
            onScroll={(event) => setIsScrolled(event.currentTarget.scrollTop > 0)}
        >
            {/* Stays at the top so Close is always in reach — with a line under it once the details scroll beneath */}
            <div
                className={cn(
                    "sticky top-0 z-10 flex flex-col gap-2 bg-white px-5 pt-4 pb-4 transition-shadow md:px-10 md:pt-10",
                    isScrolled && "shadow-[0_1px_0_0_var(--color-border)]",
                )}
            >
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
                        {canReject && (
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
                                platform.permissions.deletes && {
                                    label: "Delete job",
                                    icon: <Trash2 className="size-4" />,
                                    tone: "danger",
                                    disabledReason: deleteBlocker,
                                    onSelect: () => setDialog("delete"),
                                },
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

                {heldReview && (
                    <FurtherReviewNotice
                        review={heldReview}
                        canDecide={canDecideHeld}
                        onSignOff={() => setDialog("sign-off-held")}
                        onReject={() => setDialog("reject")}
                    />
                )}

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
                                    const name = getMfrName(id) || "Manufacturer";
                                    return <PersonLabel key={id} name={name} size="sm" />;
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
                            <span className="text-mist-500">Starts when accepted</span>
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
                    <DetailRow label="Project duration">
                        {/* From the planned start — or, without one, when it was accepted or created */}
                        {job.startDate || job.dateAssigned ? (
                            formatDuration(new Date(job.startDate ?? job.dateAssigned!), new Date(job.dueDate))
                        ) : (
                            <span>
                                {formatDuration(new Date(job.createdAt), new Date(job.dueDate))}{" "}
                                <span className="text-xs text-mist-400 font-normal">(starts when accepted)</span>
                            </span>
                        )}
                    </DetailRow>
                    <DetailRow label="Status">
                        <JobStatusBadge status={status} />
                    </DetailRow>
                    <DetailRow label="Description">{job.description}</DetailRow>
                    {job.deliveryLocation && (
                        <DetailRow label="Delivery location">
                            <span>
                                {[
                                    job.deliveryLocation.street,
                                    job.deliveryLocation.city,
                                    job.deliveryLocation.state,
                                    job.deliveryLocation.country,
                                ]
                                    .filter(Boolean)
                                    .join(", ")}
                            </span>
                        </DetailRow>
                    )}
                </dl>

                {status === "in-progress" && (
                    <ProductionSteps
                        job={job}
                        canReview={canReviewSteps}
                        leadNames={leadNames}
                        onApprove={setApprovingStep}
                        onSendBack={setSendingBack}
                    />
                )}

                {(status === "in-review" || status === "rejected" || status === "completed") && (
                    <FinishedFurniture job={job} />
                )}

                <RejectionHistory job={job} onContact={() => setDialog("contact")} />

                {(status === "pending" || job.assignmentHistory.length > 1 || job.applications.length > 0) && (
                    <AssignmentHistory
                        history={job.assignmentHistory}
                        applications={job.applications}
                        canReassign={canReassign}
                        getAcceptBlocker={getAssignBlocker}
                        onReassign={() => setDialog("reassign")}
                        onDecideApplication={(applicationId, decision) =>
                            run(
                                () =>
                                    decision === "accepted"
                                        ? acceptApplication(job.id, applicationId)
                                        : declineApplication(job.id, applicationId),
                                decision === "accepted" ? "Application accepted, the job is theirs" : "Application declined",
                                "Couldn't save your decision. Please try again.",
                            )
                        }
                    />
                )}

                <JobPayments job={job} isLead={isLead} onReportFault={() => setDialog("fault")} />

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
                                "Thanks, your rating was saved",
                                "Couldn't save your rating. Please try again.",
                            )
                        }
                    />
                )}

                {status === "completed" && <LeadRating job={job} />}

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
                            authorName: fullName,
                            // A super admin stepping in isn't the job's lead
                            authorRole: job.projectLeadIds.includes(platform.leadId ?? "") ? "Project lead" : platform.roleLabel,
                            message,
                        })
                    }
                />
            </div>

            <Dialog open={dialog === "approve"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Confirm Delivery & Sign Off</DialogTitle>
                        <DialogDescription>
                            Upload proof of client delivery (signed waybill or site photo) and rate the manufacturer&apos;s
                            work. Jobs rated {MIN_SIGN_OFF_RATING - 1} stars or less are held for a super admin to review further.
                        </DialogDescription>
                    </div>
                    <RatingReviewForm
                        withClientProof
                        ratingLabel="Rate this manufacturer's work"
                        submitLabel={(rating) =>
                            rating > 0 && rating < MIN_SIGN_OFF_RATING ? "Send for further review" : "Confirm Delivery & Complete Job"
                        }
                        loadingLabel="Saving..."
                        errorMessage="Couldn't save your review. Please try again."
                        onSubmit={async (review) => {
                            await completeJob(job.id, review);
                            toast.success(
                                review.rating >= MIN_SIGN_OFF_RATING
                                    ? `${job.title} is completed. ${manufacturerNames} is asked to rate ${leadNames} now.`
                                    : `${job.title} is held for further review by a super admin`,
                            );
                            closeDialog();
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={dialog === "sign-off-held"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Sign off {job.title}?</DialogTitle>
                        <DialogDescription>
                            It&apos;s marked as completed with {heldReview?.authorName}&apos;s rating, and{" "}
                            {manufacturerNames} is paid the final part of the job.
                        </DialogDescription>
                    </div>
                    {job.completionImageUrls.length > 0 && (
                        <ImagePreviewGrid images={photoItems(job.completionImageUrls)} />
                    )}
                    {job.deliveryProofAttachments && job.deliveryProofAttachments.length > 0 && (
                        <div className="flex flex-col gap-1.5 pt-1">
                            <span className="text-xs font-semibold font-text text-mist-700">Client Delivery Proof:</span>
                            <ImagePreviewGrid
                                images={photoItems(
                                    job.deliveryProofAttachments
                                        .map((att) => att.url)
                                        .filter(Boolean) as string[],
                                )}
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <DialogButton onClick={closeDialog} tone="neutral">
                            Cancel
                        </DialogButton>
                        <DialogButton
                            onClick={async () => {
                                const ok = await run(
                                    () => signOffHeldJob(job.id),
                                    `${job.title} is signed off`,
                                    "Couldn't sign the job off. Please try again.",
                                );
                                if (ok) closeDialog();
                            }}
                            tone="primary"
                        >
                            Sign off
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
                            review{nextRejectionNumber < MAX_ADMIN_JOB_REJECTIONS ? " and can fix the work and resubmit it" : ""}, and
                            are charged {formatPrice(getRejectionCharge(job.amount))} ({REJECTION_CHARGE_PERCENT}% of the job) from
                            their wallet.
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
                        onReject={async (review) => {
                            await rejectJob(job.id, review);
                            toast.success(
                                nextRejectionNumber >= MAX_ADMIN_JOB_REJECTIONS
                                    ? "Job rejected for the last time"
                                    : "Job rejected. The manufacturer has your review",
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
                        onReassign={async (manufacturerIds) => {
                            const isFirst = job.manufacturerIds.length === 0;
                            await reassignJob(job.id, manufacturerIds);
                            toast.success(isFirst ? "Job assigned" : "Job reassigned");
                            closeDialog();
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={approvingStep !== null}
                onOpenChange={(open) => {
                    if (!open && !isApprovingStep) setApprovingStep(null);
                }}
            >
                <DialogContent className="max-w-120">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>
                            Approve {approvingStepConfig?.label.toLowerCase() ?? "stage"} proof?
                        </DialogTitle>
                        <DialogDescription>
                            Review the photos and note submitted by {manufacturerNames} before approving. Once approved, this stage is marked complete
                            {approvingPayment ? ` and ${formatPrice(approvingPayment.amount)} is released to their wallet` : ""}.
                        </DialogDescription>
                    </div>

                    {approvingSubmission?.note && (
                        <div className="flex flex-col gap-1.5 rounded-lg border border-mist-200 bg-mist-50/70 p-3.5">
                            <span className="text-xs font-semibold font-text text-mist-900">
                                Manufacturer&apos;s note:
                            </span>
                            <p className="text-xs leading-relaxed font-text text-mist-700 whitespace-pre-line">
                                {approvingSubmission.note}
                            </p>
                        </div>
                    )}

                    {approvingSubmission && approvingSubmission.imageUrls.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-medium font-text text-mist-600">
                                Attached photos ({approvingSubmission.imageUrls.length})
                            </p>
                            <ImagePreviewGrid
                                images={photoItems(approvingSubmission.imageUrls).map((image, idx) => ({
                                    ...image,
                                    name: `${approvingStepConfig?.label ?? "Step"} photo ${idx + 1}`,
                                }))}
                                className="grid-cols-3"
                            />
                        </div>
                    ) : (
                        <p className="text-xs font-text text-mist-500 italic">
                            No photos were attached to this submission.
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <DialogButton
                            onClick={() => setApprovingStep(null)}
                            tone="neutral"
                            disabled={isApprovingStep}
                        >
                            Cancel
                        </DialogButton>
                        <DialogButton
                            onClick={async () => {
                                if (!approvingStep) return;
                                setIsApprovingStep(true);
                                try {
                                    await approveStep(job.id, approvingStep);
                                    toast.success(`${approvingStepConfig?.label ?? "Step"} approved, payment released`);
                                    setApprovingStep(null);
                                } catch (err: unknown) {
                                    const message = getErrorMessage(err, "Couldn't approve the step. Please try again.");
                                    toast.error(message);
                                } finally {
                                    setIsApprovingStep(false);
                                }
                            }}
                            tone="primary"
                            disabled={isApprovingStep}
                        >
                            {isApprovingStep ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="size-4 animate-spin" />
                                    Approving...
                                </span>
                            ) : (
                                "Approve step"
                            )}
                        </DialogButton>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={sendingBack !== null} onOpenChange={(open) => !open && setSendingBack(null)}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>
                            Send back the {JOB_PRODUCTION_STEPS.find((step) => step.key === sendingBack)?.label.toLowerCase()} proof?
                        </DialogTitle>
                        <DialogDescription>
                            {manufacturerNames} will see why and send new photos. A stage sent back means no on-time bonus
                            for this job.
                        </DialogDescription>
                    </div>
                    <ReasonForm
                        label="What needs fixing"
                        placeholder="What's wrong with the proof, and what should the new photos show?"
                        submitLabel="Send back"
                        loadingLabel="Sending back..."
                        errorMessage="Couldn't send the proof back. Please try again."
                        onCancel={() => setSendingBack(null)}
                        onSubmit={async (reason) => {
                            if (sendingBack) {
                                await sendBackStep(job.id, sendingBack, reason);
                                toast.success("Proof sent back. The manufacturer has your reason");
                                setSendingBack(null);
                            }
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={dialog === "fault"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Report a fault?</DialogTitle>
                        <DialogDescription>
                            {manufacturerNames} will see what you found, and won&apos;t get the on-time bonus for {job.title}.
                        </DialogDescription>
                    </div>
                    <ReasonForm
                        label="The fault"
                        placeholder="What's wrong with the delivered furniture?"
                        submitLabel="Report fault"
                        loadingLabel="Reporting..."
                        errorMessage="Couldn't report the fault. Please try again."
                        onCancel={closeDialog}
                        onSubmit={async (reason) => {
                            await reportFault(job.id, reason);
                            toast.success("Fault reported. The bonus won't be paid");
                            closeDialog();
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={dialog === "delete"} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Delete {job.title}?</DialogTitle>
                        <DialogDescription>
                            The job, its notes and its assignment history are removed for everyone, including anyone it
                            was offered to. This can&apos;t be undone.
                        </DialogDescription>
                    </div>
                    <TypeToConfirmForm
                        confirmText={job.title}
                        submitLabel="Delete job"
                        loadingLabel="Deleting..."
                        errorMessage="Couldn't delete the job. Please try again."
                        onCancel={closeDialog}
                        onConfirm={async () => {
                            await deleteJob(job.id);
                            toast.success(`${job.title} was deleted`);
                            closeDialog();
                            onDeleted();
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

/**
 * Finished work the lead rated 3 stars or less: not signed off, and not
 * approved automatically, while it waits for a super admin — who signs it
 * off (keeping the rating) or rejects it.
 */
/** The job's details while it loads: the labels and Close show straight away, what comes from the job is skeletons. */
function JobDetailSkeleton() {
    const rows: [label: string, width: string][] = [
        ["Job code", "w-24"],
        ["Project lead", "w-36"],
        ["Manufacturer", "w-36"],
        ["Amount", "w-24"],
        ["Category", "w-28"],
        ["Countdown", "w-20"],
        ["Date assigned", "w-32"],
        ["Start date", "w-32"],
        ["Due date", "w-32"],
        ["Project duration", "w-20"],
        ["Status", "w-20"],
    ];

    return (
        <div className="flex h-full flex-col overflow-y-auto" aria-busy="true">
            <div className="sticky top-0 z-10 flex flex-col gap-2 bg-white px-5 pt-4 pb-4 md:px-10 md:pt-10">
                <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-7.5 w-36" />
                    <SheetClose className="flex size-8 items-center justify-center rounded-full text-mist-700 transition-colors hover:bg-mist-100 cursor-pointer">
                        <XIcon className="size-5" />
                        <span className="sr-only">Close</span>
                    </SheetClose>
                </div>
            </div>

            <div className="flex flex-col gap-8 px-5 pb-10 md:px-10">
                <div className="flex items-center justify-between gap-3 border-b border-border py-4">
                    <SheetTitle className="w-full">
                        <span className="sr-only">Job details</span>
                        <Skeleton className="h-7 w-2/3" />
                    </SheetTitle>
                </div>

                <dl className="-mt-4 flex flex-col gap-5 text-sm font-text">
                    {rows.map(([label, width]) => (
                        <DetailRow key={label} label={label}>
                            <Skeleton className={cn("h-5", width, label === "Status" && "rounded-full")} />
                        </DetailRow>
                    ))}
                    <DetailRow label="Description">
                        <span className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </span>
                    </DetailRow>
                </dl>
            </div>
        </div>
    );
}

function FurtherReviewNotice({
    review,
    canDecide,
    onSignOff,
    onReject,
}: {
    review: NonNullable<AdminJob["furtherReview"]>;
    canDecide: boolean;
    onSignOff: () => void;
    onReject: () => void;
}) {
    return (
        <section className="flex flex-col gap-3 rounded-lg border border-warning-200 bg-warning-50/60 p-4">
            <div className="flex items-start gap-2.5">
                <PauseCircle className="mt-0.5 size-5 shrink-0 text-warning-600" strokeWidth={1.75} aria-hidden />
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-sm font-semibold font-text text-mist-950">Held for further review</h3>
                    <p className="text-xs font-text text-mist-600">
                        {review.authorName} rated the finished work {review.rating} out of 5 on{" "}
                        {formatOrdinalDate(new Date(review.createdAt))}, so it wasn&apos;t signed off.
                        {canDecide ? "" : " A super admin decides."}
                    </p>
                </div>
            </div>
            <div className="flex flex-col gap-2 rounded-md bg-white px-3.5 py-3">
                <RatingStarsDisplay rating={review.rating} />
                <p className="text-sm font-text whitespace-pre-line text-mist-800">{review.comment}</p>
            </div>
            {canDecide && (
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onReject}
                        className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium font-text text-mist-900 transition-colors hover:bg-mist-50 cursor-pointer"
                    >
                        Reject
                    </button>
                    <button
                        type="button"
                        onClick={onSignOff}
                        className="rounded-md bg-secondary-700 px-3 py-1.5 text-xs font-medium font-text text-white transition-colors hover:bg-secondary-900 cursor-pointer"
                    >
                        Sign off
                    </button>
                </div>
            )}
        </section>
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
    disabled,
    children,
}: {
    onClick: () => void;
    tone: "neutral" | "primary";
    disabled?: boolean;
    children: ReactNode;
}) {
    return (
        <Button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "h-11 px-5 font-medium font-text rounded-button cursor-pointer transition-colors duration-300",
                tone === "primary" && "bg-secondary-700 hover:bg-secondary-900 text-white",
                tone === "neutral" && "bg-mist-100 hover:bg-mist-200 text-mist-950",
            )}
        >
            {children}
        </Button>
    );
}

type MenuItem = {
    label: string;
    icon: ReactNode;
    onSelect: () => void;
    tone?: "danger";
    /** Why it can't be done now — shown under it, greyed out. */
    disabledReason?: string | null;
};

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
                        disabled={!!item.disabledReason}
                        onClick={() => {
                            setIsOpen(false);
                            item.onSelect();
                        }}
                        className={cn(
                            "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium font-text transition-colors [&>svg]:mt-0.5 [&>svg]:shrink-0",
                            item.disabledReason
                                ? "cursor-not-allowed text-mist-300"
                                : item.tone === "danger"
                                  ? "text-error-600 hover:bg-error-50 cursor-pointer"
                                  : "text-mist-700 hover:bg-mist-50 hover:text-mist-950 cursor-pointer",
                        )}
                    >
                        {item.icon}
                        <span className="flex flex-col">
                            {item.label}
                            {item.disabledReason && (
                                <span className="text-xs font-normal text-mist-400">{item.disabledReason}</span>
                            )}
                        </span>
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
}
