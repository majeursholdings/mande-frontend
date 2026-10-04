import { StatusBadge } from "@/components/customTable/statusBadge";
import JobCardFrame from "@/components/ui/jobCard";
import {
    JOB_STATUS_CONFIG,
    MANUFACTURER_JOBS_URL,
    getJobCategoryLabel,
    type Job,
    type OpenJob,
} from "@/constant/manufacturer";
import { formatShortDuration, getTimeAgoLabel } from "@/lib/date";
import ApplyNowButton from "./applyNowButton";
import { DEFAULT_IMAGE } from "@/constant/global";


function getAttachedImage(attachments?: Array<{ url?: string; name?: string; kind?: string }>): string | null {
    if (!attachments || attachments.length === 0) return null;
    const found = attachments.find((att) => {
        if (!att?.url) return false;
        if (att.kind === "image") return true;
        const url = att.url.toLowerCase();
        const name = (att.name ?? "").toLowerCase();
        return (
            url.includes(".png") ||
            url.includes(".jpg") ||
            url.includes(".jpeg") ||
            url.includes(".webp") ||
            url.includes(".svg") ||
            name.endsWith(".png") ||
            name.endsWith(".jpg") ||
            name.endsWith(".jpeg") ||
            name.endsWith(".webp") ||
            name.endsWith(".svg")
        );
    });
    return found?.url ?? null;
}

/** A job assigned to the manufacturer, with its status. Opens the job unless href says otherwise. */
export default function JobCard({ job, href }: { job: Job; href?: string }) {
    const config = JOB_STATUS_CONFIG[job.status];
    const placeholderImage = DEFAULT_IMAGE;
    const attachedImage = getAttachedImage(job.attachments);
    const displayImageUrl =
        (job.imageUrl && job.imageUrl !== placeholderImage ? job.imageUrl : "") ||
        attachedImage ||
        job.imageUrl ||
        placeholderImage;

    return (
        <JobCardFrame
            href={href ?? `${MANUFACTURER_JOBS_URL}/${job.code || job.id}`}
            title={job.title}
            meta={`${getJobCategoryLabel(job.category)} · ${job.assignedLabel}`}
            description={job.description}
            price={job.price}
            duration={formatShortDuration(new Date(job.startDate ?? job.dateAssigned ?? job.dueDate), new Date(job.dueDate))}
            imageUrl={displayImageUrl}
            trailing={<StatusBadge label={config.badgeLabel} tone={config.tone} variant="pill" />}
        />
    );
}

/** An open job, always with its attached photo and an Apply now button. */
export function OpenJobCard({ job }: { job: OpenJob }) {
    const placeholderImage = DEFAULT_IMAGE;
    const attachedImage = getAttachedImage(job.attachments);
    const displayImageUrl =
        (job.imageUrl && job.imageUrl !== placeholderImage ? job.imageUrl : "") ||
        attachedImage ||
        job.imageUrl ||
        placeholderImage;

    return (
        <JobCardFrame
            href={`${MANUFACTURER_JOBS_URL}/${job.code || job.id}`}
            title={job.title}
            meta={`${getJobCategoryLabel(job.category)} · Posted ${getTimeAgoLabel(new Date(job.postedAt))}`}
            description={job.description}
            price={job.price}
            duration={formatShortDuration(new Date(job.startDate || job.postedAt), new Date(job.dueDate))}
            imageUrl={displayImageUrl}
            trailing={<ApplyNowButton jobId={job.id} jobTitle={job.title} />}
        />
    );
}
