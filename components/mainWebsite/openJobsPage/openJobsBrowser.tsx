"use client";

import { useState } from "react";
import { BriefcaseBusiness, Search } from "lucide-react";
import { FilterChips } from "@/components/manufacturerPlatform/jobsPage/jobFilters";
import { SortByDropdown } from "@/components/manufacturerPlatform/jobsPage/sortByDropdown";
import { OPEN_JOB_SORT_OPTIONS, getJobCategoryLabel } from "@/constant/manufacturer";
import type { WebsiteJob } from "@/lib/services/websiteService";
import WebsiteJobCard from "../common/websiteJobCard";

function sortJobs(jobs: WebsiteJob[], sortBy: string): WebsiteJob[] {
    const sorted = [...jobs];
    if (sortBy === "name") return sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "date") return sorted.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    // Soonest due first
    if (sortBy === "due-date") return sorted.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    if (sortBy === "category") {
        return sorted.sort(
            (a, b) =>
                getJobCategoryLabel(a.category).localeCompare(getJobCategoryLabel(b.category)) ||
                a.title.localeCompare(b.title),
        );
    }
    // Best paid first
    if (sortBy === "price") return sorted.sort((a, b) => b.amountKobo - a.amountKobo);
    return jobs;
}

/**
 * Every open job — searchable by name, what it is or its category, filtered
 * to a category, and sorted. Newest first until a sort is picked.
 */
export default function OpenJobsBrowser({ jobs }: { jobs: WebsiteJob[] }) {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [sortBy, setSortBy] = useState("");

    // The categories that have open jobs, A–Z, each with how many
    const categories = [...new Set(jobs.map((job) => job.category))]
        .map((value) => ({ value, label: getJobCategoryLabel(value), count: jobs.filter((job) => job.category === value).length }))
        .sort((a, b) => a.label.localeCompare(b.label));

    const search = query.trim().toLowerCase();
    const shown = sortJobs(
        jobs.filter(
            (job) =>
                (category === "all" || job.category === category) &&
                (!search ||
                    [job.title, job.description, getJobCategoryLabel(job.category)].some((text) =>
                        text.toLowerCase().includes(search),
                    )),
        ),
        sortBy,
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <label className="relative w-full md:max-w-md">
                    <span className="sr-only">Search open jobs</span>
                    <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-mist-400" aria-hidden />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by job, e.g. sofa or wardrobe"
                        className="h-11 w-full rounded-lg border border-border bg-white pr-4 pl-10 text-sm font-text text-mist-900 outline-none transition-all duration-200 placeholder:text-mist-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    />
                </label>
                <SortByDropdown items={OPEN_JOB_SORT_OPTIONS} value={sortBy} onChange={setSortBy} placeholder="Newest" />
            </div>

            <FilterChips<string>
                label="Category"
                options={[{ value: "all", label: "All jobs", count: jobs.length }, ...categories]}
                value={category}
                onChange={setCategory}
            />

            {shown.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-mist-300 px-6 py-16 text-center">
                    <BriefcaseBusiness className="size-8 text-mist-400" strokeWidth={1.5} aria-hidden />
                    <p className="text-lg font-medium">No jobs match</p>
                    <p className="max-w-sm text-sm font-light text-mist-600">
                        Try another word, or look through every category — new jobs are posted often.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("");
                            setCategory("all");
                        }}
                        className="mt-1 text-sm font-medium text-primary-800 underline underline-offset-4 hover:text-primary-950 cursor-pointer"
                    >
                        Clear search and filters
                    </button>
                </div>
            ) : (
                <>
                    <p className="text-sm font-light text-mist-600" aria-live="polite">
                        {shown.length === jobs.length
                            ? `${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} open`
                            : `${shown.length} of ${jobs.length} jobs`}
                    </p>
                    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        {shown.map((job) => (
                            <WebsiteJobCard key={job.id} job={job} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
