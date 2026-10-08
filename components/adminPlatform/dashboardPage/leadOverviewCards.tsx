"use client";

import { Briefcase, HandCoins, Star, UsersRound } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { ADMIN_JOBS_URL, ADMIN_MANUFACTURERS_URL, ADMIN_TRANSACTIONS_URL } from "@/constant/admin";
import { useLeadOverview } from "@/hooks/useLeadOverview";
import { useMyPoints } from "@/hooks/usePoints";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import { ReportError } from "./reportStates";

/** The admin's points page. */
const POINTS_URL = "/admin/profile/points";

/**
 * The project lead's dashboard headline: their manufacturers, their jobs,
 * the money those jobs moved, and their standing (points, stars, rank). All
 * their own, from /reports/lead-overview and /points/me.
 */
export default function LeadOverviewCards() {
    const { overview, isLoading, isError } = useLeadOverview();
    const points = useMyPoints();

    if (isError) return <ReportError message="Couldn't load your numbers. Please refresh to try again." />;

    const money = (kobo: number | undefined) => ({
        value: formatCompactPrice(fromKobo(kobo ?? 0)),
        full: formatPrice(fromKobo(kobo ?? 0)),
    });
    const paidOut = money(overview?.money.paidOutKobo);
    const pending = money(overview?.money.pendingKobo);
    const rating = points.summary?.averageRating ?? null;

    return (
        <OverviewCardGrid>
            <OverviewCard
                icon={UsersRound}
                label="Manufacturers on Mande"
                value={overview?.manufacturers.onPlatform.toLocaleString()}
                detail={{ label: "Worked with you", value: overview?.manufacturers.workedWithYou.toLocaleString(), tone: "green" }}
                href={ADMIN_MANUFACTURERS_URL}
                loading={isLoading}
            />
            <OverviewCard
                icon={Briefcase}
                label="Your jobs, all time"
                value={overview?.jobs.allTime.toLocaleString()}
                detail={{ label: "Active now", value: overview?.jobs.active.toLocaleString(), tone: "blue" }}
                href={ADMIN_JOBS_URL}
                loading={isLoading}
            />
            <OverviewCard
                icon={HandCoins}
                label="Paid out on your jobs"
                value={paidOut.value}
                fullValue={paidOut.full}
                detail={{ label: "Still to pay", value: pending.value, tone: "amber" }}
                href={ADMIN_TRANSACTIONS_URL}
                loading={isLoading}
            />
            <OverviewCard
                icon={Star}
                label="Your points"
                value={points.summary?.points.toLocaleString()}
                detail={{
                    label: "Average rating",
                    value: rating === null ? "Not rated yet" : `${rating.toFixed(1)} ★`,
                    tone: rating === null ? "gray" : "green",
                }}
                href={POINTS_URL}
                loading={points.isLoading}
            />
        </OverviewCardGrid>
    );
}
