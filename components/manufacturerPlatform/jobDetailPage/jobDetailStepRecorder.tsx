"use client";

import { CheckIcon, Clock, Undo2, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { getRelativeTimeLabel, getTimeUntilLabel } from "@/lib/date";
import type { ProductionStep } from "@/constant/manufacturer";
import {
    MAX_STEP_PROOF_PHOTOS,
    getAutoApproveAt,
    type JobPayment,
    type ProductionStepKey,
    type StepProgress,
} from "@/constant/jobWorkflow";
import JobDetailCompletionUpload from "@/components/manufacturerPlatform/form/jobDetailCompletionUploadForm";

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailStepRecorder — the manufacturer's production steps, in order. The
// step they're on takes up to MAX_STEP_PROOF_PHOTOS photos as proof; the lead
// approves it (the next step opens, and any payment it carries goes to their
// wallet) or sends it back with a reason, for new proof. Proof waiting over a
// day is approved automatically, Sundays aside. The derived "Rejected" /
// "Redeliver" steps (tone "danger" shows red with an X) follow the
// production steps once the finished work has been reviewed.
// ─────────────────────────────────────────────────────────────────────────────

export default function JobDetailStepRecorder({
    steps,
    completedCount,
    progress,
    payments,
    onSubmitProof,
    readOnly = false,
}: {
    /** The production steps, then any derived rejection steps. */
    steps: ProductionStep[];
    /** Steps are completed in order, so the first `completedCount` are done. */
    completedCount: number;
    /** Where each production step stands. */
    progress: StepProgress[];
    payments: JobPayment[];
    onSubmitProof: (step: ProductionStepKey, imageUrls: string[], note?: string) => void;
    readOnly?: boolean;
}) {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold font-text text-mist-950">Production steps</h3>
            <ol className="flex flex-col">
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    const stepProgress = progress.find((candidate) => candidate.key === step.key);
                    const payment = payments.find((candidate) => candidate.milestone === step.key);

                    return (
                        <li key={step.key} className="flex flex-col">
                            {stepProgress ? (
                                <ProductionStepRow
                                    step={stepProgress}
                                    payment={payment}
                                    readOnly={readOnly}
                                    onSubmitProof={(imageUrls, note) => onSubmitProof(stepProgress.key, imageUrls, note)}
                                />
                            ) : (
                                <ReviewStepRow step={step} isComplete={index < completedCount} />
                            )}
                            {!isLast && (
                                <span
                                    className={cn(
                                        "ml-3 h-4 w-px border-l border-dashed",
                                        (stepProgress ? stepProgress.state === "approved" : index < completedCount)
                                            ? "border-primary-300"
                                            : "border-mist-200",
                                    )}
                                    aria-hidden
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function ProductionStepRow({
    step,
    payment,
    readOnly,
    onSubmitProof,
}: {
    step: StepProgress;
    payment: JobPayment | undefined;
    readOnly: boolean;
    onSubmitProof: (imageUrls: string[], note?: string) => void;
}) {
    const latest = step.submissions.at(-1);
    const canSendProof = !readOnly && (step.state === "current" || step.state === "sent-back");
    const paysLabel = payment ? `${formatPrice(payment.amount)} goes to your wallet` : null;

    return (
        <div className="flex flex-col gap-2 py-1.5">
            <div className="flex items-center gap-3">
                <span
                    className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        step.state === "approved" && "bg-primary-500 border-primary-500 text-white",
                        step.state === "in-review" && "border-amber-400 bg-amber-50 text-amber-600",
                        step.state === "sent-back" && "border-red-400 bg-red-50 text-red-600",
                        step.state === "current" && (readOnly ? "border-mist-200" : "border-primary-500"),
                        step.state === "upcoming" && "border-mist-200",
                    )}
                >
                    {step.state === "approved" && <CheckIcon className="size-3.5" strokeWidth={3} />}
                    {step.state === "in-review" && <Clock className="size-3.5" strokeWidth={2.5} />}
                    {step.state === "sent-back" && <Undo2 className="size-3.5" strokeWidth={2.5} />}
                </span>
                <span
                    className={cn(
                        "text-sm font-text",
                        step.state === "upcoming" || (step.state === "current" && readOnly)
                            ? "text-mist-400"
                            : "font-medium text-mist-950",
                    )}
                >
                    {step.label}
                </span>
                <span
                    className={cn(
                        "ml-auto text-right text-xs font-text",
                        step.state === "approved" && "text-primary-600",
                        step.state === "in-review" && "text-amber-700",
                        step.state === "sent-back" && "text-red-600",
                        step.state === "current" && "text-primary-600",
                    )}
                >
                    {step.state === "approved" && latest?.review && `Approved ${getRelativeTimeLabel(new Date(latest.review.at))}`}
                    {step.state === "in-review" && "Waiting for review"}
                    {step.state === "sent-back" && latest?.review && `Sent back ${getRelativeTimeLabel(new Date(latest.review.at))}`}
                    {step.state === "current" && !readOnly && "You're here"}
                </span>
            </div>

            <div className="ml-9 flex flex-col gap-2">
                {step.state === "approved" && latest?.review && (
                    <p className="text-xs font-text text-mist-500">
                        {latest.review.by ? `Approved by ${latest.review.by}` : "Approved automatically"}
                        {payment && ` · ${formatPrice(payment.amount)} paid to your wallet`}
                    </p>
                )}

                {step.state === "in-review" && latest && (
                    <p className="text-xs font-text text-mist-500">
                        Sent {getRelativeTimeLabel(new Date(latest.submittedAt))}. If it isn&apos;t reviewed, it&apos;s approved
                        automatically {getTimeUntilLabel(getAutoApproveAt(latest.submittedAt))}
                        {paysLabel ? ` and ${paysLabel}` : ""}.
                    </p>
                )}

                {step.state === "sent-back" && latest?.review?.reason && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-text text-red-700">
                        {latest.review.reason}
                    </p>
                )}

                {latest?.note && step.state !== "current" && step.state !== "upcoming" && (
                    <p className="rounded-lg bg-mist-50 px-3 py-2 text-xs font-text text-mist-700">
                        <span className="font-medium text-mist-900">Your note: </span>
                        {latest.note}
                    </p>
                )}

                {latest && step.state !== "current" && step.state !== "upcoming" && (
                    <div className="flex gap-2">
                        {latest.imageUrls.map((url, index) => (
                            // eslint-disable-next-line @next/next/no-img-element -- may be a client-side blob: URL from the upload form
                            <img
                                key={`${url}-${index}`}
                                src={url}
                                alt={`${step.label} proof ${index + 1}`}
                                className="size-12 rounded-lg object-cover border border-border"
                            />
                        ))}
                    </div>
                )}

                {canSendProof && (
                    <JobDetailCompletionUpload
                        title={step.state === "sent-back" ? `New proof of the ${step.label.toLowerCase()}` : `Proof of the ${step.label.toLowerCase()}`}
                        description={`At least 3 photos (up to ${MAX_STEP_PROOF_PHOTOS}) of this step. Once it's approved, ${
                            paysLabel ? `${paysLabel} and ` : ""
                        }the next step opens.`}
                        photoLabel={`${step.label} photos`}
                        withNote
                        submitLabel="Send for review"
                        onComplete={onSubmitProof}
                    />
                )}
            </div>
        </div>
    );
}

/** A derived "Rejected" / "Redeliver" step — done, or still to come. */
function ReviewStepRow({ step, isComplete }: { step: ProductionStep; isComplete: boolean }) {
    const isDanger = step.tone === "danger";
    return (
        <div className="flex items-center gap-3 py-1.5">
            <span
                className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isComplete
                        ? isDanger
                            ? "bg-red-500 border-red-500"
                            : "bg-primary-500 border-primary-500"
                        : "border-mist-200",
                )}
            >
                {isComplete &&
                    (isDanger ? (
                        <XIcon className="size-3.5 text-white" strokeWidth={3} />
                    ) : (
                        <CheckIcon className="size-3.5 text-white" strokeWidth={3} />
                    ))}
            </span>
            <span
                className={cn(
                    "text-sm font-text",
                    isComplete && isDanger
                        ? "font-medium text-red-600"
                        : isComplete
                          ? "font-medium text-mist-950"
                          : "text-mist-400",
                )}
            >
                {step.label}
            </span>
        </div>
    );
}
