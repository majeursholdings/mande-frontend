"use client";

import { useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import {
    JOB_STATUS_CONFIG,
    JOBS_FILTER_ORDER,
    getJobsFilterLabel,
    type Job,
    type JobsFilter,
} from "@/constant/manufacturer";
import JobCard from "./jobCard";
import EmptyState from "../dashboardPage/emptyState";

// ─────────────────────────────────────────────────────────────────────────────
// JobsTabs — tablet/desktop jobs view: an "All" tab plus one tab per status,
// with the selected tab's jobs laid out as a grid of cards. Phones use MobileJobsAccordion's
// dropdown switcher instead. Follows the WAI-ARIA tabs pattern — Left/Right
// (and Home/End) move between tabs.
// ─────────────────────────────────────────────────────────────────────────────

const tabId = (status: JobsFilter) => `jobs-tab-${status}`;
const panelId = (status: JobsFilter) => `jobs-tabpanel-${status}`;

export default function JobsTabs({
    jobsByFilter,
}: {
    jobsByFilter: Record<JobsFilter, Job[]>;
}) {
    const [activeTab, setActiveTab] = useState<JobsFilter>(JOBS_FILTER_ORDER[0]);
    const activeJobs = jobsByFilter[activeTab];

    const selectTab = (status: JobsFilter) => {
        setActiveTab(status);
        document.getElementById(tabId(status))?.focus();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const index = JOBS_FILTER_ORDER.indexOf(activeTab);
        const last = JOBS_FILTER_ORDER.length - 1;
        const nextIndex =
            e.key === "ArrowRight"
                ? (index + 1) % JOBS_FILTER_ORDER.length
                : e.key === "ArrowLeft"
                  ? (index - 1 + JOBS_FILTER_ORDER.length) % JOBS_FILTER_ORDER.length
                  : e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? last
                      : null;
        if (nextIndex === null) return;
        e.preventDefault();
        selectTab(JOBS_FILTER_ORDER[nextIndex]);
    };

    return (
        <div className="hidden md:flex flex-col gap-6">
            <div
                role="tablist"
                aria-label="Job status"
                onKeyDown={handleKeyDown}
                className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border"
            >
                {JOBS_FILTER_ORDER.map((status) => {
                    const isActive = status === activeTab;

                    return (
                        <button
                            key={status}
                            id={tabId(status)}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={panelId(status)}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => setActiveTab(status)}
                            className={cn(
                                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-text whitespace-nowrap transition-colors cursor-pointer",
                                isActive
                                    ? "border-mist-900 font-semibold text-mist-950"
                                    : "border-transparent font-medium text-mist-400 hover:text-mist-700",
                            )}
                        >
                            {status !== "all" && (
                                <span
                                    className={cn(
                                        "size-2 rounded-full shrink-0",
                                        JOB_STATUS_CONFIG[status].dotClass,
                                    )}
                                />
                            )}
                            {getJobsFilterLabel(status)}
                            <span
                                className={cn(
                                    "flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-medium",
                                    isActive ? "bg-mist-900 text-white" : "bg-mist-100 text-mist-600",
                                )}
                            >
                                {jobsByFilter[status].length}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div
                id={panelId(activeTab)}
                role="tabpanel"
                aria-labelledby={tabId(activeTab)}
            >
                {activeJobs.length === 0 ? (
                    <EmptyState
                        title={
                            activeTab === "all"
                                ? "No Jobs"
                                : `No Jobs ${getJobsFilterLabel(activeTab)}`
                        }
                        description="There are no jobs to display"
                    />
                ) : (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                        {activeJobs.map((job) => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
