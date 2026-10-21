"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarX, Receipt, TicketPercent, Wallet } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import { fetchAllPages } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";
import { couponService, type Coupon } from "@/lib/services/couponService";

/** The most the API sends in one page of coupons or redemptions. */
const PAGE_SIZE = 100;
const EXPIRING_SOON_MS = 7 * 24 * 60 * 60 * 1000;

// Under the coupons list key, so a coupon created or changed on the page refreshes them too
const COUPONS_KEY = queryKeys.coupons.list({ overview: "coupons" });
const DISCOUNTS_KEY = queryKeys.coupons.list({ overview: "discounts" });

/** Every coupon, counted as of when they loaded: live now, starting later, ending within a week, or over. */
async function loadCouponCounts() {
    const coupons = await fetchAllPages(async (before) => {
        const page = await couponService.listCoupons({ limit: PAGE_SIZE, before });
        return { items: page.coupons, nextBefore: page.nextBefore };
    }, 1000);
    const now = Date.now();
    const time = (iso: string | null) => (iso ? new Date(iso).getTime() : null);
    const isOver = (coupon: Coupon) => {
        const expiresAt = time(coupon.expiresAt);
        return (expiresAt !== null && expiresAt <= now) || (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses);
    };
    const usable = coupons.filter((coupon) => coupon.active && !isOver(coupon));
    const startsLater = (coupon: Coupon) => (time(coupon.startsAt) ?? 0) > now;
    return {
        coupons,
        live: usable.filter((coupon) => !startsLater(coupon)).length,
        startingLater: usable.filter(startsLater).length,
        expiringSoon: usable.filter((coupon) => {
            const expiresAt = time(coupon.expiresAt);
            return expiresAt !== null && expiresAt - now <= EXPIRING_SOON_MS;
        }).length,
        expired: coupons.filter((coupon) => (time(coupon.expiresAt) ?? Infinity) <= now).length,
        redemptions: coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0),
        usedUp: coupons.filter((coupon) => coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses).length,
    };
}

/** What every coupon has taken off, and what was paid after it, from each used coupon's redemptions. */
async function loadDiscounts(coupons: Coupon[]) {
    const redemptions = await Promise.all(
        coupons
            .filter((coupon) => coupon.usedCount > 0)
            .map((coupon) =>
                fetchAllPages(async (before) => {
                    const page = await couponService.listRedemptions(coupon.id, { limit: PAGE_SIZE, before });
                    return { items: page.redemptions, nextBefore: page.nextBefore };
                }, 1000),
            ),
    );
    return redemptions.flat().reduce(
        (totals, redemption) => ({
            discountKobo: totals.discountKobo + redemption.discountKobo,
            paidKobo: totals.paidKobo + redemption.amountKobo,
        }),
        { discountKobo: 0, paidKobo: 0 },
    );
}

/** Above the coupons: which are live, how often they've been used, what they've taken off, and which are ending. */
export default function SuperAdminCouponsOverview() {
    const countsQuery = useQuery({ queryKey: COUPONS_KEY, queryFn: loadCouponCounts, staleTime: 30_000 });
    const coupons = countsQuery.data?.coupons;
    const discountsQuery = useQuery({
        queryKey: DISCOUNTS_KEY,
        queryFn: () => loadDiscounts(coupons ?? []),
        enabled: !!coupons,
        staleTime: 60_000,
    });
    if (countsQuery.isError || discountsQuery.isError) {
        return <ReportError message="Couldn't load the coupon numbers. Please refresh to try again." />;
    }

    const counts = countsQuery.data;
    const discount = fromKobo(discountsQuery.data?.discountKobo ?? 0);
    const paid = fromKobo(discountsQuery.data?.paidKobo ?? 0);

    return (
        <OverviewCardGrid>
            <OverviewCard
                icon={TicketPercent}
                label="Live coupons"
                value={counts?.live.toLocaleString()}
                detail={{ label: "Starting later", value: counts?.startingLater.toLocaleString(), tone: "blue" }}
                loading={countsQuery.isPending}
            />
            <OverviewCard
                icon={Receipt}
                label="Times used"
                value={counts?.redemptions.toLocaleString()}
                detail={{ label: "Used up", value: counts?.usedUp.toLocaleString(), tone: "gray" }}
                loading={countsQuery.isPending}
            />
            <OverviewCard
                icon={Wallet}
                label="Discount given"
                value={formatCompactPrice(discount)}
                fullValue={formatPrice(discount)}
                detail={{ label: "Paid after discount", value: formatCompactPrice(paid), tone: "green" }}
                loading={!discountsQuery.isSuccess}
            />
            <OverviewCard
                icon={CalendarX}
                label="Ending in 7 days"
                value={counts?.expiringSoon.toLocaleString()}
                detail={{ label: "Expired", value: counts?.expired.toLocaleString(), tone: "red" }}
                loading={countsQuery.isPending}
            />
        </OverviewCardGrid>
    );
}
