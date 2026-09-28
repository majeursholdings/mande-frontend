"use client";

import Link from "next/link";
import { ChevronRight, History } from "lucide-react";
import { DataTable } from "@/components/customTable";
import { useAdminJobs } from "@/components/adminPlatform/dashboardLayout/adminJobsContext";
import { PROJECT_LEADS } from "@/constant/admin";
import { SUPER_ADMIN_ACTIVITY_LOG_URL, SUPER_ADMIN_PROJECT_LEAD_REPORT_URL } from "@/constant/superAdmin";
import JobActivityCard from "./jobActivityCard";
import JobsDataCard from "./jobsDataCard";
import { PROJECT_LEAD_REPORT_COLUMNS } from "./projectLeadReportColumns";
import { getProjectLeadReport } from "./reportingStats";

const PREVIEW_ROWS = 5;

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminReportingPage — how the platform's work is going: the jobs by
// status and their key figures over a period, the project leads who handled
// the most (the full report is a page of its own), and the way to the
// Activity Log.
// ─────────────────────────────────────────────────────────────────────────────

export default function SuperAdminReportingPage() {
    const { jobs } = useAdminJobs();
    const report = getProjectLeadReport(jobs, PROJECT_LEADS);

    return (
        <div className="flex flex-col gap-8 lg:gap-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold font-text text-mist-950">Reporting</h1>
                <Link
                    href={SUPER_ADMIN_ACTIVITY_LOG_URL}
                    className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium font-text text-mist-900 transition-colors hover:bg-mist-50"
                >
                    <History className="size-4 text-mist-500" aria-hidden />
                    Activity Log
                    <ChevronRight className="size-4 text-mist-400" aria-hidden />
                </Link>
            </div>

            <div className="grid gap-10 md:gap-6 lg:grid-cols-2">
                <JobActivityCard />
                <JobsDataCard />
            </div>

            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-medium font-text text-mist-950">Project Lead Report</h2>
                    <Link
                        href={SUPER_ADMIN_PROJECT_LEAD_REPORT_URL}
                        className="flex shrink-0 items-center gap-0.5 text-sm font-medium font-text text-secondary-600 hover:underline"
                    >
                        View all
                        <ChevronRight className="size-4" />
                    </Link>
                </div>
                <DataTable
                    tableId="project-lead-report-preview"
                    columns={PROJECT_LEAD_REPORT_COLUMNS}
                    rows={report.slice(0, PREVIEW_ROWS)}
                    emptyMessage="No project leads yet."
                />
            </section>
        </div>
    );
}
