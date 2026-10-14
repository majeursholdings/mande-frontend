"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { Check, Star, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCELERATOR_QUALIFYING_RANK_IDS } from "@/constant/accelerator";
import { MANUFACTURER_RANKS } from "@/constant/points";

const RANKS = MANUFACTURER_RANKS;

// Each rank in everyday words, for the line under the chart (the platform's
// own descriptions are written for staff)
const PLAIN_LINES: Record<string, string> = {
    "rising-maker": "Where every maker starts.",
    "skilled-maker": "A few jobs done, with good feedback.",
    "pro-maker": "Delivers on time, with little sent back.",
    "expert-maker": "Trusted with big, detailed orders.",
    "master-craftsman": "The very best work on MANDE.",
};

const IDLE_COLORS = ["bg-primary-100", "bg-primary-200", "bg-primary-300"];

const SPRING: Transition = { type: "spring", stiffness: 260, damping: 24 };

/** A bar's height: the lowest rank a third of the way up, the highest full. */
const barHeight = (index: number) => `${30 + (index * 70) / Math.max(1, RANKS.length - 1)}%`;

/**
 * The maker ranks as rising bars. They grow in one after another when the
 * chart comes into view. Hovering, focusing or tapping a bar grows it, sweeps
 * a shine across it, slides a soft highlight behind it, dims the others and
 * swaps the line under the chart for that rank's details. The qualifying
 * ranks carry a "Qualifies easily" badge. Calmer with reduced motion.
 */
