"use client";

import { useMemo, useState } from "react";
import { CirclePlus, ListChecks, SearchX } from "lucide-react";
import { ADMIN_JOBS_PAGE_SIZE, type AdminJob } from "@/constant/admin";
import JobFormDialog from "@/components/adminPlatform/form/jobFormDialog";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import EmptyState, { LoadError } from "../emptyState";
import JobDetailSheet from "../jobDetailPage/jobDetailSheet";
import JobsTable from "./jobsTable";
import JobsToolbar, { type JobsFilters } from "./jobsToolbar";

const DEFAULT_FILTERS: JobsFilters = { search: "", assignedToMe: false, leadId: null, view: "all" };

const time = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);

/** `myLeadId`: the signed-in person, for "Jobs assigned to me". */
function filterJobs(
    jobs: AdminJob[],
    { search, assignedToMe, leadId, view }: JobsFilters,
    myLeadId: string | null,
): AdminJob[] {
    const query = search.trim().toLowerCase();
    const matching = jobs.filter(
        (job) =>
            (!query || job.title.toLowerCase().includes(query) || job.code.toLowerCase().includes(query)) &&
            (!assignedToMe || (!!myLeadId && job.projectLeadIds.includes(myLeadId))) &&
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
// jobs in the three-step dialog. The super admin's too, who doesn't lead
// jobs: they create them for an admin to lead, and have no "assigned to me".
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminJobsPage({ initialJobId }: { initialJobId?: string }) {
    const { jobs, getJob, isLoading, isError } = useAdminJobs();
    const { jobsUrl, leadId, permissions } = useStaffPlatform();
    const [filters, setFilters] = useState<JobsFilters>(DEFAULT_FILTERS);
    const [page, setPage] = useState(1);
    const [openJobId, setOpenJobId] = useState<string | null>(initialJobId ?? null);
    const [prevInitialJobId, setPrevInitialJobId] = useState<string | undefined>(initialJobId);

    if (initialJobId !== prevInitialJobId) {
        setPrevInitialJobId(initialJobId);
        setOpenJobId(initialJobId ?? null);
    }

    /** Null: closed. No jobId: creating. */
    const [jobForm, setJobForm] = useState<{ jobId?: string } | null>(null);

    const filteredJobs = useMemo(() => filterJobs(jobs, filters, leadId), [jobs, filters, leadId]);
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

    // The URL follows the open job code (without a navigation), so it can be shared
    const openJob = (jobIdOrCode: string) => {
        const job = getJob(jobIdOrCode);
        const identifier = (job?.code || jobIdOrCode).toLowerCase();
        setOpenJobId(identifier);
        window.history.replaceState(null, "", `${jobsUrl}?job=${encodeURIComponent(identifier)}`);
    };
    const closeJob = () => {
        setOpenJobId(null);
        window.history.replaceState(null, "", jobsUrl);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold font-text text-mist-950">Jobs</h1>
                {(leadId || permissions.actsOnEveryJob) && (
                <button
                    type="button"
                    onClick={() => setJobForm({})}
                    className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-secondary-700 px-3 text-sm font-medium font-text text-white transition-colors hover:bg-secondary-900 cursor-pointer"
                >
                    <CirclePlus className="size-4" />
                    Create a job
                </button>
                )}
            </div>

            <div className="flex flex-col gap-5">
                <JobsToolbar filters={filters} onChange={changeFilters} showAssignedToMe={!!leadId} />

                {isLoading ? (
                    <JobsTable
                        jobs={[]}
                        loading={true}
                        pagination={{
                            total: 0,
                            totalPages: 1,
                            rowsPerPage: ADMIN_JOBS_PAGE_SIZE,
                        }}
                        page={1}
                        onPageChange={setPage}
                        onOpenJob={openJob}
                    />
                ) : isError && jobs.length === 0 ? (
                    <LoadError message="We couldn't load the jobs. Please refresh the page." />
                ) : jobs.length === 0 ? (
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
                // A ?job= link opened while the jobs load: the panel opens straight away, its fields as skeletons
                loading={!!openJobId && isLoading}
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
