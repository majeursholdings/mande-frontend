"use client";

import { DataTable, type ColumnDef, type PaginationMeta } from "@/components/customTable";
import { formatOrdinalDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { getJobCountdown, type AdminJob } from "@/constant/admin";
import { JobStatusBadge, LeadsLabel } from "./jobPeople";

// Columns phones leave out — the countdown moves under the job name instead
const DESKTOP_ONLY = "hidden md:table-cell";

/** Red once past due, amber when it's down to days. */
const URGENCY_CLASS = { "past-due": "text-red-500", days: "text-amber-600" } as const;

function Countdown({ job, className }: { job: AdminJob; className?: string }) {
    const { label, urgency } = getJobCountdown(job);
    // The urgency colour goes last, so it wins over a muted `className`
    return <span className={cn(className, urgency && URGENCY_CLASS[urgency])}>{label}</span>;
}

/**
 * The jobs list. Each row opens the job; the job name is the row's button
 * for keyboards and screen readers. Phones get job name (with countdown),
 * lead and status, scrolling sideways as needed.
 */
export default function JobsTable({
    jobs,
    pagination,
    page,
    onPageChange,
    onOpenJob,
}: {
    /** The jobs on this page. */
    jobs: AdminJob[];
    pagination: PaginationMeta;
    page: number;
    onPageChange: (page: number) => void;
    onOpenJob: (jobId: string) => void;
}) {
    const columns: ColumnDef<AdminJob>[] = [
        {
            key: "title",
            header: "Job name",
            className: "min-w-40 whitespace-normal",
            cell: (job) => (
                <>
                    <button
                        type="button"
                        onClick={(event) => {
                            // The row handles the click; this is for keyboards
                            event.stopPropagation();
                            onOpenJob(job.id);
                        }}
                        className="text-left outline-none hover:underline focus-visible:underline"
                    >
                        {job.title}
                    </button>
                    <Countdown job={job} className="block text-xs text-gray-500 md:hidden" />
                </>
            ),
        },
        {
            key: "countdown",
            header: "Countdown",
            className: DESKTOP_ONLY,
            cell: (job) => <Countdown job={job} />,
        },
        {
            key: "projectLead",
            header: "Project lead",
            cell: (job) => <LeadsLabel leadIds={job.projectLeadIds} />,
        },
        {
            key: "dateAssigned",
            header: "Date assigned",
            className: DESKTOP_ONLY,
            cell: (job) =>
                job.dateAssigned ? formatOrdinalDate(new Date(job.dateAssigned)) : "Not yet assigned",
        },
        {
            key: "dueDate",
            header: "Due date",
            className: DESKTOP_ONLY,
            cell: (job) => formatOrdinalDate(new Date(job.dueDate)),
        },
        {
            key: "status",
            header: "Status",
            cell: (job) => (
                <span className="flex flex-col items-start gap-1">
                    <JobStatusBadge status={job.status} />
                    {/* Rated 3 stars or less: waiting for a super admin */}
                    {job.status === "in-review" && job.furtherReview && (
                        <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-medium font-text whitespace-nowrap text-warning-700">
                            Further review
                        </span>
                    )}
                </span>
            ),
        },
    ];

    return (
        <DataTable
            tableId="admin-jobs"
            columns={columns}
            rows={jobs}
            pagination={pagination}
            page={page}
            onPageChange={onPageChange}
            onRowClick={(job) => onOpenJob(job.id)}
            showIndex
        />
    );
}
