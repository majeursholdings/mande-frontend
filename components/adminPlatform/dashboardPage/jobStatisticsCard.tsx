"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService, type JobStatisticsRange } from "@/lib/services/reportsService";
import DashboardCard from "./dashboardCard";
import PillSelect from "./pillSelect";
import { ReportError } from "./reportStates";
import { SUCCESSFUL_JOBS_COLOR, UNSUCCESSFUL_JOBS_COLOR } from "./chartColors";

// Recharts is big: it loads with the chart, after the page, not in its first download
const JobStatisticsChart = dynamic(() => import("./jobStatisticsChart"), {
    ssr: false,
    loading: () => <Skeleton className="h-55 w-full" />,
});

const RANGE_OPTIONS: { value: JobStatisticsRange; label: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "weekly", label: "Weekly" },
];

const SERIES = [
    { key: "successful", label: "Successful jobs", color: SUCCESSFUL_JOBS_COLOR },
    { key: "unsuccessful", label: "Unsuccessful jobs", color: UNSUCCESSFUL_JOBS_COLOR },
] as const;

/**
 * Successful (completed) vs unsuccessful (closed) jobs per month over the
 * last year, or per day over the last week, from /reports/job-statistics.
 */
export default function JobStatisticsCard() {
    const [range, setRange] = useState<JobStatisticsRange>("monthly");
    const query = useQuery({
        queryKey: queryKeys.reports.statistics(range),
        queryFn: () => reportsService.getJobStatistics(range),
        staleTime: 30_000,
    });
    const data = query.data?.data ?? [];
    const axisMax = query.data?.axisMax ?? 4;
    const axisStep = query.data?.axisStep ?? 1;
    const ticks = Array.from({ length: axisMax / axisStep + 1 }, (_, index) => index * axisStep);

    return (
        <DashboardCard title="Job Statistics" action={<PillSelect label="Range" value={range} options={RANGE_OPTIONS} onChange={setRange} />}>
            {query.isError ? (
                <ReportError message="Couldn't load the job statistics. Please refresh to try again." className="flex h-55 items-center justify-center" />
            ) : query.isPending ? (
                <Skeleton className="h-55 w-full" />
            ) : (
                <JobStatisticsChart data={data} axisMax={axisMax} ticks={ticks} series={SERIES} />
            )}

            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
                {SERIES.map((series) => (
                    <li key={series.key} className="flex items-center gap-2 text-sm font-text text-mist-700">
                        <span className="size-3.5 rounded" style={{ backgroundColor: series.color }} />
                        {series.label}
                    </li>
                ))}
            </ul>

            {/* The chart's numbers for screen readers — the chart itself is hidden from them */}
            <table className="sr-only">
                <caption>Job statistics, {range}</caption>
                <thead>
                    <tr>
                        <th scope="col">{range === "monthly" ? "Month" : "Day"}</th>
                        <th scope="col">Successful jobs</th>
                        <th scope="col">Unsuccessful jobs</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((point) => (
                        <tr key={point.label}>
                            <th scope="row">{point.label}</th>
                            <td>{point.successful}</td>
                            <td>{point.unsuccessful}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </DashboardCard>
    );
}
