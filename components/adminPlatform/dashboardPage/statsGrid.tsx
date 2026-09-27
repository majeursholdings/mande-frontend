import { HandCoins, Hammer, Percent, UserRoundCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_DASHBOARD_STATS, type AdminDashboardStat } from "@/constant/admin";

const STAT_ICONS: Record<AdminDashboardStat["icon"], { icon: LucideIcon; className: string }> = {
    manufacturers: { icon: Hammer, className: "bg-indigo-500" },
    revenue: { icon: HandCoins, className: "bg-error-500" },
    "success-rate": { icon: Percent, className: "bg-primary-600" },
    "active-accounts": { icon: UserRoundCheck, className: "bg-warning-500" },
};

/** The headline numbers — a swipeable row on phones, two columns on tablets, four from xl. */
export default function StatsGrid() {
    return (
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
            {ADMIN_DASHBOARD_STATS.map((stat) => (
                <StatCard key={stat.id} stat={stat} />
            ))}
        </div>
    );
}

function StatCard({ stat }: { stat: AdminDashboardStat }) {
    const { icon: Icon, className: iconClassName } = STAT_ICONS[stat.icon];
    const change = Math.sign(stat.changePercent);

    return (
        <div className="flex w-65 shrink-0 snap-start flex-col justify-between gap-4 rounded-xl border border-border bg-white p-5 sm:w-auto">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm font-text leading-tight text-mist-500">{stat.label}</p>
                    <p
                        title={stat.fullValue}
                        className="text-[28px] font-semibold font-text leading-tight text-mist-950"
                    >
                        {stat.value}
                        {stat.valueSuffix && (
                            <span className="ml-1 text-sm font-normal text-mist-500">{stat.valueSuffix}</span>
                        )}
                    </p>
                </div>
                <span
                    className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-full text-white",
                        iconClassName,
                    )}
                >
                    <Icon className="size-6" strokeWidth={2} aria-hidden />
                </span>
            </div>
            <p className="flex items-center gap-2 text-xs font-text text-mist-400">
                <span
                    className={cn(
                        "rounded px-1.5 py-0.5 font-semibold",
                        change > 0 && "bg-primary-50 text-primary-700",
                        change < 0 && "bg-error-50 text-error-600",
                        // No change reads neutral, as in the empty dashboard design
                        change === 0 && "bg-mist-100 text-mist-700",
                    )}
                >
                    {change < 0 ? "−" : "+"}
                    {Math.abs(stat.changePercent)}%
                </span>
                since last month
            </p>
        </div>
    );
}
