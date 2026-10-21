"use client";

import { Banknote, CalendarClock, HandCoins, Hammer, Percent, Store, TrendingUp, UserRoundCheck, type LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import OverviewCard, { OverviewCardGrid, type OverviewCardProps } from "@/components/common/overviewCard";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";
import { SUPER_ADMIN_BOOKING_TRANSACTIONS_URL, SUPER_ADMIN_REVENUE_URL, SUPER_ADMIN_SHOP_URL } from "@/constant/superAdmin";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService } from "@/lib/services/reportsService";
import {
    ADMIN_DASHBOARD_STAT_IDS,
    DASHBOARD_STAT_LABELS,
    toDashboardStats,
    type DashboardStatId,
} from "./dashboardStats";
import { ReportError } from "./reportStates";

const STAT_ICONS: Record<DashboardStatId, LucideIcon> = {
    manufacturers: Hammer,
    payouts: HandCoins,
    "subscription-revenue": Banknote,
    revenue: TrendingUp,
    "shop-sales": Store,
    "machine-bookings": CalendarClock,
    "success-rate": Percent,
    "active-accounts": UserRoundCheck,
};

/** "+12%" (green), "−3%" (red), "0%" (grey) or "New" (nothing a month ago to compare with): the change since last month. */
function changeSinceLastMonth(changePercent: number | null): NonNullable<OverviewCardProps["detail"]> {
    if (changePercent === null) return { label: "Since last month", value: "New", tone: "green" };
    const change = Math.sign(changePercent);
    return {
        label: "Since last month",
        value: `${change < 0 ? "−" : "+"}${Math.abs(changePercent)}%`,
        tone: change > 0 ? "green" : change < 0 ? "red" : "gray",
    };
}

/**
 * The headline numbers (the admin's, unless `statIds` says otherwise), from
 * /reports/dashboard, in the overview card design: each with its change since
 * last month, and "See in details" to the page behind it.
 */
export default function StatsGrid({ statIds = ADMIN_DASHBOARD_STAT_IDS }: { statIds?: DashboardStatId[] }) {
    const platform = useStaffPlatform();
    const { data, isPending, isError } = useQuery({
        queryKey: queryKeys.reports.dashboard(),
        queryFn: () => reportsService.getDashboard(),
        staleTime: 30_000,
    });

    // Where each figure comes from, on this platform (revenue is the super admin's)
    const isSuperAdmin = platform.key === "super-admin";
    const detailsHref: Record<DashboardStatId, string | undefined> = {
        manufacturers: platform.manufacturersUrl,
        payouts: platform.transactionsUrl,
        "subscription-revenue": isSuperAdmin ? SUPER_ADMIN_REVENUE_URL : undefined,
        revenue: isSuperAdmin ? SUPER_ADMIN_REVENUE_URL : undefined,
        "shop-sales": isSuperAdmin ? `${SUPER_ADMIN_SHOP_URL}/orders` : undefined,
        "machine-bookings": isSuperAdmin ? SUPER_ADMIN_BOOKING_TRANSACTIONS_URL : undefined,
        "success-rate": platform.jobsUrl,
        "active-accounts": platform.manufacturersUrl,
    };

    if (isError) return <ReportError message="Couldn't load the dashboard's numbers. Please refresh to try again." />;

    const stats = data ? toDashboardStats(data.stats, statIds) : null;
    // Six fill two rows of three
    const columns = statIds.length === 4 ? 4 : statIds.length % 3 === 0 ? 3 : statIds.length >= 4 ? 4 : 2;

    return (
        <OverviewCardGrid columns={columns}>
            {statIds.map((id) => {
                const stat = stats?.find((candidate) => candidate.id === id);
                return (
                    <OverviewCard
                        key={id}
                        icon={STAT_ICONS[id]}
                        label={stat?.label ?? DASHBOARD_STAT_LABELS[id]}
                        // "32 / 40", as the design writes a ratio
                        value={stat ? `${stat.value}${stat.valueSuffix ? ` ${stat.valueSuffix.replace(/^\//, "/ ")}` : ""}` : ""}
                        fullValue={stat?.fullValue}
                        detail={changeSinceLastMonth(stat?.changePercent ?? null)}
                        href={detailsHref[id]}
                        loading={isPending}
                    />
                );
            })}
        </OverviewCardGrid>
    );
}
