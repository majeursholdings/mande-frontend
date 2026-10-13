"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactPrice } from "@/lib/currency";
import { StatusBadge } from "@/components/customTable/statusBadge";
import {
    JOB_STATUS_CONFIG,
    MANUFACTURER_JOBS_URL,
    getJobCategoryLabel,
    type Job,
    type JobsPageTab,
    type OpenJob,
} from "@/constant/manufacturer";
import { mapApiJobToManufacturerJob, mapApiOpenJobToOpenJob } from "@/lib/mappers/jobMappers";
import EmptyState from "../dashboardPage/emptyState";
import LoadError from "../loadError";
import { useJobApplications } from "./jobApplicationsContext";
import { useRecentSearches } from "./recentSearchesContext";
import { useJobSearch } from "./useManufacturerJobLists";

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

/** How long typing pauses before the search is sent. */
const SEARCH_DEBOUNCE_MS = 300;

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
    const hasTerm = query.trim().length > 0;
    // Searched on the server, over every job, once typing pauses; cleared at once
    const [debouncedTerm] = useDebounce(query.trim(), SEARCH_DEBOUNCE_MS);
    const term = hasTerm ? debouncedTerm : "";
    // Both scopes, so an empty one can offer the other's matches
    const openSearch = useJobSearch("open", term, mapApiOpenJobToOpenJob);
    const activeSearch = useJobSearch("active", term, mapApiJobToManufacturerJob);
    const scopeSearch = scope === "open" ? openSearch : activeSearch;
    // Typed but not sent yet, or sent and nothing back so far
    const isScopeLoading = term.length === 0 || scopeSearch.isPending;

    const selectResult = () => {
        addRecentSearch(query);
        onResultSelect();
    };

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <SearchScopeToggle scope={scope} onScopeChange={onScopeChange} />

            {!hasTerm ? (
                recentSearches.length === 0 ? (
                    <p className="text-xs font-text text-mist-500">{SEARCH_HINTS[scope]}</p>
                ) : (
                    <RecentSearches
                        terms={recentSearches}
                        onSelect={onRecentSearchSelect}
                        onClear={clearRecentSearches}
                    />
                )
            ) : scopeSearch.isError && !scopeSearch.data ? (
                <LoadError>
                    Couldn&apos;t search your {scope === "open" ? "open" : "active"} jobs. Please try again.
                </LoadError>
            ) : isScopeLoading ? (
                <SearchResultsSkeleton />
            ) : scope === "open" ? (
                <SearchResults
                    count={openSearch.jobs.length}
                    hasMore={openSearch.hasNextPage}
                    isUpdating={openSearch.isPlaceholderData}
                    isLoadingMore={openSearch.isFetchingNextPage}
                    loadMoreFailed={openSearch.isFetchNextPageError}
                    onLoadMore={() => void openSearch.fetchNextPage()}
                    noun="open job"
                    emptyDescription="Try a job name, code or category."
                    otherScope={{
                        label: "active jobs",
                        count: activeSearch.isPlaceholderData ? 0 : activeSearch.jobs.length,
                        hasMore: activeSearch.hasNextPage,
                        onShow: () => onScopeChange("active"),
                    }}
                >
                    {openSearch.jobs.map((job) => (
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
                    count={activeSearch.jobs.length}
                    hasMore={activeSearch.hasNextPage}
                    isUpdating={activeSearch.isPlaceholderData}
                    isLoadingMore={activeSearch.isFetchingNextPage}
                    loadMoreFailed={activeSearch.isFetchNextPageError}
                    onLoadMore={() => void activeSearch.fetchNextPage()}
                    noun="job"
                    emptyDescription="Try a job name, code, category or status."
                    otherScope={{
                        label: "open jobs",
                        count: openSearch.isPlaceholderData ? 0 : openSearch.jobs.length,
                        hasMore: openSearch.hasNextPage,
                        onShow: () => onScopeChange("open"),
                    }}
                >
                    {activeSearch.jobs.map((job) => (
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

/** "20" or, when there are more to load, "20+". */
const countLabel = (count: number, hasMore: boolean) => `${count}${hasMore ? "+" : ""}`;

/**
 * The results list, or an empty state, which offers to switch scope when
 * the other set of jobs has matches. More matches load a page at a time.
 */
function SearchResults({
    count,
    hasMore,
    isUpdating,
    isLoadingMore,
    loadMoreFailed,
    onLoadMore,
    noun,
    emptyDescription,
    otherScope,
    children,
}: {
    count: number;
    /** The server has more matches than are shown. */
    hasMore: boolean;
    /** These are the last term's results, kept while the new term's load. */
    isUpdating: boolean;
    isLoadingMore: boolean;
    loadMoreFailed: boolean;
    onLoadMore: () => void;
    /** e.g. "open job": pluralised with an "s". */
    noun: string;
    emptyDescription: string;
    /** The scope the toggle isn't on, and how many matches it has. */
    otherScope: { label: string; count: number; hasMore: boolean; onShow: () => void };
    children: ReactNode;
}) {
    if (count === 0) {
        return (
            <div className={cn("flex flex-col items-center transition-opacity", isUpdating && "opacity-60")}>
                <EmptyState compact title={`No ${noun}s found`} description={emptyDescription} />
                {otherScope.count > 0 && (
                    <button
                        type="button"
                        onClick={otherScope.onShow}
                        className="-mt-4 mb-4 text-xs font-medium font-text text-secondary-700 hover:underline cursor-pointer"
                    >
                        See {countLabel(otherScope.count, otherScope.hasMore)}{" "}
                        {otherScope.count === 1 && !otherScope.hasMore ? "match" : "matches"} in {otherScope.label}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div aria-busy={isUpdating || isLoadingMore} className={cn("flex flex-col gap-2 transition-opacity", isUpdating && "opacity-60")}>
            <span className="text-xs font-medium font-text text-mist-500">
                {countLabel(count, hasMore)} {noun}
                {count === 1 && !hasMore ? "" : "s"} found
            </span>
            <ul className="-mx-2 flex flex-col">{children}</ul>
            {isLoadingMore ? (
                <SearchResultsSkeleton rows={2} />
            ) : (
                <>
                    {loadMoreFailed && <LoadError className="text-xs">Couldn&apos;t load more matches. Please try again.</LoadError>}
                    {hasMore && (
                        <button
                            type="button"
                            onClick={onLoadMore}
                            disabled={isUpdating}
                            className="self-center rounded-md px-3 py-1.5 text-xs font-medium font-text text-secondary-700 hover:bg-mist-50 transition-colors cursor-pointer disabled:cursor-default disabled:opacity-60"
                        >
                            Show more
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

/** Result rows while the jobs being searched load. */
function SearchResultsSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <ul aria-hidden className="-mx-2 flex flex-col">
            {Array.from({ length: rows }, (_, i) => (
                <li key={i} className="flex items-center gap-3 px-2 py-2">
                    <Skeleton className="size-10 shrink-0 rounded-md" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-14 shrink-0" />
                </li>
            ))}
        </ul>
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
