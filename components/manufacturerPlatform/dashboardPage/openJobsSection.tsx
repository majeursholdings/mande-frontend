"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MANUFACTURER_JOBS_URL, OPEN_JOBS } from "@/constant/manufacturer";
import { useJobApplications } from "../dashboardLayout/jobApplicationsContext";
import { OpenJobCard } from "../jobsPage/jobCard";
import { getJobSlotsHint } from "../jobsPage/jobSlotsSummary";
import EmptyState from "./emptyState";

const NEWEST_OPEN_JOBS = [...OPEN_JOBS]
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    .slice(0, 4);

/** The newest open jobs, with how many more the manufacturer's plan lets them apply for. */
export default function OpenJobsSection() {
    const { slots, plan } = useJobApplications();

    return (
        <section>
            <div className="flex items-end justify-between gap-4 mb-4">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold font-text text-mist-950">Open Jobs</h3>
                    <p
                        className={cn(
                            "text-xs font-text",
                            slots.canApply ? "text-mist-500" : "text-warning-700",
                        )}
                    >
                        {getJobSlotsHint(slots, plan)}
                    </p>
                </div>
                <Link
                    href={MANUFACTURER_JOBS_URL}
                    className="flex shrink-0 items-center gap-0.5 text-sm font-medium font-text text-secondary-600 hover:underline"
                >
                    View all
                    <ChevronRight className="size-4" />
                </Link>
            </div>

            {NEWEST_OPEN_JOBS.length === 0 ? (
                <EmptyState
                    title="No open jobs"
                    description="New jobs will show up here as soon as they're posted"
                />
            ) : (
                // Phones: a swipeable row with the next card peeking in; a grid from sm up
                <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                    {NEWEST_OPEN_JOBS.map((job) => (
                        <div key={job.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
                            <OpenJobCard job={job} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
