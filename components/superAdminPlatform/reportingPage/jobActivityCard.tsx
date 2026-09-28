"use client";

import { useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipContentProps,
} from "recharts";
import DashboardCard from "@/components/adminPlatform/dashboardPage/dashboardCard";
import PillSelect from "@/components/adminPlatform/dashboardPage/pillSelect";
import { useAdminJobs } from "@/components/adminPlatform/dashboardLayout/adminJobsContext";
import {
    CHART_AXIS_TEXT_COLOR,
    CHART_GRID_COLOR,
    JOB_STATUS_COLORS,
} from "@/components/adminPlatform/dashboardPage/chartColors";
import { REPORT_PERIOD_OPTIONS, getJobActivity, type JobActivityCount, type ReportPeriod } from "./reportingStats";

const AXIS_STEPS = [1, 2, 5, 10, 25, 50, 100, 250, 500];

/**
 * The jobs created in a period, by where each is now — a bar per status, in
 * the dashboard donut's colours so a status reads the same everywhere, with
 * each count in the legend.
 */
export default function JobActivityCard() {
    const { jobs } = useAdminJobs();
    const [period, setPeriod] = useState<ReportPeriod>("all");
    const counts = getJobActivity(jobs, period);
    const tallest = Math.max(...counts.map((status) => status.count));
    const axisStep = AXIS_STEPS.find((step) => step * 5 >= tallest) ?? Math.ceil(tallest / 5);
    const ticks = Array.from({ length: 6 }, (_, index) => index * axisStep);
    const periodLabel = REPORT_PERIOD_OPTIONS.find((option) => option.value === period)?.label ?? "";

    return (
        <DashboardCard
            title="Job Activity"
            action={<PillSelect label="Period" value={period} options={REPORT_PERIOD_OPTIONS} onChange={setPeriod} />}
        >
            <div aria-hidden>
                <ResponsiveContainer width="100%" height={240}>
                    {/* Hidden from screen readers (the table below has the numbers), so no keyboard stop either */}
                    <BarChart data={counts} margin={{ top: 8, right: 0, left: 0, bottom: 8 }} accessibilityLayer={false}>
                        <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
                        <XAxis dataKey="label" hide />
                        <YAxis
                            domain={[0, ticks.at(-1) ?? 0]}
                            ticks={ticks}
                            // Every tick, 0 included: with no x-axis under it, recharts thins them otherwise
                            interval={0}
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }}
                            width={32}
                        />
                        <Tooltip
                            cursor={{ fill: CHART_GRID_COLOR }}
                            content={<StatusTooltip />}
                            wrapperStyle={{ outline: "none" }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={72} isAnimationActive={false}>
                            {counts.map((status) => (
                                <Cell key={status.status} fill={JOB_STATUS_COLORS[status.status]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {counts.map((status) => (
                    <li key={status.status} className="flex items-center gap-2 text-sm font-text text-mist-700">
                        <span
                            className="size-3.5 shrink-0 rounded"
                            style={{ backgroundColor: JOB_STATUS_COLORS[status.status] }}
                        />
                        {status.label}
                        <span className="text-mist-400">{status.count}</span>
                    </li>
                ))}
            </ul>

            {/* The chart's numbers for screen readers — the chart itself is hidden from them */}
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
        </DashboardCard>
    );
}

function StatusTooltip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
    if (!active || !payload || payload.length === 0) return null;
    const status = payload[0].payload as JobActivityCount;

    return (
        <div className="rounded-lg border border-border bg-white px-3.5 py-2 shadow-lg">
            <div className="flex items-center gap-2">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: JOB_STATUS_COLORS[status.status] }} />
                <span className="text-xs font-text text-mist-500">
                    {status.label}: <span className="font-medium text-mist-900">{status.count}</span>
                </span>
            </div>
        </div>
    );
}