export default function RankLadder({ qualifyingLabel }: { qualifyingLabel: string }) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const reduceMotion = useReducedMotion();
    const detailId = useId();
    const active = RANKS.find((rank) => rank.id === activeId) ?? null;

    return (
        <div className="flex flex-col gap-3 rounded-[10px] bg-white p-6 md:p-8">
            <ol
                className="grid grid-cols-5 gap-2 pt-10 md:gap-4"
                onPointerLeave={(event) => {
                    if (event.pointerType === "mouse") setActiveId(null);
                }}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setActiveId(null);
                }}
            >
                {RANKS.map((rank, index) => {
                    const qualifies = ACCELERATOR_QUALIFYING_RANK_IDS.includes(rank.id);
                    const isActive = activeId === rank.id;
                    const isDimmed = activeId !== null && !isActive;

                    return (
                        <li key={rank.id} className="relative">
                            {/* The soft highlight that slides from bar to bar */}
                            {isActive && (
                                <motion.span
                                    layoutId="rank-spotlight"
                                    aria-hidden
                                    transition={reduceMotion ? { duration: 0 } : SPRING}
                                    className="absolute -inset-x-1 -inset-y-2 rounded-lg bg-primary-50 md:-inset-x-2"
                                />
                            )}

                            <button
                                type="button"
                                aria-describedby={detailId}
                                aria-pressed={isActive}
                                onPointerEnter={(event) => {
                                    if (event.pointerType === "mouse") setActiveId(rank.id);
                                }}
                                onFocus={() => setActiveId(rank.id)}
                                onClick={() => setActiveId(rank.id)}
                                className="relative flex w-full cursor-pointer flex-col gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-4"
                            >
                                {/* Bars stand on one baseline, so names of any length line up under them */}
                                <div aria-hidden className="relative flex h-28 w-full items-end md:h-40">
                                    <motion.div
                                        className="relative w-full origin-bottom"
                                        style={{ height: barHeight(index) }}
                                        initial={reduceMotion ? false : { scaleY: 0, opacity: 0 }}
                                        whileInView={{ scaleY: 1, opacity: 1 }}
                                        viewport={{ once: true, amount: 0.6 }}
                                        transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: index * 0.09 }}
                                    >
                                        <motion.div
                                            className={cn(
                                                "relative h-full w-full origin-bottom overflow-hidden rounded-t-md",
                                                qualifies ? "bg-primary-700" : (IDLE_COLORS[index] ?? "bg-primary-300"),
                                            )}
                                            animate={{
                                                scaleY: isActive && !reduceMotion ? 1.08 : 1,
                                                opacity: isDimmed ? 0.4 : 1,
                                                boxShadow: isActive
                                                    ? "0 14px 28px -12px rgb(6 78 59 / 0.45)"
                                                    : "0 0 0 0 rgb(6 78 59 / 0)",
                                            }}
                                            transition={reduceMotion ? { duration: 0.15 } : SPRING}
                                        >
                                            {/* A shine sweeping across the bar */}
                                            <AnimatePresence>
                                                {isActive && !reduceMotion && (
                                                    <motion.span
                                                        key="shine"
                                                        className="absolute inset-y-0 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/45 to-transparent"
                                                        initial={{ left: "-60%" }}
                                                        animate={{ left: "130%" }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.75, ease: "easeOut" }}
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </motion.div>

                                        {/* The rank's level, popping up over the bar */}
                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.span
                                                    key="level"
                                                    className={cn(
                                                        "absolute -top-12 left-1/2 flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[11px] font-semibold whitespace-nowrap shadow-sm md:text-xs",
                                                        qualifies ? "bg-primary-950 text-primary-300" : "bg-white text-primary-800 ring-1 ring-primary-200",
                                                    )}
                                                    initial={reduceMotion ? { opacity: 0, x: "-50%" } : { opacity: 0, y: 10, scale: 0.7, x: "-50%" }}
                                                    animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                                                    exit={reduceMotion ? { opacity: 0, x: "-50%" } : { opacity: 0, y: 6, scale: 0.85, x: "-50%" }}
                                                    transition={reduceMotion ? { duration: 0.1 } : { type: "spring", stiffness: 420, damping: 22 }}
                                                >
                                                    {qualifies && <Trophy className="size-3" strokeWidth={2} />}
                                                    <span className="hidden sm:inline">LEVEL </span>
                                                    {rank.level}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>

                                <span className="flex flex-col items-start gap-1.5">
                                    <span
                                        className={cn(
                                            "text-xs leading-snug transition-colors duration-200 sm:text-sm md:text-base",
                                            qualifies || isActive ? "font-medium text-primary-900" : "font-light text-mist-700",
                                        )}
                                    >
                                        {rank.name}
                                    </span>
                                    {qualifies && (
                                        <span className="flex items-center gap-1 rounded-full bg-primary-100 p-1 text-xs font-medium text-primary-900 sm:px-2 sm:py-0.5">
                                            <Check className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
                                            <span className="sr-only sm:not-sr-only">Qualifies easily</span>
                                        </span>
                                    )}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>

            {/* The line under the chart: the hovered rank's details, or the rule */}
            <div id={detailId} aria-live="polite" className="relative mt-1 min-h-14 border-t border-border pt-4">
                <AnimatePresence mode="wait" initial={false}>
                    {active ? (
                        <motion.div
                            key={active.id}
                            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                        >
                            <p className="text-sm">
                                <span className="font-medium text-primary-900">{active.name}.</span>{" "}
                                <span className="font-light text-mist-700">{PLAIN_LINES[active.id] ?? active.description}</span>
                            </p>
                            <RankNeeds rankId={active.id} />
                        </motion.div>
                    ) : (
                        <motion.p
                            key="rule"
                            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="flex items-center gap-2 text-sm font-medium text-primary-800"
                        >
                            <TrendingUp className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                            Makers ranked {qualifyingLabel} qualify easily for a loan
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

/** What a rank asks for, as small chips: finished jobs and an average rating. */
function RankNeeds({ rankId }: { rankId: string }) {
    const rank = RANKS.find((item) => item.id === rankId);
    if (!rank) return null;
    const qualifies = ACCELERATOR_QUALIFYING_RANK_IDS.includes(rank.id);

    if (rank.minCompletedJobs === 0 && rank.minAverageRating === 0) {
        return <span className="text-sm font-light text-mist-600">Nothing needed to start</span>;
    }

    return (
        <ul className="flex shrink-0 flex-wrap gap-2">
            <li className="rounded-full bg-mist-100 px-2.5 py-1 text-xs text-mist-800">
                {rank.minCompletedJobs}+ finished jobs
            </li>
            <li className="flex items-center gap-1 rounded-full bg-mist-100 px-2.5 py-1 text-xs text-mist-800">
                <Star className="size-3 fill-current text-amber-500" aria-hidden />
                {rank.minAverageRating.toFixed(1)} average rating
            </li>
            {qualifies && (
                <li className="flex items-center gap-1 rounded-full bg-primary-950 px-2.5 py-1 text-xs font-medium text-primary-300">
                    <Check className="size-3" strokeWidth={2.5} aria-hidden />
                    Qualifies easily
                </li>
            )}
        </ul>
    );
}
