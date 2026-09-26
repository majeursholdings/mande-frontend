"use client";

import { useMemo, useState } from "react";
import {
    OPEN_JOBS,
    OPEN_JOB_SORT_OPTIONS,
    getJobCategoryLabel,
    type OpenJob,
} from "@/constant/manufacturer";
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

/** Open jobs to apply for, under how many job slots the plan has left. */
export default function OpenJobsPanel() {
    const { getApplication } = useJobApplications();
    const [filter, setFilter] = useState<OpenJobsFilter>("all");
    const [sortBy, setSortBy] = useState("");

    const sortedJobs = useMemo(() => sortOpenJobs(OPEN_JOBS, sortBy), [sortBy]);
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

            {jobs.length === 0 ? (
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
