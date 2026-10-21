"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// MotionBarChart: a bar chart in plain HTML, animated with motion: the bars
// grow from the zero line in turn when they arrive (and again when the data
// changes, e.g. a new time frame), and the column under the pointer lifts
// with a tooltip of its figures. One or two series side by side (e.g. money
// in and money out), negative values below the zero line, and both axes
// titled. Long runs of bars show every few x labels so they never collide.
// Screen readers get the figures as a table instead of the drawing.
// ─────────────────────────────────────────────────────────────────────────────

export type BarSeries<T> = {
    /** The figure on each point. */
    value: (point: T) => number;
    /** In the legend and tooltip, e.g. "Sales". */
    label: string;
    /** The bar's fill, e.g. "#08783e". */
    color: string;
};

const NICE_STEPS = [1, 2, 2.5, 5, 10];
const TICK_COUNT = 4;
/** The most x labels shown: the rest are skipped evenly. */
const MAX_X_LABELS = 8;

/** A round step that fits `span` in about TICK_COUNT ticks. */
function niceStep(span: number): number {
    if (span <= 0) return 1;
    const rough = span / TICK_COUNT;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    return (NICE_STEPS.find((step) => step * magnitude >= rough) ?? 10) * magnitude;
}

/** The y axis: from a round number at or under the lowest value (0 unless something's negative) to one at or over the highest. */
function yScale(values: number[]) {
    const low = Math.min(0, ...values);
    const high = Math.max(0, ...values);
    const step = niceStep(high - low);
    const min = Math.floor(low / step) * step;
    const max = Math.max(step, Math.ceil(high / step) * step);
    const ticks: number[] = [];
    for (let tick = min; tick <= max + step / 2; tick += step) ticks.push(Math.round(tick * 1000) / 1000);
    return { min, max, ticks };
}

