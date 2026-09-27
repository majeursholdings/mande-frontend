"use client";

import { HandCoins, Hammer, Percent, UserRoundCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_MANUFACTURERS } from "@/constant/admin";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import { StatCard, StatCardRow } from "../statCard";
import { getDashboardStats, type AdminDashboardStat } from "./dashboardStats";

const STAT_ICONS: Record<AdminDashboardStat["icon"], { icon: LucideIcon; className: string }> = {
    manufacturers: { icon: Hammer, className: "bg-indigo-500" },
    payouts: { icon: HandCoins, className: "bg-error-500" },
    "success-rate": { icon: Percent, className: "bg-primary-600" },
    "active-accounts": { icon: UserRoundCheck, className: "bg-warning-500" },
};

/** The headline numbers — a swipeable row on phones, two columns on tablets, four from xl. */
export default function StatsGrid() {
    const { jobs } = useAdminJobs();
    const stats = getDashboardStats(jobs, ADMIN_MANUFACTURERS);

    return (
        <StatCardRow>
            {stats.map((stat) => {
                const { icon, className } = STAT_ICONS[stat.icon];
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
