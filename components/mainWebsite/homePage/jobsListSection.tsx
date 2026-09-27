import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import JobCard from "@/components/ui/jobCard";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { ARTISAN_SIGNUP_URL } from "@/constant/navigation";
import { getJobCategoryLabel } from "@/constant/manufacturer";
import { SAMPLE_JOBS, isOpenJobRecord } from "@/constant/sampleDb";
import { formatShortDuration, getTimeAgoLabel } from "@/lib/date";

/** The newest open jobs — from the sample database, the same ones manufacturers can apply for. */
const OPEN_JOBS = SAMPLE_JOBS.filter(isOpenJobRecord)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

export default function JobsListSection() {
    return (
        <SectionWrapper containerClassName="flex flex-col items-start gap-8 md:gap-12">
            <div className="w-full space-y-6 md:space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <SectionHeading>Available furniture jobs.</SectionHeading>
                    <Link
                        href={"/open-jobs"}
                        className="flex w-fit rounded-button py-1.5 px-5 border bg-primary-950 border-primary-950 text-mist-100 hover:bg-primary-500 hover:border-primary-500 hover:text-primary-950 duration-300 transition-all"
                    >
                        Discover more jobs
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 w-full">
                    {OPEN_JOBS.map((job) => (
                        <JobCard
                            key={job.id}
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
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
}
