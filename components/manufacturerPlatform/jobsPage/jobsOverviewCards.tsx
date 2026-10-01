"use client";

import { useQuery } from "@tanstack/react-query";
import { Briefcase, Clock, CheckCircle2, ShoppingBag } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";

export default function JobsOverviewCards() {
    const { data: overview, isPending } = useQuery({
        queryKey: queryKeys.jobs.overview(),
        queryFn: () => jobsService.getOverview(),
    });

    if (isPending) {
        return (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 animate-pulse">
                        <div className="size-9 rounded-full bg-mist-100" />
                        <div className="h-3.5 w-20 rounded bg-mist-100" />
                        <div className="h-6 w-12 rounded bg-mist-200" />
                    </div>
                ))}
            </div>
        );
    }

    const cards = [
        {
            id: "active",
            label: "Active Jobs",
            value: overview?.activeCount ?? 0,
            icon: Briefcase,
            iconColor: "bg-secondary-50 text-secondary-600",
        },
        {
            id: "in-review",
            label: "In Review",
            value: overview?.inReviewCount ?? 0,
            icon: Clock,
            iconColor: "bg-warning-50 text-warning-600",
        },
        {
            id: "completed",
            label: "Completed",
            value: overview?.completedCount ?? 0,
            icon: CheckCircle2,
            iconColor: "bg-primary-50 text-primary-600",
        },
        {
            id: "marketplace",
            label: "Open Marketplace",
            value: overview?.openMarketCount ?? 0,
            icon: ShoppingBag,
            iconColor: "bg-indigo-50 text-indigo-600",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.id}
                        className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-xs"
                    >
                        <span className={`flex size-9 items-center justify-center rounded-full ${card.iconColor}`}>
                            <Icon className="size-4.5" strokeWidth={1.75} />
                        </span>
                        <div>
                            <p className="text-xs font-text text-mist-500">{card.label}</p>
                            <p className="text-xl font-semibold font-text text-mist-950">{card.value}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
