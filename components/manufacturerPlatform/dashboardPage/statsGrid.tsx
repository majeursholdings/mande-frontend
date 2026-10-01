"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCompactPrice } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService } from "@/lib/services/manufacturerService";
import type { DashboardStat } from "@/constant/manufacturer";
import StatCard, { StatCardSkeleton } from "./statCard";

export default function StatsGrid() {
    const { data: dashboard, isPending } = useQuery({
        queryKey: queryKeys.manufacturers.dashboard(),
        queryFn: () => manufacturerService.getDashboard(),
    });

    if (isPending) {
        return (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
        );
    }

    const stats: DashboardStat[] = [
        {
            id: "jobs-total",
            label: "Total Jobs",
            value: String(dashboard?.jobs.total ?? 0),
            subtext: `${dashboard?.jobs.active ?? 0} active`,
            icon: "jobs",
        },
        {
            id: "amount-made",
            label: "Total Amount Made",
            value: formatCompactPrice((dashboard?.wallet.totalMadeKobo ?? 0) / 100),
            subtext: `${formatCompactPrice((dashboard?.wallet.balanceKobo ?? 0) / 100)} balance`,
            icon: "amount",
        },
        {
            id: "delivery-rate",
            label: "Delivery Success Rate",
            value: `${dashboard?.deliveryRate.user ?? 100}%`,
            subtext: `${dashboard?.deliveryRate.platform ?? 95}% platform avg`,
            icon: "delivery",
        },
        {
            id: "star-rating",
            label: "Star Rating",
            value: `${dashboard?.starRate.user ?? 5.0} / 5.0`,
            subtext: `${dashboard?.starRate.platform ?? 4.8} platform avg`,
            icon: "quality",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
                <StatCard key={stat.id} stat={stat} />
            ))}
        </div>
    );
}
