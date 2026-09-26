"use client";

import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Sector,
    Tooltip,
    type PieSectorDataItem,
    type TooltipContentProps,
} from "recharts";

const VALUE_COLOR = "#8c3232";
const TRACK_COLOR = "#f0f4f2";

export default function DonutChart({
    percentage,
    size = 168,
}: {
    percentage: number;
    size?: number;
}) {
    const data = [
        { name: "Performance", value: percentage },
        { name: "Remaining", value: Math.max(0, 100 - percentage) },
    ];

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="72%"
                        outerRadius="100%"
                        startAngle={90}
                        endAngle={-270}
                        cornerRadius={8}
                        stroke="none"
                        isAnimationActive={false}
                        activeShape={ActivePieShape}
                    >
                        {data.map((entry) => (
                            <Cell
                                key={entry.name}
                                fill={entry.name === "Performance" ? VALUE_COLOR : TRACK_COLOR}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} wrapperStyle={{ outline: "none" }} />
                </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-semibold font-text text-mist-950">
                    {percentage}%
                </span>
            </div>
        </div>
    );
}

function ActivePieShape(props: PieSectorDataItem) {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, cornerRadius } = props;

    return (
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={Number(outerRadius) + 4}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            cornerRadius={cornerRadius}
        />
    );
}

function DonutTooltip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
    if (!active || !payload || payload.length === 0) return null;
    const entry = payload[0];

    return (
        <div className="rounded-lg border border-border bg-white px-3.5 py-2 shadow-lg">
            <div className="flex items-center gap-2">
                <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.payload?.fill ?? entry.color }}
                />
                <span className="text-xs font-text text-mist-500">
                    {entry.name}: <span className="text-mist-900 font-medium">{entry.value}%</span>
                </span>
            </div>
        </div>
    );
}
