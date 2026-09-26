"use client";

import { type ReactNode, useState } from "react";
import { CheckCircle2, Paperclip } from "lucide-react";
import { StatusBadge } from "@/components/customTable/statusBadge";
import { TableDialog } from "@/components/customTable/tableDialog";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/manufacturerPlatform/dashboardLayout/userAvatar";
import JobDetailHeaderActions from "./jobDetailHeaderActions";
import JobDetailStepRecorder from "./jobDetailStepRecorder";
import JobDetailRejections from "./jobDetailRejections";
import JobDetailCallAssignee from "./jobDetailCallAssignee";
import JobDetailCompletionUpload from "@/components/manufacturerPlatform/form/jobDetailCompletionUploadForm";
import CancelJobForm from "@/components/manufacturerPlatform/form/cancelJobForm";
import ReportDelayForm from "@/components/manufacturerPlatform/form/reportDelayForm";
import { useJobDetailState } from "./useJobDetailState";
import { JOB_DETAIL_PRIMARY_BUTTON_CLASS } from "./styles";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatOrdinalDate, getCountdownLabel } from "@/lib/date";
import { formatPrice } from "@/lib/currency";
import {
    JOB_PRODUCTION_STEPS,
    JOB_STATUS_CONFIG,
    MAX_JOB_REJECTIONS,
    getJobCategoryLabel,
    getJobSteps,
    type Job,
} from "@/constant/manufacturer";

type DialogKind = "reportDelay" | "purchaseMaterials" | "cancelJob" | null;

const COMPLETION_UPLOAD_ID = "job-detail-completion-upload";

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
        acceptJob,
        declineJob,
        cancelJob,
        reportDelay,
        purchaseMaterials,
        completeStep,
        uploadCompletionPhoto,
        resubmitForReview,
    } = useJobDetailState(job);

    const [dialog, setDialog] = useState<DialogKind>(null);

    const statusConfig = JOB_STATUS_CONFIG[state.status];
    const { steps: productionSteps, completedCount: completedStepCount } = getJobSteps(state);
    const allStepsComplete = JOB_PRODUCTION_STEPS.every((step) =>
        state.completedStepKeys.includes(step.key),
    );
    const progressPercent = Math.round(
        (completedStepCount / productionSteps.length) * 100,
    );
    const completionImageUrls = state.completionImageUrls ?? [];
    const canMarkAsDone =
        state.status === "in-progress" && allStepsComplete && completionImageUrls.length === 0;
    const isPending = state.status === "pending";
    const isCancelled = state.status === "cancelled";
    const isRejected = state.status === "rejected";
    const canResubmit = isRejected && state.rejections.length < MAX_JOB_REJECTIONS;
    const showHeaderActions = state.status === "in-progress";
    const dueDate = new Date(job.dueDate);

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
                        onPurchaseMaterials={() =>
                            setDialog("purchaseMaterials")
                        }
                        onCancelJob={() => setDialog("cancelJob")}
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
                        label="Assignee"
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
                    <div className="md:hidden">
                        <DetailRow
                            label="Countdown"
                            value={getCountdownLabel(dueDate)}
                        />
                    </div>
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
                    <DetailRow
                        label="Due date"
                        value={formatOrdinalDate(dueDate)}
                    />
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
                </dl>

                <JobDetailRejections
                    rejections={state.rejections}
                    status={state.status}
                    jobTitle={job.title}
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
                        onCompleteStep={completeStep}
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

                {!isCancelled && (
                    <JobDetailCallAssignee assignee={job.assignee} />
                )}
            </div>

            {isPending && (
                <div className="flex items-center gap-3 border-t border-border px-4 py-4">
                    <Button
                        className={`flex-1 ${JOB_DETAIL_PRIMARY_BUTTON_CLASS}`}
                        onClick={acceptJob}
                    >
                        Accept job
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={declineJob}
                    >
                        Decline
                    </Button>
                </div>
            )}

            <TableDialog
                open={dialog === "reportDelay"}
                onClose={closeDialog}
                title="Report Delay"
                variant="edit"
            >
                <ReportDelayForm
                    reportDelay={reportDelay}
                    closeDialog={closeDialog}
                />
            </TableDialog>

            <TableDialog
                open={dialog === "purchaseMaterials"}
                onClose={closeDialog}
                onConfirm={() => {
                    purchaseMaterials();
                    closeDialog();
                }}
                title="Purchase materials"
                confirmLabel="Purchase"
                variant="edit"
            >
                <p>
                    Itinerary of items needed is pre-calculated per product and
                    cost of material is removed from pay out.
                </p>
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