"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardCard from "@/components/adminPlatform/dashboardPage/dashboardCard";
import PillSelect from "@/components/adminPlatform/dashboardPage/pillSelect";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import { JOB_STATUS_COLORS } from "@/components/adminPlatform/dashboardPage/chartColors";
import {
    REPORT_PERIOD_OPTIONS,
    toJobActivity,
    useJobsReport,
    type ReportPeriod,
} from "./reportingStats";

const AXIS_STEPS = [1, 2, 5, 10, 25, 50, 100, 250, 500];

// Recharts is big: it loads with the chart, after the page, not in its first download
const JobActivityChart = dynamic(() => import("./jobActivityChart"), {
    ssr: false,
    loading: () => <Skeleton className="h-60 w-full" />,
});

/**
 * The jobs created in a period, by where each is now (/reports/jobs): a bar
 * per status, in the dashboard donut's colours so a status reads the same
 * everywhere, with each count in the legend.
 */
export default function JobActivityCard() {
    const [period, setPeriod] = useState<ReportPeriod>("all");
    const query = useJobsReport(period);
    const counts = toJobActivity(query.data?.activity);
    const tallest = Math.max(...counts.map((status) => status.count));
    const axisStep = AXIS_STEPS.find((step) => step * 5 >= tallest) ?? Math.ceil(tallest / 5);
    const ticks = Array.from({ length: 6 }, (_, index) => index * axisStep);
    const periodLabel = REPORT_PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "";

    return (
        <DashboardCard
            title="Job Activity"
            action={<PillSelect label="Period" value={period} options={REPORT_PERIOD_OPTIONS} onChange={setPeriod} />}
        >
            {query.isError ? (
                <ReportError
                    message="Couldn't load the job activity. Please refresh to try again."
                    className="flex h-60 items-center justify-center"
                />
            ) : query.isPending ? (
                <Skeleton className="h-60 w-full" />
            ) : (
                <JobActivityChart counts={counts} ticks={ticks} />
            )}

            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {counts.map((status) => (
                    <li key={status.status} className="flex items-center gap-2 text-sm font-text text-mist-700">
                        <span
                            className="size-3.5 shrink-0 rounded"
                            style={{ backgroundColor: JOB_STATUS_COLORS[status.status] }}
                        />
                        {status.label}
                        {query.isPending ? (
                            <Skeleton className="h-4 w-5" />
                        ) : (
                            <span className="text-mist-400">{status.count}</span>
                        )}
                    </li>
                ))}
            </ul>

            {/* The chart's numbers for screen readers: the chart itself is hidden from them */}
            {query.data && (
                <table className="sr-only">
                    <caption>Jobs created, {periodLabel.toLowerCase()}, by status</caption>
                    <thead>
                        <tr>
                            <th scope="col">Status</th>
                            <th scope="col">Jobs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {counts.map((status) => (
                            <tr key={status.status}>
                                <th scope="row">{status.label}</th>
                                <td>{status.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </DashboardCard>
    );
}
