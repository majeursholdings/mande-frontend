import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MANUFACTURER_JOBS_URL, RECENT_JOBS } from "@/constant/manufacturer";
import JobCard from "../jobsPage/jobCard";
import EmptyState from "./emptyState";

export default function RecentJobsSection() {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold font-text text-mist-950">Recent Jobs</h3>
                <Link
                    href={MANUFACTURER_JOBS_URL}
                    className="flex items-center gap-0.5 text-sm font-medium font-text text-secondary-600 hover:underline"
                >
                    View all
                    <ChevronRight className="size-4" />
                </Link>
            </div>

            {RECENT_JOBS.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {RECENT_JOBS.map((job) => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </div>
            )}
        </section>
    );
}
