"use client";

import { Banknote, HandCoins, Hammer, Percent, UserRoundCheck, type LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService } from "@/lib/services/reportsService";
import { StatCard, StatCardRow } from "../statCard";
import {
    ADMIN_DASHBOARD_STAT_IDS,
    DASHBOARD_STAT_LABELS,
    toDashboardStats,
    type DashboardStatId,
} from "./dashboardStats";
import { ReportError, StatCardSkeleton } from "./reportStates";

// Money gets the design's red circle; each figure keeps its colour on every dashboard
const STAT_ICONS: Record<DashboardStatId, { icon: LucideIcon; className: string }> = {
    manufacturers: { icon: Hammer, className: "bg-indigo-500" },
    payouts: { icon: HandCoins, className: "bg-error-500" },
    "subscription-revenue": { icon: Banknote, className: "bg-error-500" },
    "success-rate": { icon: Percent, className: "bg-primary-600" },
    "active-accounts": { icon: UserRoundCheck, className: "bg-warning-500" },
};

/**
 * The headline numbers (the admin's, unless `statIds` says otherwise), from
 * /reports/dashboard: a swipeable row on phones, two columns on tablets,
 * four from xl.
 */
export default function StatsGrid({ statIds = ADMIN_DASHBOARD_STAT_IDS }: { statIds?: DashboardStatId[] }) {
    const { data, isPending, isError } = useQuery({
        queryKey: queryKeys.reports.dashboard(),
        queryFn: () => reportsService.getDashboard(),
        staleTime: 30_000,
    });

    if (isError) return <ReportError message="Couldn't load the dashboard's numbers. Please refresh to try again." />;

    if (isPending) {
        return (
            <StatCardRow>
                {statIds.map((id) => (
                    <StatCardSkeleton
                        key={id}
                        label={DASHBOARD_STAT_LABELS[id]}
                        icon={STAT_ICONS[id].icon}
                        iconClassName={STAT_ICONS[id].className}
                    />
                ))}
            </StatCardRow>
        );
    }

    const stats = toDashboardStats(data.stats, statIds);

    return (
        <StatCardRow>
            {stats.map((stat) => {
                const { icon, className } = STAT_ICONS[stat.id];
                return (
                    <StatCard
                        key={stat.id}
                        label={stat.label}
                        value={stat.value}
                        fullValue={stat.fullValue}
                        valueSuffix={stat.valueSuffix}
                        icon={icon}
                        iconClassName={className}
                        footer={<ChangeSinceLastMonth changePercent={stat.changePercent} />}
                    />
                );
            })}
        </StatCardRow>
    );
}

function ChangeSinceLastMonth({ changePercent }: { changePercent: number | null }) {
    // Nothing a month ago to compare with reads as new, like a rise
    const change = changePercent === null ? 1 : Math.sign(changePercent);

    return (
        <>
            <span
                className={cn(
                    "rounded px-1.5 py-0.5 font-semibold",
                    change > 0 && "bg-primary-50 text-primary-700",
                    change < 0 && "bg-error-50 text-error-600",
                    // No change reads neutral, as in the empty dashboard design
                    change === 0 && "bg-mist-100 text-mist-700",
                )}
            >
                {changePercent === null ? "New" : `${change < 0 ? "−" : "+"}${Math.abs(changePercent)}%`}
            </span>
            since last month
        </>
    );
}
