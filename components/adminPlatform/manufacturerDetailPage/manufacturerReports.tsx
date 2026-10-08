"use client";

import { useState, type ReactNode } from "react";
import { FileWarning } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/customTable";
import { StatusBadge, type StatusTone } from "@/components/customTable/statusBadge";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import ResponsiveTabs from "@/components/ui/responsiveTabs";
import { formatOrdinalDate } from "@/lib/date";
import type { Job } from "@/constant/manufacturer";
import { JOB_PRODUCTION_STEPS } from "@/constant/jobWorkflow";
import type { SupportFeedbackRecord, TimelineExtensionRecord } from "@/constant/platformRecords";
import EmptyState from "../emptyState";
import ManufacturerFeedback from "./manufacturerFeedback";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "../emptyState";

type ReportsTab = "jobs" | "feedback";

type ReportRow = TimelineExtensionRecord & { jobTitle: string; stepLabel: string };

const DECISIONS: Record<TimelineExtensionRecord["status"], { label: string; tone: StatusTone }> = {
    pending: { label: "Waiting for lead", tone: "amber" },
    approved: { label: "New date approved", tone: "green" },
    rejected: { label: "Rejected", tone: "red" },
};

const stepLabel = (step: TimelineExtensionRecord["step"]) =>
    JOB_PRODUCTION_STEPS.find((candidate) => candidate.key === step)?.label ?? "—";

const COLUMNS: ColumnDef<ReportRow>[] = [
    {
        key: "reason",
        header: "Report",
        className: "min-w-56 whitespace-normal",
        cell: (row) => <span className="line-clamp-2 text-mist-950">{row.reason}</span>,
    },
    { key: "step", header: "Step", cell: (row) => row.stepLabel },
    { key: "jobTitle", header: "Job name", className: "whitespace-normal", cell: (row) => row.jobTitle },
    {
        key: "requestedAt",
        header: "Date logged",
        cell: (row) => <span className="text-mist-500">{formatOrdinalDate(new Date(row.requestedAt))}</span>,
    },
    {
        key: "status",
        header: "Decision",
        cell: (row) => (
            <StatusBadge label={DECISIONS[row.status].label} tone={DECISIONS[row.status].tone} variant="pill" />
        ),
    },
];

/**
 * What the manufacturer has told Mande, kept apart: reports on their jobs,
 * and the feedback they shared from Talk to support.
 */
export default function ManufacturerReports({
    jobs,
    feedback,
    feedbackState = "ready",
}: {
    jobs: Job[];
    feedback: SupportFeedbackRecord[];
    /** The feedback loads on its own. */
    feedbackState?: "loading" | "error" | "ready";
}) {
    return (
        <ResponsiveTabs<ReportsTab>
            label="Reports"
            defaultValue="jobs"
            variant="segmented"
            tabs={[
                { value: "jobs", label: "Job reports", panel: <JobReports jobs={jobs} /> },
                {
                    value: "feedback",
                    label: "Feedback",
                    panel:
                        feedbackState === "loading" ? (
                            <div className="flex flex-col gap-3" aria-busy="true">
                                <Skeleton className="h-16 rounded-xl" />
                                <Skeleton className="h-16 rounded-xl" />
                            </div>
                        ) : feedbackState === "error" ? (
                            <LoadError message="We couldn't load their feedback. Please refresh the page." />
                        ) : (
                            <ManufacturerFeedback feedback={feedback} />
                        ),
                },
            ]}
        />
    );
}

/**
 * The delays a manufacturer reported, newest first — each with the step the
 * job was on when they did, and what came of the new date they asked for.
 */
function JobReports({ jobs }: { jobs: Job[] }) {
    const [openId, setOpenId] = useState<string | null>(null);
    const reports: ReportRow[] = jobs
        .flatMap((job) =>
            job.extensionRequests.map((request) => ({
                ...request,
                jobTitle: job.title,
                stepLabel: stepLabel(request.step),
            })),
        )
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    const open = reports.find((report) => report.id === openId);

    if (reports.length === 0) {
        return <EmptyState icon={FileWarning} title="No Job Reports" description="Delays they report on a job will show up here" />;
    }

    return (
        <>
            <DataTable
                tableId="manufacturer-reports"
                columns={COLUMNS}
                rows={reports}
                onRowClick={(row) => setOpenId(row.id)}
            />

            <Dialog open={!!open} onOpenChange={(isOpen) => !isOpen && setOpenId(null)}>
                <DialogContent className="max-w-120">
                    {open && (
                        <>
                            <DialogTitle>Report details</DialogTitle>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                                <Detail label="Job name">{open.jobTitle}</Detail>
                                <Detail label="Date logged">{formatOrdinalDate(new Date(open.requestedAt))}</Detail>
                                <Detail label="Step">{open.stepLabel}</Detail>
                                <Detail label="Decision">
                                    <StatusBadge
                                        label={DECISIONS[open.status].label}
                                        tone={DECISIONS[open.status].tone}
                                        variant="pill"
                                    />
                                </Detail>
                                <Detail label="Due date">{formatOrdinalDate(new Date(open.previousDueDate))}</Detail>
                                <Detail label="New date asked for">
                                    {formatOrdinalDate(new Date(open.requestedDueDate))}
                                </Detail>
                            </dl>
                            <div className="flex flex-col gap-2">
                                <dt className="text-xs font-medium font-text uppercase text-mist-500">Report</dt>
                                <dd className="rounded-lg border border-border px-4 py-3 text-sm font-text whitespace-pre-line text-mist-900">
                                    {open.reason}
                                </dd>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <dt className="text-xs font-medium font-text uppercase text-mist-500">{label}</dt>
            <dd className="text-sm font-text text-mist-950">{children}</dd>
        </div>
    );
}
