"use client";

import { useMemo, useState } from "react";
import {
    OPEN_JOBS,
    OPEN_JOB_SORT_OPTIONS,
    getJobCategoryLabel,
    type OpenJob,
} from "@/constant/manufacturer";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import { mapApiOpenJobToOpenJob, type ApiJobPayload } from "@/lib/mappers/jobMappers";
import { useJobApplications } from "../dashboardLayout/jobApplicationsContext";
import EmptyState from "../dashboardPage/emptyState";
import { OpenJobCard } from "./jobCard";
import { FilterChips } from "./jobFilters";
import JobSlotsSummary from "./jobSlotsSummary";
import { SortByDropdown } from "./sortByDropdown";

type OpenJobsFilter = "all" | "applied";

function sortOpenJobs(jobs: OpenJob[], sortBy: string): OpenJob[] {
    if (sortBy === "name") return [...jobs].sort((a, b) => a.title.localeCompare(b.title));
    // Newest first
    if (sortBy === "date") {
        return [...jobs].sort(
            (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
        );
    }
    // Soonest due first
    if (sortBy === "due-date") {
        return [...jobs].sort(
            (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        );
    }
    // Alphabetical by category, then by name within a category
    if (sortBy === "category") {
        return [...jobs].sort(
            (a, b) =>
                getJobCategoryLabel(a.category).localeCompare(getJobCategoryLabel(b.category)) ||
                a.title.localeCompare(b.title),
        );
    }
    // Best paid first
    if (sortBy === "price") return [...jobs].sort((a, b) => b.price - a.price);
    return jobs;
}

export default function OpenJobsPanel() {
    const { getApplication } = useJobApplications();
    const [filter, setFilter] = useState<OpenJobsFilter>("all");
    const [sortBy, setSortBy] = useState("");

    const { data: apiData, isPending } = useQuery({
        queryKey: queryKeys.jobs.openJobs(),
        queryFn: () => jobsService.getOpenJobs(),
    });

    const openJobsList = useMemo(() => {
        if (apiData?.jobs && apiData.jobs.length > 0) {
            return apiData.jobs.map((j: ApiJobPayload) => mapApiOpenJobToOpenJob(j));
        }
        return isPending ? [] : OPEN_JOBS;
    }, [apiData, isPending]);

    const sortedJobs = useMemo(() => sortOpenJobs(openJobsList, sortBy), [openJobsList, sortBy]);
    const appliedJobs = sortedJobs.filter((job) => getApplication(job.id));
    const jobs = filter === "applied" ? appliedJobs : sortedJobs;

    return (
        <div className="flex flex-col gap-4">
            <JobSlotsSummary />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <FilterChips<OpenJobsFilter>
                    label="Show"
                    options={[
                        { value: "all", label: "All", count: sortedJobs.length },
                        { value: "applied", label: "Applied", count: appliedJobs.length },
                    ]}
                    value={filter}
                    onChange={setFilter}
                />
                <SortByDropdown items={OPEN_JOB_SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
            </div>

            {isPending ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 rounded-xl border border-border bg-white p-4 animate-pulse">
                            <div className="h-32 w-full rounded-lg bg-mist-100 mb-3" />
                            <div className="h-4 w-3/4 rounded bg-mist-200 mb-2" />
                            <div className="h-3 w-1/2 rounded bg-mist-100" />
                        </div>
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                filter === "applied" ? (
                    <EmptyState
                        title="No applications yet"
                        description="Jobs you apply for will show up here"
                    />
                ) : (
                    <EmptyState
                        title="No open jobs"
                        description="New jobs will show up here as soon as they're posted"
                    />
                )
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {jobs.map((job) => (
                        <OpenJobCard key={job.id} job={job} />
                    ))}
                </div>
            )}
        </div>
    );
}
