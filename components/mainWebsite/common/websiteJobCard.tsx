import { ArrowUpRight } from "lucide-react";
import JobCard from "@/components/ui/jobCard";
import { ARTISAN_SIGNUP_URL } from "@/constant/navigation";
import { getJobCategoryLabel } from "@/constant/manufacturer";
import { SAMPLE_JOBS, isOpenJobRecord, type JobRecord } from "@/constant/sampleDb";
import { formatShortDuration, getTimeAgoLabel } from "@/lib/date";

/** Every job open to applications, newest first — from the sample database, the same ones manufacturers can apply for. */
export const WEBSITE_OPEN_JOBS: JobRecord[] = SAMPLE_JOBS.filter(isOpenJobRecord).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
);

/** An open job, as visitors see it — the manufacturer's open job card, with Apply taking them to sign up. */
export default function WebsiteJobCard({ job }: { job: JobRecord }) {
    return (
        <JobCard
            // Visitors sign up as a manufacturer to apply
            href={ARTISAN_SIGNUP_URL}
            title={job.title}
            meta={`${getJobCategoryLabel(job.category)} · Posted ${getTimeAgoLabel(new Date(job.createdAt))}`}
            description={job.description}
            price={job.amount}
            duration={formatShortDuration(new Date(job.startDate ?? job.createdAt), new Date(job.dueDate))}
            imageUrl={job.imageUrl}
            trailing={
                <span className="inline-flex h-8 items-center gap-1 rounded-button bg-primary-950 px-3 text-xs font-medium font-text text-mist-100">
                    Apply now
                    <ArrowUpRight className="size-3.5" aria-hidden />
                </span>
            }
        />
    );
}
