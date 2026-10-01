import { ArrowUpRight } from "lucide-react";
import JobCard from "@/components/ui/jobCard";
import { ARTISAN_SIGNUP_URL } from "@/constant/navigation";
import { getJobCategoryLabel } from "@/constant/manufacturer";
import { getSampleCategoryPhoto } from "@/constant/sampleDb";
import { fromKobo } from "@/lib/currency";
import { formatShortDuration, getTimeAgoLabel } from "@/lib/date";
import type { WebsiteJob } from "@/lib/services/websiteService";

/** An open job, as visitors see it: the manufacturer's open job card, with Apply taking them to sign up. */
export default function WebsiteJobCard({ job }: { job: WebsiteJob }) {
    const displayImageUrl = job.image?.url || getSampleCategoryPhoto(job.category);

    return (
        <JobCard
            // Visitors sign up as a manufacturer to apply
            href={ARTISAN_SIGNUP_URL}
            title={job.title}
            meta={`${getJobCategoryLabel(job.category)} · Posted ${getTimeAgoLabel(new Date(job.postedAt))}`}
            description={job.description}
            price={fromKobo(job.amountKobo)}
            duration={formatShortDuration(new Date(job.startDate || job.postedAt), new Date(job.dueDate))}
            imageUrl={displayImageUrl}
            category={job.category}
            trailing={
                <span className="inline-flex h-8 items-center gap-1 rounded-button bg-primary-950 px-3 text-xs font-medium font-text text-mist-100">
                    Apply now
                    <ArrowUpRight className="size-3.5" aria-hidden />
                </span>
            }
        />
    );
}
