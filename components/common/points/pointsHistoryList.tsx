import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrdinalDate, getRelativeTimeLabel } from "@/lib/date";
import type { PointEntryRecord } from "@/constant/points";
import { Skeleton } from "@/components/ui/skeleton";

interface PointsHistoryListProps {
    entries: PointEntryRecord[];
    loading?: boolean;
    emptyMessage?: string;
    className?: string;
    onDisputeClick?: (entry: PointEntryRecord) => void;
}

export default function PointsHistoryList({
    entries,
    loading = false,
    emptyMessage = "No point events recorded yet.",
    className,
    onDisputeClick,
}: PointsHistoryListProps) {
    if (loading) {
        return (
            <div className={cn("flex flex-col gap-2.5", className)}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-white">
                        <Skeleton className="size-8 rounded-full shrink-0" />
                        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-14 rounded-md" />
                    </div>
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className={cn("p-8 rounded-xl border border-dashed border-border bg-white text-center", className)}>
                <p className="text-sm font-text text-mist-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <ul className={cn("flex flex-col gap-2.5", className)}>
            {entries.map((entry) => {
                const isPositive = entry.points > 0;
                const isZero = entry.points === 0;
                const isDeliveryRejection = entry.event === "delivery_rejected" || entry.event === "delivery_rejection";

                return (
                    <li
                        key={entry.id}
                        className="flex items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-white hover:border-mist-300 transition-colors"
                    >
                        <div className="flex items-start gap-3 min-w-0">
                            <div
                                className={cn(
                                    "size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 sm:mt-0",
                                    isPositive
                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                        : isZero
                                          ? "bg-slate-50 text-slate-500 border border-slate-200"
                                          : "bg-red-50 text-red-600 border border-red-200",
                                )}
                            >
                                {isPositive ? (
                                    <ArrowUpRight className="size-4" aria-hidden />
                                ) : (
                                    <ArrowDownLeft className="size-4" aria-hidden />
                                )}
                            </div>

                            <div className="flex flex-col min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium font-text text-mist-900 leading-snug">
                                        {entry.summary}
                                    </span>
                                    {entry.jobCode && (
                                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-mist-100 text-mist-600">
                                            {entry.jobCode}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-text text-mist-500 mt-0.5">
                                    <span title={formatOrdinalDate(new Date(entry.createdAt))}>
                                        {getRelativeTimeLabel(new Date(entry.createdAt))}
                                    </span>
                                    {entry.jobId && (
                                        <>
                                            <span>•</span>
                                            <span className="truncate">{entry.jobTitle}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {isDeliveryRejection && onDisputeClick && (
                                <button
                                    type="button"
                                    onClick={() => onDisputeClick(entry)}
                                    className="hidden sm:inline-flex text-xs font-medium font-text text-secondary-700 hover:text-secondary-900 bg-secondary-50 hover:bg-secondary-100 px-2.5 py-1 rounded-md border border-secondary-200 transition-colors"
                                >
                                    Dispute
                                </button>
                            )}

                            <span
                                className={cn(
                                    "px-2.5 py-1 rounded-md text-xs font-bold font-mono tabular-nums",
                                    isPositive
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : isZero
                                          ? "bg-slate-50 text-slate-600 border border-slate-200"
                                          : "bg-red-50 text-red-700 border border-red-200",
                                )}
                            >
                                {isPositive ? `+${entry.points}` : entry.points}
                            </span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
