"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MANUFACTURER_JOBS_URL, type OpenJob } from "@/constant/manufacturer";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import { mapApiOpenJobToOpenJob, type ApiJobPayload } from "@/lib/mappers/jobMappers";
import { useJobApplications } from "../dashboardLayout/jobApplicationsContext";
import { OpenJobCard } from "../jobsPage/jobCard";
import { getJobSlotsHint } from "../jobsPage/jobSlotsSummary";
import EmptyState from "./emptyState";
import JobCardSkeleton from "@/components/ui/jobCardSkeleton";
import LoadError from "../loadError";

export default function OpenJobsSection() {
    const { slots, plan, isLoading: isSlotsLoading } = useJobApplications();

    const { data, isPending, isError } = useQuery({
        queryKey: queryKeys.jobs.openJobs({ limit: 4 }),
        queryFn: () => jobsService.getOpenJobs({ limit: 4 }),
    });

    const openJobs: OpenJob[] = ((data?.jobs ?? []) as ApiJobPayload[])
        .map((j: ApiJobPayload) => mapApiOpenJobToOpenJob(j))
        .slice(0, 4);

    return (
        <section>
            <div className="flex items-end justify-between gap-4 mb-4">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold font-text text-mist-950">Open Jobs</h3>
                    {isSlotsLoading ? (
                        <Skeleton className="mt-1 h-3 w-48" />
                    ) : (
                        <p
                            className={cn(
                                "text-xs font-text",
                                slots.canApply ? "text-mist-500" : "text-warning-700",
                            )}
                        >
                            {getJobSlotsHint(slots, plan)}
                        </p>
                    )}
                </div>
                <Link
                    href={MANUFACTURER_JOBS_URL}
                    className="flex shrink-0 items-center gap-0.5 text-sm font-medium font-text text-secondary-600 hover:underline"
                >
                    View all
                    <ChevronRight className="size-4" />
                </Link>
            </div>

            {isPending ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <JobCardSkeleton key={i} />
                    ))}
                </div>
            ) : isError ? (
                <LoadError>Couldn&apos;t load open jobs. Please refresh the page to try again.</LoadError>
            ) : openJobs.length === 0 ? (
                <EmptyState
                    title="No open jobs"
                    description="New jobs will show up here as soon as they're posted"
                />
            ) : (
                <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                    {openJobs.map((job) => (
                        <div key={job.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
                            <OpenJobCard job={job} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
