import Link from "next/link";
import JobCard from "../common/jobCard";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { JOBS_SAMPLE_DATA } from "@/constant/sampleData";

export default function JobsListSection() {
    const displayedJobs = JOBS_SAMPLE_DATA.slice(0, 6);

    return (
        <SectionWrapper containerClassName="flex flex-col items-start gap-8 md:gap-12">
            <div className="w-full space-y-6 md:space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <SectionHeading>Available furniture jobs.</SectionHeading>
                    <Link
                        href={"/open-jobs"}
                        className="flex w-fit rounded-xs py-1.5 px-5 border bg-primary-950 border-primary-950 text-mist-100 hover:bg-primary-500 hover:border-primary-500 hover:text-primary-950 duration-300 transition-all"
                    >
                        Discover more jobs
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 w-full">
                    {displayedJobs.map((item) => (
                        <JobCard
                            key={item.id}
                            referenceId={item.referenceId}
                            imageSrc={item.imageSrc}
                            title={item.title}
                            cost={item.cost}
                            category={item.category}
                            timeline={item.timeline}
                        />
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
}

