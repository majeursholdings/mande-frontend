import { AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrdinalDate } from "@/lib/date";
import { MAX_JOB_REJECTIONS, type JobRejection, type JobStatus } from "@/constant/manufacturer";

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailRejections — everything about a job's rejection history:
//   • an alert about the MAX_JOB_REJECTIONS limit (how many are left, or that
//     the job can no longer be resubmitted)
//   • the latest rejection reason, while the job is still rejected
//   • earlier rejections, with the photos each one turned down
// Renders nothing for a job that has never been rejected.
// ─────────────────────────────────────────────────────────────────────────────

function RejectionLimitAlert({
    rejectionCount,
    isRejected,
}: {
    rejectionCount: number;
    isRejected: boolean;
}) {
    const remaining = MAX_JOB_REJECTIONS - rejectionCount;

    const alert =
        !isRejected
            ? {
                  tone: "info" as const,
                  title: `Rejected ${rejectionCount} of ${MAX_JOB_REJECTIONS} times`,
                  message: `This job has been resubmitted. It can be rejected ${remaining} more time${remaining === 1 ? "" : "s"} before it can no longer be resubmitted.`,
              }
            : remaining <= 0
              ? {
                    tone: "danger" as const,
                    title: "Rejection limit reached",
                    message: `This job has been rejected ${MAX_JOB_REJECTIONS} times, the maximum allowed, so it can no longer be resubmitted. Contact your project assistant for next steps.`,
                }
              : remaining === 1
                ? {
                      tone: "warning" as const,
                      title: "Last chance to resubmit",
                      message: `This job has been rejected ${rejectionCount} of ${MAX_JOB_REJECTIONS} times. If it's rejected again, it can no longer be resubmitted.`,
                  }
                : {
                      tone: "warning" as const,
                      title: `Rejected ${rejectionCount} of ${MAX_JOB_REJECTIONS} times`,
                      message: `A job can be rejected up to ${MAX_JOB_REJECTIONS} times. After that it can no longer be resubmitted, so review the feedback carefully.`,
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

export default function JobDetailRejections({
    rejections,
    status,
    jobTitle,
}: {
    rejections: JobRejection[];
    status: JobStatus;
    jobTitle: string;
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
                <RejectionLimitAlert rejectionCount={rejections.length} isRejected={isRejected} />
            )}

            {isRejected && (
                <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 text-sm font-semibold font-text text-red-600">
                            <AlertTriangle className="size-4 shrink-0" />
                            Reason for rejection
                        </h3>
                        <span className="text-xs font-text text-mist-500">
                            {formatOrdinalDate(new Date(latest.rejectedAt))}
                        </span>
                    </div>
                    <p className="text-sm font-text text-mist-700">{latest.reason}</p>
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
                                key={rejection.rejectedAt}
                                className="flex flex-col gap-2 rounded-xl border border-border p-3"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-semibold font-text text-red-600">
                                        Rejection #{index + 1}
                                    </span>
                                    <span className="text-xs font-text text-mist-500">
                                        {formatOrdinalDate(new Date(rejection.rejectedAt))}
                                    </span>
                                </div>
                                <p className="text-sm font-text text-mist-700">{rejection.reason}</p>
                                <RejectionThumbnails
                                    imageUrls={rejection.imageUrls}
                                    title={`${jobTitle} rejection ${index + 1}`}
                                />
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
