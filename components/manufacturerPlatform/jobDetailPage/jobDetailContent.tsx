"use client";

import { type ReactNode, useState } from "react";
import { CheckCircle2, Paperclip } from "lucide-react";
import { StatusBadge } from "@/components/customTable/statusBadge";
import { TableDialog } from "@/components/customTable/tableDialog";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/ui/userAvatar";
import JobDetailHeaderActions from "./jobDetailHeaderActions";
import JobDetailStepRecorder from "./jobDetailStepRecorder";
import JobDetailRejections from "./jobDetailRejections";
import JobDetailCallAssignee from "./jobDetailCallAssignee";
import JobDetailPayments from "./jobDetailPayments";
import JobDetailLeadReview, { HeldForReviewNote } from "./jobDetailLeadReview";
import JobDetailNotes from "./jobDetailNotes";
import JobDetailCompletionUpload from "@/components/manufacturerPlatform/form/jobDetailCompletionUploadForm";
import CancelJobForm from "@/components/manufacturerPlatform/form/cancelJobForm";
import ReportDelayForm from "@/components/manufacturerPlatform/form/reportDelayForm";
import DeclineJobForm from "@/components/manufacturerPlatform/form/declineJobForm";
import { useJobDetailState } from "./useJobDetailState";
import { useManufacturerAccount } from "../dashboardLayout/manufacturerAccountContext";
import { JOB_DETAIL_PRIMARY_BUTTON_CLASS } from "./styles";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDuration, formatOrdinalDate, getCountdownLabel } from "@/lib/date";
import { formatPrice } from "@/lib/currency";
import {
    JOB_STATUS_CONFIG,
    isActiveJob,
    getJobCategoryLabel,
    getJobSteps,
    type Job,
} from "@/constant/manufacturer";
import {
    MAX_EXTENSION_PERCENT,
    getJobPayments,
    getLatestAllowedDueDate,
    getOriginalDueDate,
    getStepProgress,
    type JobBonus,
    type JobPayment,
} from "@/constant/jobWorkflow";
import { useMyJobList } from "@/components/manufacturerPlatform/dashboardLayout/useManufacturerJobLists";

type DialogKind = "reportDelay" | "cancelJob" | "declineJob" | null;

const COMPLETION_UPLOAD_ID = "job-detail-completion-upload";

/**
 * The job's payments and bonus: the API's own (it decides what's paid), or,
 * only if it didn't send them, worked out from the job.
 */
function getPaymentsOf(job: Job): { payments: JobPayment[]; bonus: JobBonus | null } {
    if (job.payments) return { payments: job.payments, bonus: job.bonus ?? null };
    if (!job.dueDate) return { payments: [], bonus: null };
    return getJobPayments({
        amount: job.price,
        dueDate: job.dueDate,
        acceptedAt: job.dateAssigned,
        stepSubmissions: job.stepSubmissions,
        signedOffAt: job.completedAt ?? null,
        rejectionCount: job.rejections?.length ?? 0,
        faultReport: job.faultReport ?? null,
    });
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <dt className="text-mist-400 shrink-0">{label}</dt>
            <dd className="text-mist-900 font-medium text-right">{value}</dd>
        </div>
    );
}

