"use client";

import { useMemo, useState } from "react";
import {
    JOBS,
    JOB_SORT_OPTIONS,
    JOB_STATUS_ORDER,
    getJobCategoryLabel,
    type Job,
    type JobsFilter,
} from "@/constant/manufacturer";
import { SortByDropdown } from "./sortByDropdown";
import JobsTabs from "./jobsTabs";
import MobileJobsAccordion from "./mobileJobsAccordion";
import EmptyState from "../dashboardPage/emptyState";

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

export default function ManufacturerJobsPage() {
    const [sortBy, setSortBy] = useState("");

    const jobsByFilter = useMemo(() => {
        const sorted = sortJobs(JOBS, sortBy);
        return JOB_STATUS_ORDER.reduce(
            (acc, status) => {
                acc[status] = sorted.filter((job) => job.status === status);
                return acc;
            },
            { all: sorted } as Record<JobsFilter, Job[]>,
        );
    }, [sortBy]);

    return (
        <div className="flex flex-col gap-6 z-1">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold font-text text-mist-950">Jobs</h1>
                <SortByDropdown items={JOB_SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
            </div>

            {JOBS.length === 0 ? (
                <EmptyState title="No Jobs" description="There are no jobs to display" />
            ) : (
                <>
                    <JobsTabs jobsByFilter={jobsByFilter} />
                    <MobileJobsAccordion jobsByFilter={jobsByFilter} />
                </>
            )}
        </div>
    );
}
