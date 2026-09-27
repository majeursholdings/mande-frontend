"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from "recharts";
import { JOB_STATUS_COUNTS, type JobStatusCount } from "@/constant/admin";
import DashboardCard from "./dashboardCard";
import { CHART_GRID_COLOR, JOB_STATUS_COLORS } from "./chartColors";

const TOTAL_JOBS = JOB_STATUS_COUNTS.reduce((sum, status) => sum + status.count, 0);

/**
 * Every job by status — a donut with the total in the middle, and a legend
 * with each status's count (so no one has to match colours to read it).
 * Beside the legend on phones and tablets; above it in the desktop column.
 */
export default function JobStatusCard() {
    return (
        <DashboardCard title="Jobs by status" titleHidden className="justify-center">
            <div className="flex items-center gap-6 sm:gap-10 lg:flex-col lg:gap-6">
                <div className="relative size-40 shrink-0 sm:size-50">
                    <div className="absolute inset-0" aria-hidden>
                        <ResponsiveContainer width="100%" height="100%">
                            {/* Hidden from screen readers (the legend has the counts), so no keyboard stop either */}
                            <PieChart accessibilityLayer={false}>
                                {TOTAL_JOBS === 0 ? (
                                    <Pie
                                        data={[{ label: "No jobs", count: 1 }]}
                                        dataKey="count"
                                        innerRadius="76%"
                                        outerRadius="100%"
                                        stroke="none"
                                        fill={CHART_GRID_COLOR}
                                        isAnimationActive={false}
                                    />
                                ) : (
                                    <Pie
                                        data={JOB_STATUS_COUNTS}
                                        dataKey="count"
                                        nameKey="label"
                                        innerRadius="76%"
                                        outerRadius="100%"
                                        // From 12 o'clock, anticlockwise: completed down the left
                                        startAngle={90}
                                        endAngle={450}
                                        // A 2px surface gap between segments
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                        isAnimationActive={false}
                                    >
                                        {JOB_STATUS_COUNTS.map((status) => (
                                            <Cell key={status.status} fill={JOB_STATUS_COLORS[status.status]} />
                                        ))}
                                    </Pie>
                                )}
                                {TOTAL_JOBS > 0 && (
                                    <Tooltip content={<StatusTooltip />} wrapperStyle={{ outline: "none", zIndex: 10 }} />
                                )}
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl sm:text-4xl font-semibold font-text text-mist-950">{TOTAL_JOBS}</span>
                        <span className="text-xs sm:text-sm font-text text-mist-700">Cumulative Jobs</span>
                    </div>
                </div>

                <ul className="grid gap-x-6 gap-y-3 lg:grid-cols-2">
                    {JOB_STATUS_COUNTS.map((status) => (
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
            </div>
        </DashboardCard>
    );
}

function StatusTooltip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
    if (!active || !payload || payload.length === 0) return null;
    const status = payload[0].payload as JobStatusCount;
    const share = Math.round((status.count / TOTAL_JOBS) * 100);

    return (
        <div className="rounded-lg border border-border bg-white px-3.5 py-2 shadow-lg">
            <div className="flex items-center gap-2">
                <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: JOB_STATUS_COLORS[status.status] }}
                />
                <span className="text-xs font-text text-mist-500">
                    {status.label}:{" "}
                    <span className="font-medium text-mist-900">
                        {status.count} ({share}%)
                    </span>
                </span>
            </div>
        </div>
    );
}
