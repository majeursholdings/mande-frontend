"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { MANUFACTURER_JOBS_URL, OPEN_JOBS, type OpenJob } from "@/constant/manufacturer";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import { mapApiOpenJobToOpenJob, type ApiJobPayload } from "@/lib/mappers/jobMappers";
import { useJobApplications } from "../dashboardLayout/jobApplicationsContext";
import { OpenJobCard } from "../jobsPage/jobCard";
import { getJobSlotsHint } from "../jobsPage/jobSlotsSummary";
import EmptyState from "./emptyState";

export default function OpenJobsSection() {
    const { slots, plan } = useJobApplications();

    const { data, isPending } = useQuery({
        queryKey: queryKeys.jobs.openJobs({ limit: 4 }),
        queryFn: () => jobsService.getOpenJobs({ limit: 4 }),
    });

    const openJobs: OpenJob[] =
        data?.jobs && data.jobs.length > 0
            ? (data.jobs as ApiJobPayload[]).map((j: ApiJobPayload) => mapApiOpenJobToOpenJob(j)).slice(0, 4)
            : isPending
              ? []
              : OPEN_JOBS.slice(0, 4);

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

            {isPending ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-64 rounded-xl border border-border bg-white p-4 animate-pulse">
                            <div className="h-32 w-full rounded-lg bg-mist-100 mb-3" />
                            <div className="h-4 w-3/4 rounded bg-mist-200 mb-2" />
                            <div className="h-3 w-1/2 rounded bg-mist-100" />
                        </div>
                    ))}
                </div>
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
