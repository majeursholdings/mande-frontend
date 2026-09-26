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
        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-white p-4 shrink-0 w-56 lg:w-auto">
            <span
                className={cn(
                    "flex items-center justify-center size-11 rounded-full shrink-0",
                    STAT_ICON_CLASS[stat.icon],
                )}
            >
                <Icon
                    className="size-5"
                    strokeWidth={1.75}
                    fill={stat.icon === "quality" ? "currentColor" : "none"}
                />
            </span>
            <div className="min-w-0">
                <p className="text-xs font-text text-mist-500 truncate">{stat.label}</p>
                <p className="text-xl font-semibold font-text text-mist-950">{stat.value}</p>
            </div>
        </div>
    );
}
