"use client";

import { Briefcase, HandCoins, Star, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { formatCompactPrice, formatPrice } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { MANUFACTURER_JOBS_URL, MANUFACTURER_REVIEWS_URL, MANUFACTURER_TRANSACTIONS_URL } from "@/constant/manufacturer";
import LoadError from "../loadError";

/** Green at or above the platform's average, amber below it, grey with nothing to compare. */
const compareTone = (mine: number | null | undefined, platform: number | null | undefined) =>
    mine == null || platform == null ? ("gray" as const) : mine >= platform ? ("green" as const) : ("amber" as const);

/**
 * The four headline figures, in the overview card design: their jobs, what
 * they've made, how reliably they deliver and how they're rated (each beside
 * the platform's average). Labels show straight away; the figures load.
 */
export default function StatsGrid() {
    const { data: dashboard, isPending, isError } = useQuery({
        queryKey: queryKeys.manufacturers.dashboard(),
        queryFn: () => manufacturerService.getDashboard(),
    });

    if (isError) {
        return <LoadError>Couldn&apos;t load your figures. Please refresh the page to try again.</LoadError>;
    }

    const naira = (kobo: number | undefined) => ({ value: formatCompactPrice((kobo ?? 0) / 100), full: formatPrice((kobo ?? 0) / 100) });
    const made = naira(dashboard?.wallet.totalMadeKobo);
    const balance = naira(dashboard?.wallet.balanceKobo);
    const deliveryRate = dashboard?.deliveryRate;
    const starRate = dashboard?.starRate;

    return (
        <OverviewCardGrid>
            <OverviewCard
                icon={Briefcase}
                label="Total jobs"
                value={dashboard?.jobs.total.toLocaleString()}
                detail={{ label: "Active now", value: dashboard?.jobs.active.toLocaleString(), tone: "blue" }}
                href={MANUFACTURER_JOBS_URL}
                loading={isPending}
            />
            <OverviewCard
                icon={HandCoins}
                label="Total amount made"
                value={made.value}
                fullValue={made.full}
                detail={{ label: "In your wallet", value: balance.value, tone: "green" }}
                href={MANUFACTURER_TRANSACTIONS_URL}
                loading={isPending}
            />
            <OverviewCard
                icon={Truck}
                label="Delivery success rate"
                value={deliveryRate && (deliveryRate.user === null ? "N/A" : `${deliveryRate.user}%`)}
                detail={{
                    label: "Platform average",
                    value: deliveryRate && (deliveryRate.platform === null ? "N/A" : `${deliveryRate.platform}%`),
                    tone: compareTone(deliveryRate?.user, deliveryRate?.platform),
                }}
                href={MANUFACTURER_JOBS_URL}
                loading={isPending}
            />
            <OverviewCard
                icon={Star}
                label="Star rating"
                value={starRate && (starRate.user === null ? "Not rated yet" : `${starRate.user.toFixed(1)} / 5.0`)}
                detail={{
                    label: "Platform average",
                    value: starRate && (starRate.platform === null ? "N/A" : starRate.platform.toFixed(1)),
                    tone: compareTone(starRate?.user, starRate?.platform),
                }}
                href={MANUFACTURER_REVIEWS_URL}
                loading={isPending}
            />
        </OverviewCardGrid>
    );
}