export default function JobDetailContent({ job, closeSlot }: { job: Job; closeSlot: ReactNode }) {
    const {
        state,
        maxRejections,
        canCancel,
        isResponding,
        acceptJob,
        declineJob,
        cancelJob,
        reportDelay,
        submitStepProof,
        uploadCompletionPhoto,
        resubmitForReview,
        addNote,
    } = useJobDetailState(job);

    const [dialog, setDialog] = useState<DialogKind>(null);

    const statusConfig = JOB_STATUS_CONFIG[state.status];
    const { steps: productionSteps, completedCount: completedStepCount } = getJobSteps({ ...state, maxRejections });
    const stepProgress = getStepProgress(state.stepSubmissions);
    // Every step approved: the API says so with no current step left (it sends one while the job is theirs)
    const allStepsComplete =
        job.currentStep !== undefined && state.status === "in-progress"
            ? job.currentStep === null
            : stepProgress.every((step) => step.state === "approved");
    const { payments, bonus } = getPaymentsOf(job);
    const rules = job.rules ?? null;
    const progressPercent = Math.round(
        (completedStepCount / productionSteps.length) * 100,
    );
    const completionImageUrls = state.completionImageUrls ?? [];
    // Flagged: one job at a time, so an offer can't be accepted while another
    // job is underway (a suspended account doesn't get this far — AccountGate)
    const { isFlagged } = useManufacturerAccount();
    const { jobs: myJobs } = useMyJobList();
    const hasOtherJob = myJobs.some((other) => other.id !== job.id && other.status !== "pending" && isActiveJob(other));
    const acceptBlocker =
        isFlagged && hasOtherJob
            ? "Your account is flagged: you can hold one job at a time. Finish your current job to accept this one."
            : null;
    const canMarkAsDone =
        state.status === "in-progress" && allStepsComplete && completionImageUrls.length === 0;
    const isPending = state.status === "pending";
    // Accepted a shared job: it starts once the other manufacturer(s) accept too
    const isAwaitingOthers = isPending && !!job.awaitingOthers;
    const isCancelled = state.status === "cancelled";
    const isRejected = state.status === "rejected";
    const canResubmit = isRejected && state.rejections.length < maxRejections;
    const showHeaderActions = state.status === "in-progress";
    const notes = job.notes ?? [];
    // The API takes notes from a manufacturer only while the job is theirs (not an offer, not cancelled)
    const canAddNote = !isPending && !isCancelled;
    const dueDate = job.dueDate ? new Date(job.dueDate) : null;
    // The job's length runs from its planned start (or when they accepted) to the due date
    const start = job.startDate ?? state.dateAssigned;
    const originalDueDate = job.dueDate ? getOriginalDueDate(job.dueDate, state.extensionRequests) : null;
    // The API checks the limit too; the job's own rules say what it is
    const maxExtensionPercent = rules?.maxExtensionPercent ?? MAX_EXTENSION_PERCENT;
    const latestDueDate =
        start && originalDueDate ? getLatestAllowedDueDate(start, originalDueDate, maxExtensionPercent) : dueDate;
    const pendingExtension = state.extensionRequests.find((request) => request.status === "pending");
    const latestApprovedExtension = state.extensionRequests.find((request) => request.status === "approved");
    // Room for a later date only if the limit falls on a later day
    const canExtend =
        !!latestDueDate && !!dueDate && new Date(latestDueDate.toDateString()) > new Date(dueDate.toDateString());

    const closeDialog = () => {
        setDialog(null);
    };

    return (
        <div className="flex h-full flex-col">
            {state.banner && (
                <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium font-text text-primary-700">
                    <CheckCircle2 className="size-4 shrink-0" />
                    {state.banner}
                </div>
            )}


            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border">
                {showHeaderActions ? (
                    <JobDetailHeaderActions
                        canMarkAsDone={canMarkAsDone}
                        onMarkAsDoneClick={() =>
                            document
                                .getElementById(COMPLETION_UPLOAD_ID)
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                })
                        }
                        onReportDelay={() => setDialog("reportDelay")}
                        onCancelJob={() => setDialog("cancelJob")}
                        canCancel={canCancel}
                    />
                ) : (
                    <span />
                )}
                {closeSlot}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">
                <h1 className="text-xl font-semibold font-text text-mist-950">
                    {job.title}
                </h1>

                <dl className="flex flex-col gap-3 text-sm font-text">
                    <DetailRow label="Job code" value={job.code} />
                    <DetailRow label="Job price" value={formatPrice(job.price)} />
                    <DetailRow label="Category" value={getJobCategoryLabel(job.category)} />

                    <DetailRow
                        label="Project lead"
                        value={
                            job.assignee ? (
                                <span className="flex items-center gap-2">
                                    <UserAvatar
                                        name={job.assignee.name}
                                        className="size-6 text-[10px]"
                                    />
                                    {job.assignee.name}
                                </span>
                            ) : (
                                "Unassigned"
                            )
                        }
                    />

                    {/* Mobile: countdown only. Desktop: percentage bar. */}
                    {dueDate && (
                        <div className="md:hidden">
                            <DetailRow
                                label="Countdown"
                                value={getCountdownLabel(dueDate)}
                            />
                        </div>
                    )}
                    <div className="hidden md:flex items-center justify-between gap-4">
                        <dt className="text-mist-400 shrink-0">Progress</dt>
                        <dd className="flex items-center gap-2">
                            <span className="text-mist-900 font-medium">
                                {progressPercent}%
                            </span>
                            <span className="h-1.5 w-24 rounded-full bg-mist-100 overflow-hidden">
                                <span
                                    className="block h-full rounded-full bg-mist-900"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </span>
                        </dd>
                    </div>

                    <DetailRow
                        label="Date assigned"
                        value={
                            state.dateAssigned
                                ? formatOrdinalDate(
                                      new Date(state.dateAssigned),
                                  )
                                : "Yet to be assigned"
                        }
                    />
                    {dueDate && (
                    <DetailRow
                        label="Due date"
                        value={
                            <span className="flex flex-col items-end gap-1">
                                {formatOrdinalDate(dueDate)}
                                {latestApprovedExtension && (
                                    <span className="text-xs font-normal text-mist-500">
                                        Extended from{" "}
                                        {formatOrdinalDate(new Date(latestApprovedExtension.previousDueDate))}
                                    </span>
                                )}
                                {pendingExtension && (
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-normal text-amber-700">
                                        {formatOrdinalDate(new Date(pendingExtension.requestedDueDate))} requested
                                    </span>
                                )}
                            </span>
                        }
                    />
                    )}
                    {start && dueDate && (
                        <DetailRow
                            label="Project duration"
                            value={formatDuration(new Date(start), dueDate)}
                        />
                    )}
                    <DetailRow
                        label="Status"
                        value={
                            <StatusBadge
                                label={statusConfig.badgeLabel}
                                tone={statusConfig.tone}
                                variant="pill"
                            />
                        }
                    />

                    <div className="flex flex-col gap-1">
                        <dt className="text-mist-400">Description</dt>
                        <dd className="text-mist-700">{job.description}</dd>
                    </div>
                    {job.deliveryLocation && (
                        <div className="flex flex-col gap-1">
                            <dt className="text-mist-400">Delivery location</dt>
                            <dd className="text-mist-700">
                                {[job.deliveryLocation.city, job.deliveryLocation.state].filter(Boolean).join(", ")}
                            </dd>
                        </div>
                    )}
                </dl>

                {state.status === "in-review" && job.isHeldForReview && <HeldForReviewNote />}

                <JobDetailRejections
                    rejections={state.rejections}
                    status={state.status}
                    jobTitle={job.title}
                    maxRejections={maxRejections}
                    rejectionChargePercent={rules?.rejectionChargePercent ?? null}
                />

                {job.attachments.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold font-text text-mist-950">
                            Attachments ({job.attachments.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {job.attachments.map((attachment) => (
                                <Link
                                    key={attachment.name}
                                    href={attachment.url}
                                    target="_blank"
                                    title={attachment.name}
                                >
                                    <span className="flex items-center gap-1.5 rounded-lg bg-mist-50 border border-border px-3 py-2 text-xs font-text text-mist-700">
                                        <Paperclip className="size-3.5 text-mist-400" />
                                        {attachment.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {!isPending && !isCancelled && (
                    <JobDetailStepRecorder
                        steps={productionSteps}
                        completedCount={completedStepCount}
                        progress={stepProgress}
                        payments={payments}
                        reviewWindowHours={rules?.reviewWindowHours ?? null}
                        onSubmitProof={submitStepProof}
                        readOnly={state.status !== "in-progress"}
                    />
                )}

                {canMarkAsDone && (
                    <div id={COMPLETION_UPLOAD_ID}>
                        <JobDetailCompletionUpload
                            onComplete={uploadCompletionPhoto}
                        />
                    </div>
                )}

                {completionImageUrls.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold font-text text-mist-950">
                            {isRejected ? "Previously uploaded" : "Finished furniture"}
                        </h3>
                        <div
                            className={cn(
                                "grid gap-2",
                                completionImageUrls.length > 1 && "grid-cols-2",
                            )}
                        >
                            {completionImageUrls.map((url, index) => (
                                // eslint-disable-next-line @next/next/no-img-element -- may be a client-side blob: URL from the upload form
                                <img
                                    key={url}
                                    src={url}
                                    alt={`${job.title} photo ${index + 1}`}
                                    className={cn(
                                        "w-full rounded-xl object-cover border border-border",
                                        completionImageUrls.length > 1
                                            ? "aspect-square"
                                            : "max-h-64",
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {canResubmit && (
                    <JobDetailCompletionUpload
                        title="Upload new proof"
                        description="Fix the issues above, then upload new photos of the finished furniture to resubmit this job for review."
                        submitLabel="Resubmit for review"
                        onComplete={resubmitForReview}
                    />
                )}

                {!isCancelled && payments.length > 0 && (
                    <JobDetailPayments
                        amount={job.price}
                        dueDate={job.dueDate}
                        payments={payments}
                        bonus={bonus}
                        progress={stepProgress}
                        faultReport={job.faultReport ?? null}
                        reviewWindowHours={rules?.reviewWindowHours ?? null}
                        faultReportDays={rules?.faultReportDays ?? null}
                    />
                )}

                {state.status === "completed" && <JobDetailLeadReview job={job} />}

                {(canAddNote || notes.length > 0) && (
                    <JobDetailNotes notes={notes} canAddNote={canAddNote} addNote={addNote} />
                )}

                {!isCancelled && (
                    <JobDetailCallAssignee assignee={job.assignee} />
                )}
            </div>

            {isAwaitingOthers && (
                <div role="status" className="flex flex-col gap-1 border-t border-border px-4 py-4">
                    <p className="text-sm font-medium font-text text-mist-950">You&apos;ve accepted this job</p>
                    <p className="text-xs font-text text-mist-600">
                        It&apos;s shared with another manufacturer, so it starts once they accept too. Your first
                        payment goes into your wallet then.
                    </p>
                </div>
            )}

            {isPending && !isAwaitingOthers && (
                <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
                    {acceptBlocker && <p className="text-xs font-text text-mist-600">{acceptBlocker}</p>}
                    <div className="flex items-center gap-3">
                        <Button
                            className={`flex-1 ${JOB_DETAIL_PRIMARY_BUTTON_CLASS}`}
                            disabled={!!acceptBlocker || isResponding}
                            onClick={acceptJob}
                        >
                            Accept job
                        </Button>
                        <Button variant="outline" className="flex-1" disabled={isResponding} onClick={() => setDialog("declineJob")}>
                            Decline
                        </Button>
                    </div>
                </div>
            )}

            <TableDialog
                open={dialog === "reportDelay"}
                onClose={closeDialog}
                title="Report Delay"
                variant="edit"
            >
                {pendingExtension ? (
                    <p className="text-sm text-mist-600">
                        You&apos;ve asked to move the due date to{" "}
                        {formatOrdinalDate(new Date(pendingExtension.requestedDueDate))}. Your project lead will
                        approve or reject it, and you can ask again once they have.
                    </p>
                ) : !start || !canExtend || !job.dueDate || !latestDueDate || !originalDueDate ? (
                    <p className="text-sm text-mist-600">
                        The due date can&apos;t move any further. It&apos;s already been pushed back by the most
                        allowed{rules ? `, ${rules.maxExtensionPercent}% of the job's original length` : ""}. Call
                        your project assistant if you need to talk it through.
                    </p>
                ) : (
                    <ReportDelayForm
                        dueDate={job.dueDate}
                        latestDueDate={latestDueDate}
                        start={start}
                        originalDueDate={originalDueDate}
                        maxExtensionPercent={maxExtensionPercent}
                        reportDelay={reportDelay}
                        closeDialog={closeDialog}
                    />
                )}
            </TableDialog>

            <TableDialog
                open={dialog === "declineJob"}
                onClose={closeDialog}
                title="Decline this job?"
                variant="delete"
            >
                <DeclineJobForm declineJob={declineJob} closeDialog={closeDialog} />
            </TableDialog>

            <TableDialog
                open={dialog === "cancelJob"}
                onClose={closeDialog}
                title="Why are you canceling this job?"
                variant="delete"
            >
                <CancelJobForm
                    cancelJob={cancelJob}
                    closeDialog={closeDialog}
                />
            </TableDialog>
        </div>
    );
}