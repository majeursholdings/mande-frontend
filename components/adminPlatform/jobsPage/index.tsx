"use client";

import { useMemo, useState } from "react";
import { CirclePlus, ListChecks, SearchX } from "lucide-react";
import {
    ADMIN_JOBS_PAGE_SIZE,
    ADMIN_JOBS_URL,
    ADMIN_ME_ID,
    type AdminJob,
} from "@/constant/admin";
import JobFormDialog from "@/components/adminPlatform/form/jobFormDialog";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import EmptyState from "../emptyState";
import JobDetailSheet from "../jobDetailPage/jobDetailSheet";
import JobsTable from "./jobsTable";
import JobsToolbar, { type JobsFilters } from "./jobsToolbar";

const DEFAULT_FILTERS: JobsFilters = { search: "", assignedToMe: false, leadId: null, view: "all" };

const time = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);

function filterJobs(jobs: AdminJob[], { search, assignedToMe, leadId, view }: JobsFilters): AdminJob[] {
    const query = search.trim().toLowerCase();
    const matching = jobs.filter(
        (job) =>
            (!query || job.title.toLowerCase().includes(query) || job.code.toLowerCase().includes(query)) &&
            (!assignedToMe || job.projectLeadIds.includes(ADMIN_ME_ID)) &&
            (!leadId || job.projectLeadIds.includes(leadId)) &&
            (view === "all" || view === "date-assigned" || view === "due-date" || job.status === view),
    );

    if (view === "date-assigned") {
        // Most recently assigned first; jobs not yet assigned last
        return [...matching].sort((a, b) => time(b.dateAssigned) - time(a.dateAssigned));
    }
    if (view === "due-date") {
        return [...matching].sort((a, b) => time(a.dueDate) - time(b.dueDate));
    }
    return [...matching].sort((a, b) => time(b.createdAt) - time(a.createdAt));
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Jobs — every job on the platform: search, filter and sort them, open
// one in the side panel (?job=<id> links straight to it), and create or edit
// jobs in the three-step dialog.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminJobsPage({ initialJobId }: { initialJobId?: string }) {
    const { jobs, getJob } = useAdminJobs();
    const [filters, setFilters] = useState<JobsFilters>(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [openJobId, setOpenJobId] = useState<string | null>(initialJobId ?? null);
    /** Null: closed. No jobId: creating. */
    const [jobForm, setJobForm] = useState<{ jobId?: string } | null>(null);

    const filteredJobs = useMemo(() => filterJobs(jobs, filters), [jobs, filters]);
    const pageCount = Math.max(1, Math.ceil(filteredJobs.length / ADMIN_JOBS_PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const firstOnPage = (currentPage - 1) * ADMIN_JOBS_PAGE_SIZE;
    const pageJobs = filteredJobs.slice(firstOnPage, firstOnPage + ADMIN_JOBS_PAGE_SIZE);
    const hasFilters =
        filters.search.trim() !== "" || filters.assignedToMe || filters.leadId !== null || filters.view !== "all";

    const changeFilters = (changes: Partial<JobsFilters>) => {
        setFilters((current) => ({ ...current, ...changes }));
        setPage(1);
    };

    // The URL follows the open job (without a navigation), so it can be shared
    const openJob = (jobId: string) => {
        setOpenJobId(jobId);
        window.history.replaceState(null, "", `${ADMIN_JOBS_URL}?job=${jobId}`);
    };
    const closeJob = () => {
        setOpenJobId(null);
        window.history.replaceState(null, "", ADMIN_JOBS_URL);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold font-text text-mist-950">Jobs</h1>
                <button
                    type="button"
                    onClick={() => setJobForm({})}
                    className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-secondary-700 px-3 text-sm font-medium font-text text-white transition-colors hover:bg-secondary-900 cursor-pointer"
                >
                    <CirclePlus className="size-4" />
                    Create a job
                </button>
            </div>

            <div className="flex flex-col gap-5">
                <JobsToolbar filters={filters} onChange={changeFilters} />

                {jobs.length === 0 ? (
                    <EmptyState icon={ListChecks} title="No Jobs" description="There are no jobs to display" />
                ) : filteredJobs.length === 0 ? (
                    <EmptyState
                        icon={SearchX}
                        title="No matching jobs"
                        description="Try a different search, filter or sort"
                        action={
                            hasFilters && (
                                <button
                                    type="button"
                                    onClick={() => changeFilters(DEFAULT_FILTERS)}
                                    className="text-sm font-medium font-text text-secondary-700 hover:underline cursor-pointer"
                                >
                                    Clear filters
                                </button>
                            )
                        }
                    />
                ) : (
                    <JobsTable
                        jobs={pageJobs}
                        pagination={{
                            total: filteredJobs.length,
                            totalPages: pageCount,
                            rowsPerPage: ADMIN_JOBS_PAGE_SIZE,
                        }}
                        page={currentPage}
                        onPageChange={setPage}
                        onOpenJob={openJob}
                    />
                )}
            </div>

            <JobDetailSheet
                job={openJobId ? getJob(openJobId) : undefined}
                onClose={closeJob}
                onEdit={(jobId) => setJobForm({ jobId })}
            />

            {jobForm && (
                <JobFormDialog
                    job={jobForm.jobId ? getJob(jobForm.jobId) : undefined}
                    onClose={() => setJobForm(null)}
                />
            )}
        </div>
    );
}
