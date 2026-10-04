"use client";

import { useMemo, useState } from "react";
import {
    JOBS_FILTER_ORDER,
    JOB_SORT_OPTIONS,
    JOB_STATUS_CONFIG,
    JOB_STATUS_ORDER,
    getJobCategoryLabel,
    getJobsFilterLabel,
    type Job,
    type JobsFilter,
} from "@/constant/manufacturer";
import EmptyState from "../dashboardPage/emptyState";
import JobCardSkeleton from "@/components/ui/jobCardSkeleton";
import LoadError from "../loadError";
import JobCard from "./jobCard";
import { FilterChips, FilterDropdown, type FilterOption } from "./jobFilters";
import { SortByDropdown } from "./sortByDropdown";
import { useMyJobList } from "@/components/manufacturerPlatform/dashboardLayout/useManufacturerJobLists";

function sortJobs(jobs: Job[], sortBy: string): Job[] {
    if (sortBy === "name") return [...jobs].sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "date") {
        return [...jobs].sort(
            (a, b) => (a.assignedDaysAgo ?? Infinity) - (b.assignedDaysAgo ?? Infinity),
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
    return jobs;
}

export default function ActiveJobsPanel({
    jobs: initialJobs,
    getJobHref,
    emptyDescription = "Jobs you're assigned will show up here. Apply for open jobs to get started.",
}: {
    jobs?: Job[];
    getJobHref?: (job: Job) => string;
    emptyDescription?: string;
} = {}) {
    const isExternalJobs = initialJobs !== undefined;

    // The same list (and cache) as the job slots and search use
    const { jobs: myJobs, isPending, isError } = useMyJobList();
    const allJobs = useMemo(() => (isExternalJobs ? (initialJobs ?? []) : myJobs), [isExternalJobs, initialJobs, myJobs]);

    const [filter, setFilter] = useState<JobsFilter>("all");
    const [sortBy, setSortBy] = useState("");

    const jobsByFilter = useMemo(() => {
        const sorted = sortJobs(allJobs, sortBy);
        return JOB_STATUS_ORDER.reduce(
            (acc, status) => {
                acc[status] = sorted.filter((job) => job.status === status);
                return acc;
            },
            { all: sorted } as Record<JobsFilter, Job[]>,
        );
    }, [allJobs, sortBy]);

    const isLoading = !isExternalJobs && isPending;

    if (!isExternalJobs && isError) {
        return <LoadError>Couldn&apos;t load your jobs. Please refresh the page to try again.</LoadError>;
    }

    if (!isLoading && allJobs.length === 0) {
        return <EmptyState title="No active jobs" description={emptyDescription} />;
    }

    const jobs = jobsByFilter[filter];
    const filterOptions: FilterOption<JobsFilter>[] = JOBS_FILTER_ORDER.map((status) => ({
        value: status,
        label: getJobsFilterLabel(status),
        count: isLoading ? null : jobsByFilter[status].length,
        dotClass: status === "all" ? undefined : JOB_STATUS_CONFIG[status].dotClass,
    }));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 md:items-start md:justify-between">
                <FilterChips
                    label="Job status"
                    options={filterOptions}
                    value={filter}
                    onChange={setFilter}
                    className="hidden md:flex"
                />
                <FilterDropdown
                    label="Job status"
                    options={filterOptions}
                    value={filter}
                    onChange={setFilter}
                    className="min-w-0 flex-1 md:hidden"
                />
                <SortByDropdown items={JOB_SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <JobCardSkeleton key={i} />
                    ))}
                </div>
            ) : jobs.length === 0 ? (
                <EmptyState
                    title={filter === "all" ? "No Jobs" : `No Jobs ${getJobsFilterLabel(filter)}`}
                    description="There are no jobs to display"
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} href={getJobHref?.(job)} />
                    ))}
                </div>
            )}
        </div>
    );
}
