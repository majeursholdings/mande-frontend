import { OctagonX, PhoneCall } from "lucide-react";
import { formatDayAndTime, getRelativeTimeLabel } from "@/lib/date";
import {
    MAX_ADMIN_JOB_REJECTIONS,
    getAdminManufacturer,
    isRejectionFinal,
    type AdminJob,
} from "@/constant/admin";
import { AttachmentList, DetailSection, ImagePreviewGrid } from "./detailParts";

export const photoItems = (urls: string[]) => urls.map((url, index) => ({ url, name: `Photo ${index + 1}` }));

/** The latest photos of the finished furniture the manufacturer submitted for review. */
export function FinishedFurniture({ job }: { job: AdminJob }) {
    if (job.completionImageUrls.length === 0) return null;

    return (
        <DetailSection
            title="Finished furniture"
            action={
                job.submittedForReviewAt && (
                    <span className="text-xs font-text text-mist-500">
                        Submitted {getRelativeTimeLabel(new Date(job.submittedForReviewAt))}
                    </span>
                )
            }
        >
            <ImagePreviewGrid images={photoItems(job.completionImageUrls)} />
        </DetailSection>
    );
}

/**
 * Every time the lead turned the work down, newest first, with where that
 * leaves the job — and a way to contact the manufacturer from the first
 * rejection on.
 */
export function RejectionHistory({ job, onContact }: { job: AdminJob; onContact: () => void }) {
    if (job.rejections.length === 0) return null;

    const isFinal = isRejectionFinal(job);
    const attemptsLeft = MAX_ADMIN_JOB_REJECTIONS - job.rejections.length;
    const manufacturer =
        job.manufacturerIds.map((id) => getAdminManufacturer(id)?.companyName).filter(Boolean).join(" & ") ||
        "the manufacturer";

    return (
        <DetailSection
            title="Review history"
            count={job.rejections.length}
            action={
                job.manufacturerIds.length > 0 && (
                    <button
                        type="button"
                        onClick={onContact}
                        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium font-text text-mist-900 transition-colors hover:bg-mist-50 cursor-pointer"
                    >
                        <PhoneCall className="size-3.5" aria-hidden />
                        Contact manufacturer
                    </button>
                )
            }
        >
            {isFinal ? (
                <p className="flex items-start gap-2 rounded-lg bg-error-50 px-3.5 py-3 text-sm font-text text-error-700">
                    <OctagonX className="mt-0.5 size-4 shrink-0" aria-hidden />
                    Rejected {MAX_ADMIN_JOB_REJECTIONS} times — {manufacturer} can&apos;t resubmit this job.
                </p>
            ) : job.status === "rejected" ? (
                <p className="rounded-lg bg-mist-50 px-3.5 py-3 text-sm font-text text-mist-700">
                    Waiting for {manufacturer} to fix it and resubmit — {attemptsLeft}{" "}
                    {attemptsLeft === 1 ? "attempt" : "attempts"} left.
                </p>
            ) : (
                job.status === "in-review" && (
                    <p className="rounded-lg bg-mist-50 px-3.5 py-3 text-sm font-text text-mist-700">
                        Resubmitted after {job.rejections.length === 1 ? "a rejection" : `${job.rejections.length} rejections`} —{" "}
                        {attemptsLeft} {attemptsLeft === 1 ? "rejection" : "rejections"} left before it closes.
                    </p>
                )
            )}

            <ol className="flex flex-col gap-4">
                {[...job.rejections].reverse().map((rejection, index) => {
                    const number = job.rejections.length - index;
                    return (
                        <li key={rejection.id} className="flex flex-col gap-3 rounded-lg border border-border p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="rounded-full bg-error-50 px-2 py-0.5 text-xs font-medium font-text text-error-600">
                                    Rejection {number} of {MAX_ADMIN_JOB_REJECTIONS}
                                </span>
                                <span className="text-xs font-text text-mist-400">
                                    {rejection.rejectedBy} · {formatDayAndTime(new Date(rejection.rejectedAt))}
                                </span>
                            </div>
                            <p className="text-sm font-text whitespace-pre-line text-mist-800">{rejection.reason}</p>
                            {rejection.attachments.length > 0 && <AttachmentList attachments={rejection.attachments} />}
                            {rejection.submissionImageUrls.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-text text-mist-500">Photos that were reviewed</span>
                                    <ImagePreviewGrid images={photoItems(rejection.submissionImageUrls)} className="grid-cols-3" />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </DetailSection>
    );
}
