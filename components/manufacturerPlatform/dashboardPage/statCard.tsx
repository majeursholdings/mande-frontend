import { ClipboardList, Wallet, TrendingUp, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStat } from "@/constant/manufacturer";

const STAT_ICON: Record<DashboardStat["icon"], LucideIcon> = {
    jobs: ClipboardList,
    amount: Wallet,
    delivery: TrendingUp,
    quality: Star,
};

const STAT_ICON_CLASS: Record<DashboardStat["icon"], string> = {
    jobs: "bg-indigo-500 text-white",
    amount: "bg-secondary-600 text-white",
    delivery: "bg-primary-600 text-white",
    quality: "bg-warning-500 text-white",
};

/** A dashboard figure: its icon and label always show; while `loading`, skeletons stand in for the value and the line under it. */
export default function StatCard({
    stat,
    loading = false,
}: {
    stat: Pick<DashboardStat, "label" | "icon"> & Partial<Pick<DashboardStat, "value" | "subtext">>;
    loading?: boolean;
}) {
    const Icon = STAT_ICON[stat.icon];

    return (
        <div className="flex h-full min-w-0 flex-col gap-4 rounded-xl border border-border bg-white p-4 lg:p-5 transition-shadow hover:shadow-xs">
            <span
                className={cn(
                    "flex items-center justify-center size-10 lg:size-11 rounded-full shrink-0",
                    STAT_ICON_CLASS[stat.icon],
                )}
            >
                <Icon
                    className="size-5"
                    strokeWidth={1.75}
                    fill={stat.icon === "quality" ? "currentColor" : "none"}
                />
            </span>
            <div className="flex flex-col gap-1">
                <p className="text-xs lg:text-sm font-text text-mist-500">{stat.label}</p>
                {loading ? (
                    <>
                        <Skeleton className="h-7 lg:h-8 w-24" />
                        <Skeleton className="mt-0.5 h-4 w-20" />
                    </>
                ) : (
                    <>
                        <p className="text-xl lg:text-2xl font-semibold font-text text-mist-950">{stat.value}</p>
                        {stat.subtext && (
                            <p className="text-xs font-medium font-text text-secondary-700 mt-0.5">
                                {stat.subtext}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
