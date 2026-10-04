"use client";

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
import type { JobStatisticsResponse } from "@/lib/services/reportsService";
import { CHART_AXIS_TEXT_COLOR, CHART_GRID_COLOR } from "./chartColors";

/** The Job Statistics bars: loaded on its own (see JobStatisticsCard), so recharts isn't in the page's first download. */
export default function JobStatisticsChart({
    data,
    axisMax,
    ticks,
    series,
}: {
    data: JobStatisticsResponse["data"];
    axisMax: number;
    ticks: number[];
    series: readonly { key: string; label: string; color: string }[];
}) {
    return (
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
                            {series.map((series) => (
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
