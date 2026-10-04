"use client";

import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    MANUFACTURER_ACTIVE_JOBS_URL,
    MANUFACTURER_JOBS_URL,
    type Job,
} from "@/constant/manufacturer";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import { mapApiJobToManufacturerJob, type ApiJobPayload } from "@/lib/mappers/jobMappers";
import JobCard from "../jobsPage/jobCard";
import EmptyState from "./emptyState";
import JobCardSkeleton from "@/components/ui/jobCardSkeleton";
import LoadError from "../loadError";

export default function RecentJobsSection() {
    const { data, isPending, isError } = useQuery({
        queryKey: queryKeys.jobs.list({ limit: 4, status: "in-progress" }),
        queryFn: () => jobsService.getMyJobs({ limit: 4 }),
    });

    const activeJobs: Job[] = ((data?.jobs ?? []) as ApiJobPayload[])
        .map((j: ApiJobPayload) => mapApiJobToManufacturerJob(j))
        .filter((j: Job) => j.status === "in-progress")
        .slice(0, 4);

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold font-text text-mist-950">Active Jobs</h3>
                <Link
                    href={MANUFACTURER_ACTIVE_JOBS_URL}
                    className="flex items-center gap-0.5 text-sm font-medium font-text text-secondary-600 hover:underline"
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
                <LoadError>Couldn&apos;t load your active jobs. Please refresh the page to try again.</LoadError>
            ) : activeJobs.length === 0 ? (
                <EmptyState
                    title="No active jobs"
                    description="You don't have any active jobs right now. Browse open jobs to get started."
                    action={
                        <Link
                            href={MANUFACTURER_JOBS_URL}
                            className="inline-flex items-center gap-2 rounded-button bg-secondary-700 px-4 py-2 text-sm font-medium font-text text-white hover:bg-secondary-800 transition-colors"
                        >
                            Apply for a job
                            <ArrowRight className="size-4" />
                        </Link>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {activeJobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </div>
            )}
        </section>
    );
}
