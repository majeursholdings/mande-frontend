"use client";

import { useMemo, useState } from "react";
import {
    JOBS,
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
import JobCard from "./jobCard";
import { FilterChips, FilterDropdown, type FilterOption } from "./jobFilters";
import { SortByDropdown } from "./sortByDropdown";

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

/**
 * Jobs assigned to the manufacturer, filtered by status — chips from md up,
 * a dropdown on phones. Also the admin's view of a manufacturer's jobs,
 * given their `jobs` and where each card opens.
 */
export default function ActiveJobsPanel({
    jobs: allJobs = JOBS,
    getJobHref,
    emptyDescription = "Jobs you're assigned will show up here. Apply for open jobs to get started.",
}: {
    jobs?: Job[];
    /** Where a card opens — the manufacturer's own job page by default. */
    getJobHref?: (job: Job) => string;
    emptyDescription?: string;
} = {}) {
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

    if (allJobs.length === 0) {
        return <EmptyState title="No active jobs" description={emptyDescription} />;
    }

    const jobs = jobsByFilter[filter];
    const filterOptions: FilterOption<JobsFilter>[] = JOBS_FILTER_ORDER.map((status) => ({
        value: status,
        label: getJobsFilterLabel(status),
        count: jobsByFilter[status].length,
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

            {jobs.length === 0 ? (
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
