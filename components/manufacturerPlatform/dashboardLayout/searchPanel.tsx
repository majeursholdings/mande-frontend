"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompactPrice } from "@/lib/currency";
import { StatusBadge } from "@/components/customTable/statusBadge";
import {
    JOBS,
    JOB_STATUS_CONFIG,
    MANUFACTURER_JOBS_URL,
    OPEN_JOBS,
    getJobCategoryLabel,
    type Job,
    type JobsPageTab,
    type OpenJob,
} from "@/constant/manufacturer";
import EmptyState from "../dashboardPage/emptyState";
import { useJobApplications } from "./jobApplicationsContext";
import { useRecentSearches } from "./recentSearchesContext";

/** Where a search looks — split the same way as the jobs page's tabs. */
export type SearchScope = JobsPageTab;

const SCOPES: { value: SearchScope; label: string }[] = [
    { value: "open", label: "Open jobs" },
    { value: "active", label: "Active jobs" },
];

export const SEARCH_PLACEHOLDERS: Record<SearchScope, string> = {
    open: "Search open jobs...",
    active: "Search active jobs...",
};

const SEARCH_HINTS: Record<SearchScope, string> = {
    open: "Search open jobs by name, code or category.",
    active: "Search your jobs by name, code, category or status.",
};

const toTerms = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);

/** Whether the fields contain every term, ignoring case — "leather rejected" finds the rejected leather jobs. */
const matchesTerms = (terms: string[], fields: string[]) => {
    const searchable = fields.join(" ").toLowerCase();
    return terms.every((term) => searchable.includes(term));
};

// Both run against sample data until search is backed by the API
function searchActiveJobs(terms: string[]): Job[] {
    return JOBS.filter((job) =>
        matchesTerms(terms, [
            job.title,
            job.code,
            getJobCategoryLabel(job.category),
            JOB_STATUS_CONFIG[job.status].label,
        ]),
    );
}

function searchOpenJobs(terms: string[]): OpenJob[] {
    return OPEN_JOBS.filter((job) =>
        matchesTerms(terms, [job.title, job.code, getJobCategoryLabel(job.category)]),
    );
}

