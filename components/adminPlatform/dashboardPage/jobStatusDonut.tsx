"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from "recharts";
import { CHART_GRID_COLOR, JOB_STATUS_COLORS } from "./chartColors";
import type { JobStatusCount } from "./jobStatusCard";

/** The Jobs by status donut: loaded on its own (see JobStatusCard), so recharts isn't in the page's first download. */
export default function JobStatusDonut({ slices, total }: { slices: JobStatusCount[]; total: number }) {
    return (
                        <div className="absolute inset-0" aria-hidden>
                            <ResponsiveContainer width="100%" height="100%">
                                {/* Hidden from screen readers (the legend has the counts), so no keyboard stop either */}
                                <PieChart accessibilityLayer={false}>
                                    {total === 0 ? (
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
                                            data={slices}
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
                                            {slices.map((status) => (
                                                <Cell key={status.status} fill={JOB_STATUS_COLORS[status.status]} />
                                            ))}
                                        </Pie>
                                    )}
                                    {total > 0 && (
                                        <Tooltip
                                            content={<StatusTooltip total={total} />}
                                            wrapperStyle={{ outline: "none", zIndex: 10 }}
                                        />
                                    )}
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
    );
}

function StatusTooltip({
    active,
    payload,
    total,
}: Partial<TooltipContentProps<number, string>> & { total: number }) {
    if (!active || !payload || payload.length === 0) return null;
    const status = payload[0].payload as JobStatusCount;
    const share = Math.round((status.count / total) * 100);

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
