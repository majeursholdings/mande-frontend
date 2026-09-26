"use client";

import {
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipContentProps,
} from "recharts";
import type { JobStatisticsPoint } from "@/constant/manufacturer";

const SUCCESSFUL_COLOR = "#34a96c";
const UNSUCCESSFUL_COLOR = "#cc7979";

export default function BarChart({
    data,
    axisMax,
    axisStep,
}: {
    data: JobStatisticsPoint[];
    axisMax: number;
    axisStep: number;
}) {
    const ticks: number[] = [];
    for (let value = 0; value <= axisMax; value += axisStep) {
        ticks.push(value);
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <RechartsBarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="#f0f4f2" />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#9eb5ab" }}
                    dy={8}
                />
                <YAxis
                    domain={[0, axisMax]}
                    ticks={ticks}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#9eb5ab" }}
                    width={32}
                />
                <Tooltip
                    cursor={{ fill: "#f0f4f2" }}
                    content={<ChartTooltip />}
                    wrapperStyle={{ outline: "none" }}
                />
                <Bar
                    dataKey="successful"
                    name="Successful jobs"
                    fill={SUCCESSFUL_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={12}
                />
                <Bar
                    dataKey="unsuccessful"
                    name="Unsuccessful jobs"
                    fill={UNSUCCESSFUL_COLOR}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={12}
                />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}

function ChartTooltip({
    active,
    payload,
    label,
}: Partial<TooltipContentProps<number, string>>) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="rounded-lg border border-border bg-white px-3.5 py-2.5 shadow-lg">
            <p className="text-xs font-semibold font-text text-mist-900 mb-1.5">{label}</p>
            <div className="flex flex-col gap-1">
                {payload.map((entry) => (
                    <div key={entry.dataKey as string} className="flex items-center gap-2">
                        <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs font-text text-mist-500">
                            {entry.name}: <span className="text-mist-900 font-medium">{entry.value}</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
