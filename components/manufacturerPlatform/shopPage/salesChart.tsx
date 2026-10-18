"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { CHART_AXIS_TEXT_COLOR, CHART_GRID_COLOR } from "@/components/adminPlatform/dashboardPage/chartColors";
import { formatCompactPrice, formatPrice } from "@/lib/currency";

/** The bars' colour: the brand green (one series, so one hue; checked against the card's white). */
const SALES_COLOR = "#08783e";

export type SalesChartPoint = { label: string; fullLabel: string; sales: number; orders: number };

/**
 * Sales over the last 12 weeks or months as bars: loaded on its own (see
 * ShopOverview), so recharts isn't in the page's first download. Hidden from
 * screen readers: the table beside it has the same numbers.
 */
export default function SalesChart({ data }: { data: SalesChartPoint[] }) {
    return (
        <div aria-hidden>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} accessibilityLayer={false}>
                    <CartesianGrid vertical={false} stroke={CHART_GRID_COLOR} />
                    <XAxis
                        dataKey="label"
                        interval="equidistantPreserveStart"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }}
                        dy={8}
                    />
                    <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: CHART_AXIS_TEXT_COLOR }}
                        tickFormatter={(value: number) => formatCompactPrice(value)}
                        width={56}
                    />
                    <Tooltip cursor={{ fill: CHART_GRID_COLOR }} content={<SalesTooltip />} wrapperStyle={{ outline: "none" }} />
                    <Bar dataKey="sales" name="Sales" fill={SALES_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

function SalesTooltip({ active, payload }: Partial<TooltipContentProps<number, string>>) {
    const point = payload?.[0]?.payload as SalesChartPoint | undefined;
    if (!active || !point) return null;
    return (
        <div className="rounded-lg border border-border bg-white px-3.5 py-2.5 shadow-lg">
            <p className="mb-1 text-xs font-semibold font-text text-mist-900">{point.fullLabel}</p>
            <p className="text-xs font-text text-mist-500">
                Sales: <span className="font-medium text-mist-900">{formatPrice(point.sales)}</span>
            </p>
            <p className="text-xs font-text text-mist-500">
                Orders: <span className="font-medium text-mist-900">{point.orders}</span>
            </p>
        </div>
    );
}
