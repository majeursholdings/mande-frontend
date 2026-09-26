"use client";

import { useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOutsideClickRef } from "@/hooks/useOutsideClickRef";
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
// MobileJobsAccordion — phones show one tab's jobs at a time ("All" or a
// single status). The header row doubles as a switcher: tapping it opens a
// list of every tab so the visitor can jump straight to the one they want.
// ─────────────────────────────────────────────────────────────────────────────

export default function MobileJobsAccordion({
    jobsByFilter,
}: {
    jobsByFilter: Record<JobsFilter, Job[]>;
}) {
    const [activeTab, setActiveTab] = useState<JobsFilter>(JOBS_FILTER_ORDER[0]);
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    const ref = useOutsideClickRef<HTMLDivElement>(close);

    const label = getJobsFilterLabel(activeTab);
    const jobs = jobsByFilter[activeTab];

    return (
        <div className="md:hidden">
            <div ref={ref} className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-button border border-border bg-white px-4 py-3 cursor-pointer"
                >
                    <span className="flex items-center gap-2">
                        {activeTab !== "all" && (
                            <span
                                className={cn(
                                    "size-2 rounded-full shrink-0",
                                    JOB_STATUS_CONFIG[activeTab].dotClass,
                                )}
                            />
                        )}
                        <span className="text-xs font-semibold tracking-wide text-mist-900 uppercase">
                            {label}
                        </span>
                        <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-mist-100 text-[11px] font-medium text-mist-600">
                            {jobs.length}
                        </span>
                    </span>
                    <ChevronDown
                        className={cn(
                            "size-4 text-mist-500 transition-transform duration-200",
                            open && "rotate-180",
                        )}
                    />
                </button>

                {open && (
                    <div className="absolute top-full inset-x-0 mt-1 z-20 rounded-lg border border-border bg-white shadow-lg overflow-hidden">
                        {JOBS_FILTER_ORDER.map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => {
                                    setActiveTab(status);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "block w-full text-center py-3 text-sm font-text border-b border-border last:border-b-0 cursor-pointer",
                                    status === activeTab
                                        ? "font-semibold text-mist-950"
                                        : "text-mist-400",
                                )}
                            >
                                {getJobsFilterLabel(status)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4 mt-4">
                {jobs.length === 0 ? (
                    <EmptyState
                        compact
                        title={activeTab === "all" ? "No Jobs" : `No Jobs ${label}`}
                        description="There are no jobs to display"
                    />
                ) : (
                    jobs.map((job) => <JobCard key={job.id} job={job} />)
                )}
            </div>
        </div>
    );
}
