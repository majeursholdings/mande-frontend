"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService, type SeriesMetric, type SeriesRange, type SeriesResponse } from "@/lib/services/reportsService";
import DashboardCard from "@/components/adminPlatform/dashboardPage/dashboardCard";
import PillSelect from "@/components/adminPlatform/dashboardPage/pillSelect";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import MotionBarChart, { type BarSeries } from "@/components/common/charts/motionBarChart";

// ─────────────────────────────────────────────────────────────────────────────
// FinanceSeriesCard: one financial chart on the Reporting page (revenue, the
// shop or machine bookings), from /reports/series: a time frame to pick, the
// headline total with how it moved against the period before (up or down),
// a few supporting figures, and the bars over time.
// ─────────────────────────────────────────────────────────────────────────────

export const SERIES_RANGE_OPTIONS: { value: SeriesRange; label: string }[] = [
    { value: "week", label: "Last 7 days" },
    { value: "month", label: "Last 30 days" },
    { value: "quarter", label: "Last 13 weeks" },
    { value: "year", label: "Last 12 months" },
];

/** The x axis's title for each time frame: what one bar is. */
export const SERIES_X_LABELS: Record<SeriesRange, string> = {
    week: "Day",
    month: "Day",
    quarter: "Week starting",
    year: "Month",
};

/** "Compared with the 7 days before", for the change line. */
const PREVIOUS_LABELS: Record<SeriesRange, string> = {
    week: "the 7 days before",
    month: "the 30 days before",
    quarter: "the 13 weeks before",
    year: "the 12 months before",
};

type Values<M extends SeriesMetric> = SeriesResponse<M>["totals"];
type Point<M extends SeriesMetric> = SeriesResponse<M>["points"][number];

export type SeriesFigure<M extends SeriesMetric> = {
    label: string;
    value: (totals: Values<M>) => string;
};

/** The change from `before` to `now` in whole percent; null when there was nothing before to compare with. */
export function changePercent(now: number, before: number): number | null {
    if (before === 0) return now === 0 ? 0 : null;
    return Math.round(((now - before) / Math.abs(before)) * 100);
}

/** Up (green), down (red) or level, against the period before. `upIsGood: false` for money going out. */
export function ChangeChip({ change, upIsGood = true, against }: { change: number | null; upIsGood?: boolean; against?: string }) {
    const direction = change === null ? 1 : Math.sign(change);
    const good = direction === 0 ? null : (direction > 0) === upIsGood;
    const Icon = direction < 0 ? TrendingDown : TrendingUp;
    return (
        <span className="flex flex-wrap items-center gap-2 text-xs text-mist-500">
            <span
                className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold tabular-nums",
                    good === null ? "bg-mist-100 text-mist-600" : good ? "bg-emerald-50 text-emerald-700" : "bg-error-50 text-error-700",
                )}
            >
                {direction !== 0 && <Icon className="size-3.5" aria-hidden />}
                {change === null ? "New" : `${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(change)}%`}
                <span className="sr-only">{direction > 0 ? " up" : direction < 0 ? " down" : " no change"}</span>
            </span>
            {against && <span>vs {against}</span>}
        </span>
    );
}

export default function FinanceSeriesCard<M extends SeriesMetric>({
    metric,
    title,
    icon: Icon,
    headline,
    upIsGood = true,
    figures,
    series,
    yLabel,
    formatTick,
    formatValue,
    emptyMessage,
    defaultRange = "year",
}: {
    metric: M;
    title: string;
    icon: LucideIcon;
    /** The big number: its label and value from the totals (kobo or a count). */
    headline: { label: string; value: (totals: Values<M>) => number; format: (value: number) => string };
    /** Whether the headline going up is good news. */
    upIsGood?: boolean;
    figures: SeriesFigure<M>[];
    series: BarSeries<Point<M>>[];
    yLabel: string;
    formatTick: (value: number) => string;
    formatValue: (value: number) => string;
    emptyMessage: string;
    defaultRange?: SeriesRange;
}) {
    const [range, setRange] = useState<SeriesRange>(defaultRange);
    const query = useQuery({
        queryKey: queryKeys.reports.series(metric, range),
        queryFn: () => reportsService.getSeries(metric, range),
        staleTime: 30_000,
        // Keep the old bars while the new time frame loads, so the card doesn't jump
        placeholderData: (previous) => previous,
    });
    const data = query.data;
    const loading = query.isPending;
    const now = data ? headline.value(data.totals) : 0;
    const before = data ? headline.value(data.previous) : 0;

    return (
        <DashboardCard
            title={
                <span className="flex items-center gap-2">
                    <Icon className="size-5 text-mist-500" aria-hidden />
                    {title}
                </span>
            }
            action={<PillSelect label="Time frame" value={range} options={SERIES_RANGE_OPTIONS} onChange={setRange} />}
        >
            {query.isError ? (
                <ReportError message={`Couldn't load the ${title.toLowerCase()} figures. Please refresh to try again.`} />
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-mist-500">{headline.label}</p>
                            {loading ? (
                                <Skeleton className="h-8 w-32" />
                            ) : (
                                <p className="text-3xl font-semibold tabular-nums text-mist-950">{headline.format(now)}</p>
                            )}
                            {loading ? (
                                <Skeleton className="h-5 w-40" />
                            ) : (
                                <ChangeChip change={changePercent(now, before)} upIsGood={upIsGood} against={PREVIOUS_LABELS[range]} />
                            )}
                        </div>
                        <dl className="flex flex-wrap gap-x-6 gap-y-3">
                            {figures.map((figure) => (
                                <div key={figure.label} className="flex min-w-0 flex-col gap-0.5 border-l-2 border-mist-100 pl-3">
                                    <dt className="text-xs text-mist-500">{figure.label}</dt>
                                    <dd className="text-base font-semibold tabular-nums text-mist-950">
                                        {loading || !data ? <Skeleton className="my-0.5 h-5 w-16" /> : figure.value(data.totals)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <MotionBarChart
                        data={data?.points ?? []}
                        series={series}
                        xLabel={SERIES_X_LABELS[range]}
                        yLabel={yLabel}
                        formatTick={formatTick}
                        formatValue={formatValue}
                        loading={loading}
                        emptyMessage={emptyMessage}
                        animationKey={`${metric}-${data?.range ?? range}`}
                        caption={`${title}, ${SERIES_RANGE_OPTIONS.find((option) => option.value === range)?.label.toLowerCase()}`}
                    />
                </div>
            )}
        </DashboardCard>
    );
}
