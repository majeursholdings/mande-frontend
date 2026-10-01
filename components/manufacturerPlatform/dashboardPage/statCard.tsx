import { ClipboardList, Wallet, TrendingUp, Star, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

export default function StatCard({ stat }: { stat: DashboardStat }) {
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
                <p className="text-xl lg:text-2xl font-semibold font-text text-mist-950">{stat.value}</p>
                {stat.subtext && (
                    <p className="text-xs font-medium font-text text-secondary-700 mt-0.5">
                        {stat.subtext}
                    </p>
                )}
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="flex h-full min-w-0 flex-col gap-4 rounded-xl border border-border bg-white p-4 lg:p-5 animate-pulse">
            <div className="size-10 lg:size-11 rounded-full bg-mist-100 shrink-0" />
            <div className="flex flex-col gap-2">
                <div className="h-3.5 w-24 rounded bg-mist-100" />
                <div className="h-6 w-28 rounded bg-mist-200" />
                <div className="h-3 w-20 rounded bg-mist-100" />
            </div>
        </div>
    );
}
