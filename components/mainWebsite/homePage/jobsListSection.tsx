import Link from "next/link";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import WebsiteJobCard from "../common/websiteJobCard";
import NoOpenJobs from "../common/noOpenJobs";
import { WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";
import { OPEN_JOBS_URL } from "@/constant/navigation";
import { getWebsiteOpenJobs } from "@/lib/services/websiteService";

/** The newest open jobs — the rest are on the Open Jobs page. */
export default async function JobsListSection() {
    const jobs = await getWebsiteOpenJobs(6);

    return (
        <SectionWrapper containerClassName="flex flex-col items-start gap-8 md:gap-12">
            <div className="w-full space-y-6 md:space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <SectionHeading as="h2">Available furniture jobs.</SectionHeading>
                    <Link href={OPEN_JOBS_URL} className={WEBSITE_PRIMARY_BUTTON}>
                        Discover more jobs
                    </Link>
                </div>
                {jobs && jobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 w-full">
                        {jobs.map((job) => (
                            <WebsiteJobCard key={job.id} job={job} />
                        ))}
                    </div>
                ) : (
                    <NoOpenJobs unavailable={jobs === null} />
                )}
            </div>
        </SectionWrapper>
    );
}
