"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCompactPrice } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService } from "@/lib/services/manufacturerService";
import type { DashboardStat } from "@/constant/manufacturer";
import LoadError from "../loadError";
import StatCard from "./statCard";

/** The four headline figures. Labels show straight away; the figures load from the API. */
export default function StatsGrid() {
    const { data: dashboard, isPending, isError } = useQuery({
        queryKey: queryKeys.manufacturers.dashboard(),
        queryFn: () => manufacturerService.getDashboard(),
    });

    if (isError) {
        return <LoadError>Couldn&apos;t load your figures. Please refresh the page to try again.</LoadError>;
    }

    const stats: (Pick<DashboardStat, "id" | "label" | "icon"> & Partial<DashboardStat>)[] = [
        {
            id: "jobs-total",
            label: "Total Jobs",
            value: dashboard && String(dashboard.jobs.total),
            subtext: dashboard && `${dashboard.jobs.active} active`,
            icon: "jobs",
        },
        {
            id: "amount-made",
            label: "Total Amount Made",
            value: dashboard && formatCompactPrice(dashboard.wallet.totalMadeKobo / 100),
            subtext: dashboard && `${formatCompactPrice(dashboard.wallet.balanceKobo / 100)} balance`,
            icon: "amount",
        },
        {
            id: "delivery-rate",
            label: "Delivery Success Rate",
            value: dashboard && `${dashboard.deliveryRate.user}%`,
            subtext: dashboard && `${dashboard.deliveryRate.platform}% platform avg`,
            icon: "delivery",
        },
        {
            id: "star-rating",
            label: "Star Rating",
            value: dashboard && `${dashboard.starRate.user} / 5.0`,
            subtext: dashboard && `${dashboard.starRate.platform} platform avg`,
            icon: "quality",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
                <StatCard key={stat.id} stat={stat} loading={isPending} />
            ))}
        </div>
    );
}
