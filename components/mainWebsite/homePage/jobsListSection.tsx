import Link from "next/link";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import WebsiteJobCard, { WEBSITE_OPEN_JOBS } from "../common/websiteJobCard";
import { WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";
import { OPEN_JOBS_URL } from "@/constant/navigation";

/** The newest open jobs — the rest are on the Open Jobs page. */
export default function JobsListSection() {
    return (
        <SectionWrapper containerClassName="flex flex-col items-start gap-8 md:gap-12">
            <div className="w-full space-y-6 md:space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <SectionHeading>Available furniture jobs.</SectionHeading>
                    <Link href={OPEN_JOBS_URL} className={WEBSITE_PRIMARY_BUTTON}>
                        Discover more jobs
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 w-full">
                    {WEBSITE_OPEN_JOBS.slice(0, 6).map((job) => (
                        <WebsiteJobCard key={job.id} job={job} />
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
}
