"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/customTable/statusBadge";
import {
    JOBS,
    JOB_STATUS_CONFIG,
    MANUFACTURER_JOBS_URL,
    getJobCategoryLabel,
    type Job,
} from "@/constant/manufacturer";
import EmptyState from "../dashboardPage/emptyState";
import { useRecentSearches } from "./recentSearchesContext";

/**
 * Jobs whose title, code, category or status contain every word of `query`,
 * ignoring case — "leather rejected" finds the rejected leather jobs. Runs
 * against the JOBS sample data until search is backed by the API.
 */
function searchJobs(query: string): Job[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    return JOBS.filter((job) => {
        const searchable = [
            job.title,
            job.code,
            getJobCategoryLabel(job.category),
            JOB_STATUS_CONFIG[job.status].label,
        ]
            .join(" ")
            .toLowerCase();
        return terms.every((term) => searchable.includes(term));
    });
}

export default function SearchPanel({
    query,
    onRecentSearchSelect,
    onResultSelect,
    className,
}: {
    query: string;
    /** A recent-search chip was clicked — put the term in the search input. */
    onRecentSearchSelect: (term: string) => void;
    /** A job result was clicked. The link navigates by itself; close the search UI. */
    onResultSelect: () => void;
    className?: string;
}) {
    const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();

    if (!query.trim()) {
        if (recentSearches.length === 0) {
            return (
                <p className={cn("text-xs font-text text-mist-500", className)}>
                    Search by job name, code, category or status.
                </p>
            );
        }

        return (
            <div className={cn("flex flex-col gap-3", className)}>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium font-text text-mist-500">
                        Recent searches
                    </span>
                    <button
                        type="button"
                        onClick={clearRecentSearches}
                        className="text-mist-400 hover:text-mist-700 transition-colors cursor-pointer"
                        aria-label="Clear recent searches"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                        <button
                            key={term}
                            type="button"
                            onClick={() => onRecentSearchSelect(term)}
                            className="px-3 py-1.5 rounded-full bg-mist-100 text-xs font-text text-mist-700 hover:bg-mist-200 transition-colors cursor-pointer"
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const results = searchJobs(query);

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {results.length === 0 ? (
                <EmptyState
                    compact
                    title="No jobs found"
                    description="Try a job name, code, category or status."
                />
            ) : (
                <>
                    <span className="text-xs font-medium font-text text-mist-500">
                        {results.length} {results.length === 1 ? "job" : "jobs"} found
                    </span>
                    <ul className="-mx-2 flex flex-col">
                        {results.map((job) => (
                            <li key={job.id}>
                                <JobSearchResult
                                    job={job}
                                    onSelect={() => {
                                        addRecentSearch(query);
                                        onResultSelect();
                                    }}
                                />
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

function JobSearchResult({ job, onSelect }: { job: Job; onSelect: () => void }) {
    const config = JOB_STATUS_CONFIG[job.status];

    return (
        <Link
            href={`${MANUFACTURER_JOBS_URL}/${job.id}`}
            onClick={onSelect}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-mist-50 transition-colors"
        >
            <div className="min-w-0">
                <p className="text-sm font-medium font-text text-mist-900 truncate">{job.title}</p>
                <p className="text-xs font-text text-mist-400 truncate">
                    {job.code} · {getJobCategoryLabel(job.category)}
                </p>
            </div>
            <StatusBadge label={config.badgeLabel} tone={config.tone} variant="pill" />
        </Link>
    );
}