/** Open jobs / Active jobs — which set of jobs the search looks through. */
function SearchScopeToggle({
    scope,
    onScopeChange,
}: {
    scope: SearchScope;
    onScopeChange: (scope: SearchScope) => void;
}) {
    return (
        <div role="group" aria-label="Search in" className="grid grid-cols-2 gap-1 rounded-lg bg-mist-100 p-1">
            {SCOPES.map(({ value, label }) => {
                const isActive = value === scope;
                return (
                    <button
                        key={value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onScopeChange(value)}
                        className={cn(
                            "rounded-md px-3 py-1.5 text-xs font-medium font-text transition-colors duration-200 cursor-pointer",
                            isActive
                                ? "bg-white text-secondary-700 shadow-sm"
                                : "text-mist-600 hover:text-mist-900",
                        )}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

export default function SearchPanel({
    query,
    scope,
    onScopeChange,
    onRecentSearchSelect,
    onResultSelect,
    className,
}: {
    query: string;
    scope: SearchScope;
    /** The toggle was switched — the input's placeholder follows it. */
    onScopeChange: (scope: SearchScope) => void;
    /** A recent-search chip was clicked — put the term in the search input. */
    onRecentSearchSelect: (term: string) => void;
    /** A job result was clicked. The link navigates by itself; close the search UI. */
    onResultSelect: () => void;
    className?: string;
}) {
    const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();
    const { getApplication } = useJobApplications();
    const terms = toTerms(query);
    const openResults = terms.length > 0 ? searchOpenJobs(terms) : [];
    const activeResults = terms.length > 0 ? searchActiveJobs(terms) : [];

    const selectResult = () => {
        addRecentSearch(query);
        onResultSelect();
    };

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <SearchScopeToggle scope={scope} onScopeChange={onScopeChange} />

            {terms.length === 0 ? (
                recentSearches.length === 0 ? (
                    <p className="text-xs font-text text-mist-500">{SEARCH_HINTS[scope]}</p>
                ) : (
                    <RecentSearches
                        terms={recentSearches}
                        onSelect={onRecentSearchSelect}
                        onClear={clearRecentSearches}
                    />
                )
            ) : scope === "open" ? (
                <SearchResults
                    count={openResults.length}
                    noun="open job"
                    emptyDescription="Try a job name, code or category."
                    otherScope={{
                        label: "active jobs",
                        count: activeResults.length,
                        onShow: () => onScopeChange("active"),
                    }}
                >
                    {openResults.map((job) => (
                        <li key={job.id}>
                            <OpenJobSearchResult
                                job={job}
                                isApplied={!!getApplication(job.id)}
                                onSelect={selectResult}
                            />
                        </li>
                    ))}
                </SearchResults>
            ) : (
                <SearchResults
                    count={activeResults.length}
                    noun="job"
                    emptyDescription="Try a job name, code, category or status."
                    otherScope={{
                        label: "open jobs",
                        count: openResults.length,
                        onShow: () => onScopeChange("open"),
                    }}
                >
                    {activeResults.map((job) => (
                        <li key={job.id}>
                            <JobSearchResult job={job} onSelect={selectResult} />
                        </li>
                    ))}
                </SearchResults>
            )}
        </div>
    );
}

function RecentSearches({
    terms,
    onSelect,
    onClear,
}: {
    terms: string[];
    onSelect: (term: string) => void;
    onClear: () => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium font-text text-mist-500">Recent searches</span>
                <button
                    type="button"
                    onClick={onClear}
                    className="text-mist-400 hover:text-mist-700 transition-colors cursor-pointer"
                    aria-label="Clear recent searches"
                >
                    <X className="size-3.5" />
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {terms.map((term) => (
                    <button
                        key={term}
                        type="button"
                        onClick={() => onSelect(term)}
                        className="px-3 py-1.5 rounded-full bg-mist-100 text-xs font-text text-mist-700 hover:bg-mist-200 transition-colors cursor-pointer"
                    >
                        {term}
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * The results list, or an empty state — which offers to switch scope when
 * the other set of jobs has matches.
 */
function SearchResults({
    count,
    noun,
    emptyDescription,
    otherScope,
    children,
}: {
    count: number;
    /** e.g. "open job" — pluralised with an "s". */
    noun: string;
    emptyDescription: string;
    /** The scope the toggle isn't on, and how many matches it has. */
    otherScope: { label: string; count: number; onShow: () => void };
    children: ReactNode;
}) {
    if (count === 0) {
        return (
            <div className="flex flex-col items-center">
                <EmptyState compact title={`No ${noun}s found`} description={emptyDescription} />
                {otherScope.count > 0 && (
                    <button
                        type="button"
                        onClick={otherScope.onShow}
                        className="-mt-4 mb-4 text-xs font-medium font-text text-secondary-700 hover:underline cursor-pointer"
                    >
                        See {otherScope.count} {otherScope.count === 1 ? "match" : "matches"} in{" "}
                        {otherScope.label}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs font-medium font-text text-mist-500">
                {count} {noun}
                {count === 1 ? "" : "s"} found
            </span>
            <ul className="-mx-2 flex flex-col">{children}</ul>
        </div>
    );
}

function JobSearchResult({ job, onSelect }: { job: Job; onSelect: () => void }) {
    const config = JOB_STATUS_CONFIG[job.status];

    return (
        <Link
            href={`${MANUFACTURER_JOBS_URL}/${job.code || job.id}`}
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

/** An open job with its photo, and its pay — or "Applied" once they have. */
function OpenJobSearchResult({
    job,
    isApplied,
    onSelect,
}: {
    job: OpenJob;
    isApplied: boolean;
    onSelect: () => void;
}) {
    return (
        <Link
            href={`${MANUFACTURER_JOBS_URL}/${job.code || job.id}`}
            onClick={onSelect}
            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-mist-50 transition-colors"
        >
            <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-mist-100">
                <Image src={job.imageUrl} alt="" fill sizes="40px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium font-text text-mist-900 truncate">{job.title}</p>
                <p className="text-xs font-text text-mist-400 truncate">
                    {job.code} · {getJobCategoryLabel(job.category)}
                </p>
            </div>
            {isApplied ? (
                <StatusBadge label="Applied" tone="green" variant="pill" />
            ) : (
                <span className="shrink-0 text-sm font-semibold font-text text-mist-950">
                    {formatCompactPrice(job.price)}
                </span>
            )}
        </Link>
    );
}
