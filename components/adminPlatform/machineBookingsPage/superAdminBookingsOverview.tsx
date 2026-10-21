"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CalendarClock, CalendarX, Wallet } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { SUPER_ADMIN_BOOKING_TRANSACTIONS_URL } from "@/constant/superAdmin";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService } from "@/lib/services/reportsService";
import { ReportError } from "../dashboardPage/reportStates";

/**
 * Above the super admin's machine bookings: what's waiting on staff (paid,
 * to confirm), what's booked in, what's done, and the money kept, from
 * /reports/machine-bookings/summary (the super admin's only).
 */
export default function SuperAdminBookingsOverview() {
    const { data: summary, isPending, isError } = useQuery({
        queryKey: queryKeys.reports.bookingTransactionsSummary(),
        queryFn: () => reportsService.getBookingTransactionSummary(),
        staleTime: 30_000,
    });
    if (isError) return <ReportError message="Couldn't load the booking numbers. Please refresh to try again." />;
    const byStatus = summary?.byStatus;
    const kept = fromKobo(summary?.kept.totalKobo ?? 0);
    const refundsOpen = (summary?.refundPending.count ?? 0) + (summary?.refundFailed.count ?? 0);

    return (
        <OverviewCardGrid columns={4}>
            <OverviewCard
                icon={CalendarClock}
                label="Paid, to confirm"
                value={byStatus?.paid.toLocaleString()}
                detail={{ label: "Awaiting payment", value: byStatus?.pending_payment.toLocaleString(), tone: "amber" }}
                loading={isPending}
            />
            <OverviewCard
                icon={CalendarCheck}
                label="Confirmed"
                value={byStatus?.confirmed.toLocaleString()}
                detail={{ label: "Completed", value: byStatus?.completed.toLocaleString(), tone: "green" }}
                loading={isPending}
            />
            <OverviewCard
                icon={CalendarX}
                label="Cancelled"
                value={byStatus?.cancelled.toLocaleString()}
                detail={{ label: "Refunds to sort out", value: refundsOpen.toLocaleString(), tone: refundsOpen > 0 ? "red" : "gray" }}
                href={SUPER_ADMIN_BOOKING_TRANSACTIONS_URL}
                loading={isPending}
            />
            <OverviewCard
                icon={Wallet}
                label="Booking income"
                value={formatCompactPrice(kept)}
                fullValue={formatPrice(kept)}
                detail={{ label: "Paid bookings", value: summary?.kept.count.toLocaleString(), tone: "blue" }}
                href={SUPER_ADMIN_BOOKING_TRANSACTIONS_URL}
                loading={isPending}
            />
        </OverviewCardGrid>
    );
}
