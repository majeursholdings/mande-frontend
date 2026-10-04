"use client";

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
import {
    CHART_AXIS_TEXT_COLOR,
    CHART_GRID_COLOR,
    JOB_STATUS_COLORS,
} from "@/components/adminPlatform/dashboardPage/chartColors";
import type { JobActivityCount } from "./reportingStats";

/** The Job Activity bars: loaded on its own (see JobActivityCard), so recharts isn't in the page's first download. */
export default function JobActivityChart({ counts, ticks }: { counts: JobActivityCount[]; ticks: number[] }) {
    return (
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
