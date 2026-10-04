"use client";

import { useQuery } from "@tanstack/react-query";
import { Briefcase, Clock, CheckCircle2, ShoppingBag } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import { Skeleton } from "@/components/ui/skeleton";
import LoadError from "../loadError";

export default function JobsOverviewCards() {
    const { data: overview, isPending, isError } = useQuery({
        queryKey: queryKeys.jobs.overview(),
        queryFn: () => jobsService.getOverview(),
    });

    if (isError) {
        return <LoadError>Couldn&apos;t load your job counts. Please refresh the page to try again.</LoadError>;
    }

    const cards = [
        {
            id: "active",
            label: "Active Jobs",
            value: overview?.activeCount,
            icon: Briefcase,
            iconColor: "bg-secondary-50 text-secondary-600",
        },
        {
            id: "in-review",
            label: "In Review",
            value: overview?.inReviewCount,
            icon: Clock,
            iconColor: "bg-warning-50 text-warning-600",
        },
        {
            id: "completed",
            label: "Completed",
            value: overview?.completedCount,
            icon: CheckCircle2,
            iconColor: "bg-primary-50 text-primary-600",
        },
        {
            id: "marketplace",
            label: "Open Marketplace",
            value: overview?.openMarketCount,
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
                            {isPending ? (
                                <Skeleton className="mt-0.5 h-6 w-10" />
                            ) : (
                                <p className="text-xl font-semibold font-text text-mist-950">{card.value ?? 0}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
