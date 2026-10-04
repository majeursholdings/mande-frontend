import { ArrowUpRight } from "lucide-react";
import JobCard from "@/components/ui/jobCard";
import { OPEN_JOBS_URL } from "@/constant/navigation";
import { getJobCategoryLabel } from "@/constant/manufacturer";
import { fromKobo } from "@/lib/currency";
import { formatShortDuration, getTimeAgoLabel } from "@/lib/date";
import type { WebsiteJob } from "@/lib/services/websiteService";
import { DEFAULT_IMAGE } from "@/constant/global";

/** An open job, as visitors see it: the manufacturer's open job card, opening the job's own page (where they apply). */
export default function WebsiteJobCard({ job }: { job: WebsiteJob }) {
    const displayImageUrl = job.image?.url || DEFAULT_IMAGE;

    return (
        <JobCard
            href={`${OPEN_JOBS_URL}/${job.id}`}
            title={job.title}
            meta={`${getJobCategoryLabel(job.category)} · Posted ${getTimeAgoLabel(new Date(job.postedAt))}`}
            description={job.description}
            price={fromKobo(job.amountKobo)}
            duration={formatShortDuration(new Date(job.startDate || job.postedAt), new Date(job.dueDate))}
            imageUrl={displayImageUrl}
            trailing={
                <span className="inline-flex h-8 items-center gap-1 rounded-button bg-primary-950 px-3 text-xs font-medium font-text text-mist-100">
                    View job
                    <ArrowUpRight className="size-3.5" aria-hidden />
                </span>
            }
        />
    );
}
