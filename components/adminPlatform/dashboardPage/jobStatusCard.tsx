"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_JOB_STATUS_CONFIG, type AdminJobStatus } from "@/constant/admin";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService } from "@/lib/services/reportsService";
import DashboardCard from "./dashboardCard";
import { JOB_STATUS_COLORS } from "./chartColors";

// Recharts is big: it loads with the donut, after the page, not in its first download
const JobStatusDonut = dynamic(() => import("./jobStatusDonut"), {
    ssr: false,
    loading: () => <Skeleton className="absolute inset-0 rounded-full" />,
});
import { ReportError } from "./reportStates";

export type JobStatusCount = { status: AdminJobStatus; label: string; count: number };

/** Donut order, from 12 o'clock. */
const DONUT_STATUSES: AdminJobStatus[] = ["completed", "in-progress", "in-review", "rejected", "pending"];

/**
 * Every job by status, from /reports/job-status: a donut with the total in
 * the middle, and a legend with each status's count (so no one has to match
 * colours to read it). Beside the legend on phones and tablets; above it in
 * the desktop column.
 */
export default function JobStatusCard() {
    const query = useQuery({
        queryKey: queryKeys.reports.jobStatus(),
        queryFn: () => reportsService.getJobStatusSummary(),
        staleTime: 30_000,
    });
    const isPending = query.isPending;
    const counts: JobStatusCount[] = DONUT_STATUSES.map((status) => ({
        status,
        label: ADMIN_JOB_STATUS_CONFIG[status].label,
        count: query.data?.statuses.find((row) => row.status === status)?.count ?? 0,
    }));
    // Statuses with no jobs stay in the legend, but get no slice
    const slices = counts.filter((status) => status.count > 0);
    const total = counts.reduce((sum, status) => sum + status.count, 0);

    if (query.isError) {
        return (
            <DashboardCard title="Jobs by status" className="justify-center">
                <ReportError message="Couldn't load the jobs by status. Please refresh to try again." />
            </DashboardCard>
        );
    }

    return (
        <DashboardCard title="Jobs by status" titleHidden className="justify-center">
            <div className="flex items-center gap-6 sm:gap-10 lg:flex-col lg:gap-6">
                {isPending ? (
                    <Skeleton className="size-40 shrink-0 rounded-full sm:size-50" />
                ) : (
                    <div className="relative size-40 shrink-0 sm:size-50">
                        <JobStatusDonut slices={slices} total={total} />
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl sm:text-4xl font-semibold font-text text-mist-950">{total}</span>
                            <span className="text-xs sm:text-sm font-text text-mist-700">Cumulative Jobs</span>
                        </div>
                    </div>
                )}

                <ul className="grid gap-x-6 gap-y-3 lg:grid-cols-2">
                    {counts.map((status) => (
                        <li key={status.status} className="flex items-center gap-2 text-sm font-text text-mist-700">
                            <span
                                className="size-3.5 shrink-0 rounded"
                                style={{ backgroundColor: JOB_STATUS_COLORS[status.status] }}
                            />
                            {status.label}
                            {isPending ? (
                                <Skeleton className="h-4 w-5" />
                            ) : (
                                <span className="text-mist-400">{status.count}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </DashboardCard>
    );
}