export default function MotionBarChart<T extends { label: string }>({
    data,
    series,
    xLabel,
    yLabel,
    formatTick,
    formatValue,
    height = 260,
    loading = false,
    emptyMessage = "Nothing in this period yet.",
    animationKey,
    caption,
}: {
    data: T[];
    series: BarSeries<T>[];
    /** The x axis's title, e.g. "Day". */
    xLabel: string;
    /** The y axis's title, e.g. "Amount (₦)". */
    yLabel: string;
    /** A y tick, short, e.g. "₦1.2M". */
    formatTick: (value: number) => string;
    /** A value in the tooltip, in full, e.g. "₦1,204,500". */
    formatValue: (value: number) => string;
    /** The plot's height in px. */
    height?: number;
    loading?: boolean;
    /** Over the bars when every value is 0. */
    emptyMessage?: string;
    /** Changes when the bars should grow in again (e.g. the time frame). */
    animationKey?: string;
    /** What the chart shows, for screen readers' table. */
    caption: string;
}) {
    const reduceMotion = useReducedMotion();
    const [hovered, setHovered] = useState<number | null>(null);

    if (loading) return <Skeleton className="w-full rounded-lg" style={{ height: height + 48 }} />;

    const values = data.flatMap((point) => series.map((each) => each.value(point)));
    const { min, max, ticks } = yScale(values);
    const span = max - min || 1;
    // Where 0 sits, from the bottom, as a share of the plot
    const zero = ((0 - min) / span) * 100;
    const isEmpty = values.every((value) => value === 0);
    const labelEvery = Math.max(1, Math.ceil(data.length / MAX_X_LABELS));

    return (
        <figure className="flex flex-col gap-3 font-text">
            {series.length > 1 && (
                <figcaption className="flex flex-wrap items-center gap-4 text-xs text-mist-600" aria-hidden>
                    {series.map((each) => (
                        <span key={each.label} className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm" style={{ backgroundColor: each.color }} />
                            {each.label}
                        </span>
                    ))}
                </figcaption>
            )}

            <div aria-hidden className="grid grid-cols-[auto_auto_minmax(0,1fr)] grid-rows-[auto_auto_auto]">
                {/* The y axis's title, turned to read upwards */}
                <div className="row-span-2 flex items-center pr-1">
                    <span className="whitespace-nowrap text-[11px] font-medium text-mist-500 [writing-mode:vertical-rl] rotate-180">{yLabel}</span>
                </div>

                {/* Y ticks, each level with its gridline */}
                <div className="relative mr-2 min-w-10" style={{ height }}>
                    {ticks.map((tick) => (
                        <span
                            key={tick}
                            className="absolute right-0 translate-y-1/2 text-right text-[11px] tabular-nums text-mist-400"
                            style={{ bottom: `${((tick - min) / span) * 100}%` }}
                        >
                            {formatTick(tick)}
                        </span>
                    ))}
                </div>

                {/* The plot */}
                <div className="relative" style={{ height }} onMouseLeave={() => setHovered(null)}>
                    {ticks.map((tick) => (
                        <span
                            key={tick}
                            className={cn("absolute inset-x-0 border-t", tick === 0 ? "border-mist-300" : "border-mist-100")}
                            style={{ bottom: `${((tick - min) / span) * 100}%` }}
                        />
                    ))}

                    <div className="absolute inset-0 flex items-stretch gap-[3px] sm:gap-1.5">
                        {data.map((point, index) => (
                            <div
                                key={`${point.label}-${index}`}
                                className="relative flex flex-1 items-stretch justify-center gap-px rounded-md transition-colors"
                                style={{ backgroundColor: hovered === index ? "rgba(240,244,242,0.9)" : undefined }}
                                onMouseEnter={() => setHovered(index)}
                            >
                                {series.map((each, seriesIndex) => {
                                    const value = each.value(point);
                                    const size = (Math.abs(value) / span) * 100;
                                    const position = value >= 0 ? { bottom: `${zero}%` } : { top: `${100 - zero}%` };
                                    return (
                                        <div key={each.label} className="relative h-full w-full max-w-7">
                                            <motion.div
                                                key={animationKey}
                                                className={cn("absolute inset-x-0", value >= 0 ? "rounded-t-[4px]" : "rounded-b-[4px]")}
                                                style={{ ...position, backgroundColor: each.color, transformOrigin: value >= 0 ? "bottom" : "top" }}
                                                initial={reduceMotion ? false : { height: 0 }}
                                                animate={{ height: `${size}%`, opacity: hovered === null || hovered === index ? 1 : 0.45 }}
                                                transition={{
                                                    height: { type: "spring", stiffness: 140, damping: 20, delay: reduceMotion ? 0 : index * 0.025 + seriesIndex * 0.04 },
                                                    opacity: { duration: 0.15 },
                                                }}
                                                whileHover={reduceMotion ? undefined : { scaleX: 1.08 }}
                                            />
                                        </div>
                                    );
                                })}

                                <AnimatePresence>
                                    {hovered === index && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                            transition={{ duration: 0.14 }}
                                            className={cn(
                                                "pointer-events-none absolute bottom-full z-10 mb-2 min-w-36 rounded-lg border border-mist-200 bg-white px-3 py-2 text-xs shadow-lg",
                                                // Kept inside the plot at both ends
                                                index < data.length / 3 ? "left-0" : index > (data.length * 2) / 3 ? "right-0" : "left-1/2 -translate-x-1/2",
                                            )}
                                        >
                                            <p className="mb-1 font-semibold text-mist-950">{point.label}</p>
                                            {series.map((each) => (
                                                <p key={each.label} className="flex items-center justify-between gap-3 text-mist-600">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="size-2 rounded-sm" style={{ backgroundColor: each.color }} />
                                                        {each.label}
                                                    </span>
                                                    <span className="font-semibold tabular-nums text-mist-950">{formatValue(each.value(point))}</span>
                                                </p>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    {isEmpty && (
                        <p className="absolute inset-0 flex items-center justify-center text-sm text-mist-400">{emptyMessage}</p>
                    )}
                </div>

                {/* X labels, under their bars */}
                <div className="col-start-3 mt-2 flex gap-[3px] sm:gap-1.5">
                    {data.map((point, index) => (
                        <span key={`${point.label}-${index}`} className="flex-1 truncate text-center text-[11px] text-mist-400">
                            {(data.length - 1 - index) % labelEvery === 0 ? point.label : ""}
                        </span>
                    ))}
                </div>
                {/* The x axis's title */}
                <p className="col-start-3 mt-1 text-center text-[11px] font-medium text-mist-500">{xLabel}</p>
            </div>

            <table className="sr-only">
                <caption>{caption}</caption>
                <thead>
                    <tr>
                        <th scope="col">{xLabel}</th>
                        {series.map((each) => (
                            <th key={each.label} scope="col">
                                {each.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((point, index) => (
                        <tr key={`${point.label}-${index}`}>
                            <th scope="row">{point.label}</th>
                            {series.map((each) => (
                                <td key={each.label}>{formatValue(each.value(point))}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}
