"use client";

import { useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipContentProps,
} from "recharts";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import DashboardCard from "./dashboardCard";
import PillSelect from "./pillSelect";
import { getJobStatistics, type JobStatisticsRange } from "./dashboardStats";
import {
    CHART_AXIS_TEXT_COLOR,
    CHART_GRID_COLOR,
    SUCCESSFUL_JOBS_COLOR,
    UNSUCCESSFUL_JOBS_COLOR,
} from "./chartColors";

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
 * last year, or per day over the last week.
 */
export default function JobStatisticsCard() {
    const { jobs } = useAdminJobs();
    const [range, setRange] = useState<JobStatisticsRange>("monthly");
    const { data, axisMax, axisStep } = getJobStatistics(jobs, range);
    const ticks = Array.from({ length: axisMax / axisStep + 1 }, (_, index) => index * axisStep);

    return (
        <DashboardCard title="Job Statistics" action={<PillSelect label="Range" value={range} options={RANGE_OPTIONS} onChange={setRange} />}>
            <div aria-hidden>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                        data={data}
                        margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                        barGap={2}
                        // Hidden from screen readers (the table below has the numbers), so no keyboard stop either
                        accessibilityLayer={false}
                    >
                        <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
                        <XAxis
                            dataKey="label"
                            // Evenly spaced labels when they don't all fit (every other month on phones)
                            interval="equidistantPreserveStart"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }}
                            dy={8}
                        />
                        <YAxis
                            domain={[0, axisMax]}
                            ticks={ticks}
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }}
                            width={28}
                        />
                        <Tooltip
                            cursor={{ fill: CHART_GRID_COLOR }}
                            content={<ChartTooltip />}
                            wrapperStyle={{ outline: "none" }}
                        />
                        {SERIES.map((series) => (
                            <Bar
                                key={series.key}
                                dataKey={series.key}
                                name={series.label}
                                fill={series.color}
                                radius={[4, 4, 0, 0]}
                                maxBarSize={12}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>

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

function ChartTooltip({ active, payload, label }: Partial<TooltipContentProps<number, string>>) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="rounded-lg border border-border bg-white px-3.5 py-2.5 shadow-lg">
            <p className="mb-1.5 text-xs font-semibold font-text text-mist-900">{label}</p>
            <div className="flex flex-col gap-1">
                {payload.map((entry) => (
                    <div key={String(entry.dataKey)} className="flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs font-text text-mist-500">
                            {entry.name}: <span className="font-medium text-mist-900">{entry.value}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
