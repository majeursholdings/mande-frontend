import Link from "next/link";
import { AlertTriangle, Info, Paperclip, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrdinalDate } from "@/lib/date";
import type { JobAttachment, JobRejection, JobStatus } from "@/constant/manufacturer";

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailRejections: everything about a job's rejection history:
//   • an alert about the job's rejection limit (its rules) (how many are left, or that
//     the job can no longer be resubmitted), and what each rejection charges
//   • the latest rejection reason, while the job is still rejected
//   • earlier rejections, with the photos each one turned down
//   • the lead's proof (of the defect, or the client's rejection) on each
// Renders nothing for a job that has never been rejected.
// ─────────────────────────────────────────────────────────────────────────────

function RejectionLimitAlert({
    rejectionCount,
    isRejected,
    maxRejections,
    rejectionChargePercent,
}: {
    rejectionCount: number;
    isRejected: boolean;
    maxRejections: number;
    /** Null when the API didn't send the job's rules: the charge isn't quoted then. */
    rejectionChargePercent: number | null;
}) {
    const remaining = maxRejections - rejectionCount;

    const alert =
        !isRejected
            ? {
                  tone: "info" as const,
                  title: `Rejected ${rejectionCount} of ${maxRejections} times`,
                  message: `This job has been resubmitted. It can be rejected ${remaining} more time${remaining === 1 ? "" : "s"} before it can no longer be resubmitted.`,
              }
            : remaining <= 0
              ? {
                    tone: "danger" as const,
                    title: "Rejection limit reached",
                    message: `This job has been rejected ${maxRejections} times, the maximum allowed, so it can no longer be resubmitted. Contact your project lead for next steps.`,
                }
              : remaining === 1
                ? {
                      tone: "warning" as const,
                      title: "Last chance to resubmit",
                      message: `This job has been rejected ${rejectionCount} of ${maxRejections} times. If it's rejected again, it can no longer be resubmitted.`,
                  }
                : {
                      tone: "warning" as const,
                      title: `Rejected ${rejectionCount} of ${maxRejections} times`,
                      message: `A job can be rejected up to ${maxRejections} times. After that it can no longer be resubmitted, so review the feedback carefully.`,
                  };

    const Icon = alert.tone === "danger" ? XCircle : alert.tone === "warning" ? AlertTriangle : Info;

    return (
        <div
            role={alert.tone === "info" ? "status" : "alert"}
            className={cn(
                "flex gap-3 rounded-xl border p-4",
                alert.tone === "danger" && "border-red-300 bg-red-50",
                alert.tone === "warning" && "border-amber-300 bg-amber-50",
                alert.tone === "info" && "border-border bg-mist-50",
            )}
        >
            <Icon
                className={cn(
                    "size-5 shrink-0",
                    alert.tone === "danger" && "text-red-600",
                    alert.tone === "warning" && "text-amber-600",
                    alert.tone === "info" && "text-mist-500",
                )}
            />
            <div className="flex flex-col gap-1">
                <p
                    className={cn(
                        "text-sm font-semibold font-text",
                        alert.tone === "danger" && "text-red-700",
                        alert.tone === "warning" && "text-amber-800",
                        alert.tone === "info" && "text-mist-900",
                    )}
                >
                    {alert.title}
                </p>
                <p className="text-xs font-text text-mist-600">{alert.message}</p>
                {rejectionChargePercent !== null && (
                    <p className="text-xs font-text text-mist-600">
                        Each rejection charges {rejectionChargePercent}% of the job&apos;s amount from your wallet.
                        You&apos;ll see it in Transactions.
                    </p>
                )}
            </div>
        </div>
    );
}

function RejectionThumbnails({ imageUrls, title }: { imageUrls: string[]; title: string }) {
    if (imageUrls.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, index) => (
                // eslint-disable-next-line @next/next/no-img-element -- may be a client-side blob: URL from the upload form
                <img
                    key={`${url}-${index}`}
                    src={url}
                    alt={`${title} photo ${index + 1}`}
                    className="size-14 rounded-lg object-cover border border-border"
                />
            ))}
        </div>
    );
}

function RejectionAttachments({ attachments }: { attachments?: JobAttachment[] }) {
    if (!attachments || attachments.length === 0) return null;

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-text text-mist-500">Proof from your project lead</span>
            <div className="flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                    <Link key={`${attachment.url}-${index}`} href={attachment.url} target="_blank" title={attachment.name}>
                        <span className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-text text-mist-700">
                            <Paperclip className="size-3.5 text-mist-400" aria-hidden />
                            {attachment.name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default function JobDetailRejections({
    rejections,
    status,
    jobTitle,
    maxRejections,
    rejectionChargePercent,
}: {
    rejections: JobRejection[];
    status: JobStatus;
    jobTitle: string;
    /** The job's limit on rejections (its rules). */
    maxRejections: number;
    /** What each rejection charges, as a percent (its rules). Null when not known. */
    rejectionChargePercent: number | null;
}) {
    if (rejections.length === 0) return null;

    const isRejected = status === "rejected";
    const showLimitAlert = isRejected || status === "in-review";
    const latest = rejections[rejections.length - 1];
    // While rejected, the latest rejection gets its own card, so the history
    // list only needs the ones before it.
    const earlier = isRejected ? rejections.slice(0, -1) : rejections;

    return (
        <div className="flex flex-col gap-4">
            {showLimitAlert && (
                <RejectionLimitAlert
                    rejectionCount={rejections.length}
                    isRejected={isRejected}
                    maxRejections={maxRejections}
                    rejectionChargePercent={rejectionChargePercent}
                />
            )}

            {isRejected && (
                <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold font-text text-red-600">
                            <AlertTriangle className="size-4 shrink-0" />
                            Reason for rejection
                        </h3>
                        {latest.rejectedAt && (
                            <span className="text-xs font-text text-mist-500">
                                {formatOrdinalDate(new Date(latest.rejectedAt))}
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-text text-mist-700">{latest.reason}</p>
                    <RejectionAttachments attachments={latest.attachments} />
                </div>
            )}

            {earlier.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold font-text text-mist-950">
                        Previous rejections ({earlier.length})
                    </h3>
                    <ol className="flex flex-col gap-3">
                        {earlier.map((rejection, index) => (
                            <li
                                key={`${rejection.rejectedAt ?? "rejection"}-${index}`}
                                className="flex flex-col gap-2 rounded-xl border border-border p-3"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-semibold font-text text-red-600">
                                        Rejection #{index + 1}
                                    </span>
                                    {rejection.rejectedAt && (
                                        <span className="text-xs font-text text-mist-500">
                                            {formatOrdinalDate(new Date(rejection.rejectedAt))}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-text text-mist-700">{rejection.reason}</p>
                                <RejectionThumbnails
                                    imageUrls={rejection.imageUrls}
                                    title={`${jobTitle} rejection ${index + 1}`}
                                />
                                <RejectionAttachments attachments={rejection.attachments} />
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
