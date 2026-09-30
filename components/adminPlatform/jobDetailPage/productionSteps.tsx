import Image from "next/image";
import Link from "next/link";
import { Check, Clock, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { getRelativeTimeLabel, getTimeUntilLabel } from "@/lib/date";
import { getAdminJobPayments, type AdminJob } from "@/constant/admin";
import {
    JOB_PRODUCTION_STEPS,
    getAutoApproveAt,
    getStepProgress,
    type ProductionStepKey,
    type StepProgress,
    type StepSubmission,
} from "@/constant/jobWorkflow";
import { DetailSection, ImagePreviewGrid } from "./detailParts";
import { photoItems } from "./workReview";

/**
 * Every production step and where it stands — approved (when, and what it
 * paid), proof waiting for review (with Approve / Send back for the lead,
 * and when it approves itself), sent back, the one the manufacturer is on,
 * or still to come.
 */
export default function ProductionSteps({
    job,
    canReview,
    leadNames,
    onApprove,
    onSendBack,
}: {
    job: AdminJob;
    canReview: boolean;
    leadNames: string;
    onApprove: (step: ProductionStepKey) => void;
    onSendBack: (step: ProductionStepKey) => void;
}) {
    const steps = getStepProgress(job.stepSubmissions);
    const approvedCount = steps.filter((step) => step.state === "approved").length;
    const { payments } = getAdminJobPayments(job);

    return (
        <DetailSection
            title="Production steps"
            action={
                <span className="text-xs font-text text-mist-500">
                    {approvedCount} of {JOB_PRODUCTION_STEPS.length} approved
                </span>
            }
        >
            <ol className="flex flex-col">
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    const latest = step.submissions.at(-1);
                    const payment = payments.find((candidate) => candidate.milestone === step.key);
                    return (
                        <li
                            key={step.key}
                            aria-current={step.state === "current" || step.state === "in-review" ? "step" : undefined}
                            className="flex gap-3"
                        >
                            <div className="flex flex-col items-center">
                                <StepIcon state={step.state} />
                                {!isLast && (
                                    <span
                                        className={cn(
                                            "my-1 min-h-4 w-0.5 flex-1 rounded-full",
                                            step.state === "approved" ? "bg-primary-600" : "bg-mist-200",
                                        )}
                                    />
                                )}
                            </div>
                            <div className={cn("flex min-w-0 flex-1 flex-col gap-2", !isLast && "pb-5")}>
                                <div className="flex items-start justify-between gap-3">
                                    <span
                                        className={cn(
                                            "text-sm font-text",
                                            step.state === "upcoming" ? "text-mist-400" : "font-medium text-mist-950",
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                    <StepStatus step={step} latest={latest} />
                                </div>

                                {step.state === "approved" && latest?.review && (
                                    <p className="text-xs font-text text-mist-500">
                                        {latest.review.by ? `Approved by ${latest.review.by}` : "Approved automatically"}
                                        {payment && ` · ${formatPrice(payment.amount)} released`}
                                    </p>
                                )}

                                {step.state === "sent-back" && latest?.review && (
                                    <div className="flex flex-col gap-1 rounded-lg bg-error-50 px-3 py-2.5 text-xs leading-5 font-text">
                                        <p className="text-error-700">{latest.review.reason}</p>
                                        <p className="text-mist-500">Waiting for new proof from the manufacturer.</p>
                                    </div>
                                )}

                                {step.state === "in-review" && latest && (
                                    <ProofForReview
                                        submission={latest}
                                        label={step.label}
                                        paymentAmount={payment?.amount}
                                        canReview={canReview}
                                        leadNames={leadNames}
                                        onApprove={() => onApprove(step.key)}
                                        onSendBack={() => onSendBack(step.key)}
                                    />
                                )}

                                {(step.state === "approved" || step.state === "sent-back") && latest && (
                                    <>
                                        {latest.note && <ProofNote note={latest.note} />}
                                        <ProofThumbnails submission={latest} label={step.label} />
                                    </>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </DetailSection>
    );
}

function StepIcon({ state }: { state: StepProgress["state"] }) {
    return (
        <span
            className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full",
                state === "approved" && "bg-primary-600 text-white",
                state === "in-review" && "bg-warning-50 text-warning-600 ring-2 ring-warning-400",
                state === "sent-back" && "bg-error-50 text-error-600 ring-2 ring-error-400",
                state === "current" && "border-2 border-secondary-700 bg-white",
                state === "upcoming" && "border-2 border-mist-200 bg-white",
            )}
        >
            {state === "approved" && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
            {state === "in-review" && <Clock className="size-3.5" strokeWidth={2.5} aria-hidden />}
            {state === "sent-back" && <Undo2 className="size-3.5" strokeWidth={2.5} aria-hidden />}
            {state === "current" && (
                <span className="size-2 animate-pulse rounded-full bg-secondary-700 motion-reduce:animate-none" />
            )}
        </span>
    );
}

/** What happened to the step, and when — "Approved 2 days ago", "Waiting for review", … */
function StepStatus({ step, latest }: { step: StepProgress; latest: StepSubmission | undefined }) {
    const className = "shrink-0 text-xs font-text";
    switch (step.state) {
        case "approved":
            return (
                <span className={cn(className, "text-primary-700")}>
                    Approved {latest?.review ? getRelativeTimeLabel(new Date(latest.review.at)) : ""}
                </span>
            );
        case "in-review":
            return <span className={cn(className, "font-medium text-warning-700")}>Waiting for review</span>;
        case "sent-back":
            return (
                <span className={cn(className, "text-error-600")}>
                    Sent back {latest?.review ? getRelativeTimeLabel(new Date(latest.review.at)) : ""}
                </span>
            );
        case "current":
            return <span className={cn(className, "font-medium text-secondary-700")}>Manufacturer is here</span>;
        default:
            return <span className={cn(className, "text-mist-400")}>To do</span>;
    }
}

/** Proof waiting for the lead — the photos, when it approves itself, and the lead's two choices. */
function ProofForReview({
    submission,
    label,
    paymentAmount,
    canReview,
    leadNames,
    onApprove,
    onSendBack,
}: {
    submission: StepSubmission;
    label: string;
    paymentAmount: number | undefined;
    canReview: boolean;
    leadNames: string;
    onApprove: () => void;
    onSendBack: () => void;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-lg border border-warning-200 bg-warning-50/40 p-3.5">
            <p className="text-xs leading-5 font-text text-mist-600">
                Sent {getRelativeTimeLabel(new Date(submission.submittedAt))}. If no one reviews it, it&apos;s approved
                automatically {getTimeUntilLabel(getAutoApproveAt(submission.submittedAt))}
                {paymentAmount ? ` and ${formatPrice(paymentAmount)} is released` : ""}.
            </p>
            {submission.note && <ProofNote note={submission.note} />}
            <ImagePreviewGrid
                images={photoItems(submission.imageUrls).map((image) => ({ ...image, name: `${label} ${image.name.toLowerCase()}` }))}
                className="grid-cols-3"
            />
            {canReview ? (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onApprove}
                        className="flex items-center gap-1.5 rounded-md bg-secondary-700 px-3 py-1.5 text-xs font-medium font-text text-white transition-colors hover:bg-secondary-900 cursor-pointer"
                    >
                        <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                        Approve
                    </button>
                    <button
                        type="button"
                        onClick={onSendBack}
                        className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium font-text text-mist-700 transition-colors hover:bg-mist-50 cursor-pointer"
                    >
                        <Undo2 className="size-3.5" strokeWidth={2.5} aria-hidden />
                        Send back
                    </button>
                </div>
            ) : (
                <p className="text-xs font-text text-mist-500">
                    {leadNames ? `Admins like ${leadNames} review and approve production steps for payout.` : "Admins review and approve production steps for payout."}
                </p>
            )}
        </div>
    );
}

/** What the manufacturer wrote with the proof. */
function ProofNote({ note }: { note: string }) {
    return (
        <p className="rounded-lg bg-mist-50 px-3 py-2 text-xs leading-5 font-text text-mist-700">
            <span className="font-medium text-mist-900">Manufacturer&apos;s note: </span>
            {note}
        </p>
    );
}

/** Small thumbnails of a step's proof — each opens full size. */
function ProofThumbnails({ submission, label }: { submission: StepSubmission; label: string }) {
    return (
        <ul className="flex gap-2">
            {submission.imageUrls.map((url, index) => (
                <li key={`${url}-${index}`}>
                    <Link
                        href={url}
                        target="_blank"
                        title={`${label} proof ${index + 1} — open full size`}
                        className="relative block size-11 overflow-hidden rounded-md border border-border bg-mist-50"
                    >
                        <Image src={url} alt={`${label} proof ${index + 1}`} fill unoptimized sizes="44px" className="object-cover" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}
