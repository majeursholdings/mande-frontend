"use client";

import { useQuery } from "@tanstack/react-query";
import { Briefcase, CircleCheckBig, ShoppingBag } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import LoadError from "../loadError";

/** Above the manufacturer's jobs: what they're working on, what's done, and what's open to apply for. */
export default function JobsOverviewCards() {
    const { data: overview, isPending, isError } = useQuery({
        queryKey: queryKeys.jobs.overview(),
        queryFn: () => jobsService.getOverview(),
    });

    if (isError) {
        return <LoadError>Couldn&apos;t load your job counts. Please refresh the page to try again.</LoadError>;
    }

    return (
        <OverviewCardGrid columns={3}>
            <OverviewCard
                icon={Briefcase}
                label="Active jobs"
                value={overview?.activeCount.toLocaleString()}
                detail={{ label: "In review", value: overview?.inReviewCount.toLocaleString(), tone: "amber" }}
                loading={isPending}
            />
            <OverviewCard icon={CircleCheckBig} label="Completed" value={overview?.completedCount.toLocaleString()} loading={isPending} />
            <OverviewCard
                icon={ShoppingBag}
                label="Open marketplace"
                value={overview?.openMarketCount.toLocaleString()}
                loading={isPending}
            />
        </OverviewCardGrid>
    );
}
