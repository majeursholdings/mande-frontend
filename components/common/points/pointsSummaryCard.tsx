import { HelpCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import RankBadge from "./rankBadge";
import type { RankProgression } from "@/constant/points";
import { Skeleton } from "@/components/ui/skeleton";

interface PointsSummaryCardProps {
    points: number;
    progression?: RankProgression | null;
    role?: "manufacturer" | "admin";
    loading?: boolean;
    className?: string;
    onOpenGuide?: () => void;
}

export default function PointsSummaryCard({
    points,
    progression,
    role = "manufacturer",
    loading = false,
    className,
    onOpenGuide,
}: PointsSummaryCardProps) {
    if (loading) {
        return (
            <div className={cn("rounded-xl border border-border bg-white p-5 flex flex-col gap-4", className)}>
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-2 w-full rounded-full" />
            </div>
        );
    }

    const currentRank = progression?.currentRank;
    const nextRank = progression?.nextRank;
    const progressPercent = progression?.progressPercent ?? 0;

    return (
        <div
            className={cn(
                "rounded-xl border border-border bg-gradient-to-br from-white via-white to-secondary-50/30 p-5 shadow-xs flex flex-col gap-4",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Trophy className="size-4.5 text-secondary-600" aria-hidden />
                    <h2 className="text-sm font-semibold font-text text-mist-900">Points & Standing</h2>
                </div>
                <div className="flex items-center gap-2">
                    <RankBadge rankId={currentRank?.id} role={role} size="sm" />
                    {onOpenGuide && (
                        <button
                            type="button"
                            onClick={onOpenGuide}
                            title="View Point & Ranking Guide"
                            className="text-mist-400 hover:text-mist-600 p-1 rounded-md transition-colors"
                        >
                            <HelpCircle className="size-4" aria-hidden />
                            <span className="sr-only">Point Guide</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-baseline justify-between">
                <div>
                    <span className="text-3xl font-bold font-text text-mist-950 tracking-tight">
                        {points.toLocaleString()}
                    </span>
                    <span className="text-xs font-text text-mist-500 ml-1.5">points</span>
                </div>
                {nextRank && (
                    <span className="text-xs font-text text-mist-500 flex items-center gap-1">
                        <span>Next:</span>
                        <span className="font-medium text-mist-800">{nextRank.name}</span>
                    </span>
                )}
            </div>

            {nextRank ? (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-text text-mist-500">
                        <span>Tier progress</span>
                        <span className="tabular-nums font-medium text-mist-700">{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-secondary-600 transition-all duration-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-[11px] font-text text-mist-500 mt-0.5">
                        {progression?.pointsToNext.toLocaleString()} points needed to reach {nextRank.name}
                        {progression && progression.completedJobsNeeded > 0 && ` (${progression.completedJobsNeeded} more completed jobs)`}
                        .
                    </p>
                </div>
            ) : (
                <div className="rounded-lg bg-amber-50/70 border border-amber-200/60 px-3 py-2 text-xs text-amber-900 flex items-center gap-2">
                    <Trophy className="size-4 text-amber-600 shrink-0" aria-hidden />
                    <span>Top tier reached! You have attained the highest platform rank.</span>
                </div>
            )}
        </div>
    );
}
