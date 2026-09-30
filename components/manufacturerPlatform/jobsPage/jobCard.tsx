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

// The manufacturer platform's job cards — the shared job card (also on the
// website's open jobs), with a status for their own jobs and "Apply now" on
// open ones.

/** A job assigned to the manufacturer, with its status — opening it in the manufacturer's jobs unless `href` says otherwise. */
export default function JobCard({ job, href }: { job: Job; href?: string }) {
    const config = JOB_STATUS_CONFIG[job.status];

    return (
        <JobCardFrame
            href={href ?? `${MANUFACTURER_JOBS_URL}/${job.id}`}
            title={job.title}
            meta={`${getJobCategoryLabel(job.category)} · ${job.assignedLabel}`}
            description={job.description}
            price={job.price}
            duration={formatShortDuration(new Date(job.startDate ?? job.dateAssigned ?? job.dueDate), new Date(job.dueDate))}
            trailing={<StatusBadge label={config.badgeLabel} tone={config.tone} variant="pill" />}
        />
    );
}

/** An open job — always with its photo, and an "Apply now" button that becomes "Applied". */
export function OpenJobCard({ job }: { job: OpenJob }) {
    return (
        <JobCardFrame
            href={`${MANUFACTURER_JOBS_URL}/${job.id}`}
            title={job.title}
            meta={`${getJobCategoryLabel(job.category)} · Posted ${getTimeAgoLabel(new Date(job.postedAt))}`}
            description={job.description}
            price={job.price}
            duration={formatShortDuration(new Date(job.startDate || job.postedAt), new Date(job.dueDate))}
            imageUrl={job.imageUrl}
            trailing={<ApplyNowButton jobId={job.id} jobTitle={job.title} />}
        />
    );
}
