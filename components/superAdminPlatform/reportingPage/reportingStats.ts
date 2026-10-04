"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_JOB_STATUS_CONFIG, ADMIN_POSITION_OPTIONS, type AdminJobStatus } from "@/constant/admin";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService, type JobsReportPeriod, type ProjectLeadReportEntry } from "@/lib/services/reportsService";

// ─────────────────────────────────────────────────────────────────────────────
// The Reporting page's numbers, from the API: jobs by status and the jobs'
// key figures over a period (/reports/jobs), and how each project lead is
// doing (/reports/project-leads). Shaped here for the cards and tables.
// ─────────────────────────────────────────────────────────────────────────────

export type ReportPeriod = JobsReportPeriod;

export const REPORT_PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
    { value: "all", label: "All time" },
    { value: "year", label: "Last 12 months" },
    { value: "month", label: "Last 30 days" },
    { value: "week", label: "Last 7 days" },
];

/** /reports/jobs for a period. Job Activity and Jobs Data share it (and its cache) when on the same period. */
export function useJobsReport(period: ReportPeriod) {
    return useQuery({
        queryKey: queryKeys.reports.jobsReport(period),
        queryFn: () => reportsService.getSuperAdminJobsReport(period),
        staleTime: 30_000,
    });
}

// ─── Job activity ────────────────────────────────────────────────────────────

export type JobActivityCount = { status: AdminJobStatus; label: string; count: number };

/** The bars' order, as in the design: closed first, finished last. */
export const ACTIVITY_STATUSES: AdminJobStatus[] = ["rejected", "pending", "in-progress", "in-review", "completed"];

/** The jobs created in the period, by where each is now: every status, 0 for one the API left out. */
export function toJobActivity(activity: { status: AdminJobStatus; count: number }[] | undefined): JobActivityCount[] {
    return ACTIVITY_STATUSES.map((status) => ({
        status,
        label: ADMIN_JOB_STATUS_CONFIG[status].label,
        count: activity?.find((row) => row.status === status)?.count ?? 0,
    }));
}

// ─── Project lead report ─────────────────────────────────────────────────────

export type ProjectLeadReportRow = {
    id: string;
    name: string;
    avatarUrl: string | null;
    /** An ADMIN_POSITION_OPTIONS value, for the filter. */
    position: string;
    positionLabel: string;
    /** Jobs they lead or led. */
    jobsHandled: number;
    /** How many times manufacturers have rated them, once a job was completed. */
    reviews: number;
    /** What manufacturers rated them, out of 5, on average. Null before their first rating. */
    averageRating: number | null;
};

function toProjectLeadReportRow(entry: ProjectLeadReportEntry): ProjectLeadReportRow {
    return {
        id: entry.id,
        name: entry.name,
        avatarUrl: entry.avatar?.url ?? null,
        position: entry.position ?? "",
        positionLabel: ADMIN_POSITION_OPTIONS.find((option) => option.value === entry.position)?.label ?? "",
        jobsHandled: entry.jobsHandled,
        reviews: entry.reviews,
        averageRating: entry.averageRating,
    };
}

/**
 * Every project lead's numbers, the most jobs handled first. The whole
 * report comes at once (it isn't paged), so the full report's search and
 * position filter run on it here.
 */
export function useProjectLeadReport() {
    const query = useQuery({
        queryKey: queryKeys.reports.projectLeads(),
        queryFn: () => reportsService.getProjectLeadsPerformance(),
        staleTime: 30_000,
    });
    return {
        rows: (query.data?.projectLeads ?? []).map(toProjectLeadReportRow),
        isPending: query.isPending,
        isError: query.isError,
    };
}
