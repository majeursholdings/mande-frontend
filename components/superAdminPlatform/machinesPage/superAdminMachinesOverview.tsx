"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, CalendarClock, Cog, Shapes } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import { SUPER_ADMIN_BOOKING_TRANSACTIONS_URL, SUPER_ADMIN_MACHINE_BOOKINGS_URL } from "@/constant/superAdmin";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import { fetchAllPages } from "@/lib/pagination";
import { queryKeys } from "@/lib/queryKeys";
import { machineService } from "@/lib/services/machineService";
import { reportsService } from "@/lib/services/reportsService";

/** The most the API sends in one page of machines. */
const MACHINES_PAGE_SIZE = 100;

/**
 * Above the super admin's machines: the catalogue (every machine, active or
 * not, under the machines key so a change refreshes it), and what's been
 * booked on it and paid for.
 */
export default function SuperAdminMachinesOverview() {
    const machinesQuery = useQuery({
        queryKey: queryKeys.machines.list({ overview: true }),
        queryFn: () =>
            fetchAllPages(async (before) => {
                const page = await machineService.listMachines({ limit: MACHINES_PAGE_SIZE, before });
                return { items: page.machines, nextBefore: page.nextBefore };
            }, 1000),
        staleTime: 30_000,
    });
    const bookingsQuery = useQuery({
        queryKey: queryKeys.reports.bookingTransactionsSummary(),
        queryFn: () => reportsService.getBookingTransactionSummary(),
        staleTime: 60_000,
    });
    if (machinesQuery.isError || bookingsQuery.isError) {
        return <ReportError message="Couldn't load the machine numbers. Please refresh to try again." />;
    }

    const machines = machinesQuery.data ?? [];
    const active = machines.filter((machine) => machine.active).length;
    const categories = new Set(machines.map((machine) => machine.category.trim().toLowerCase())).size;
    const functions = new Set(machines.flatMap((machine) => machine.functions.map((name) => name.trim().toLowerCase()))).size;

    const summary = bookingsQuery.data;
    const kept = fromKobo(summary?.kept.totalKobo ?? 0);
    const refunded = fromKobo(summary?.refunded.totalKobo ?? 0);

    return (
        <OverviewCardGrid>
            <OverviewCard
                icon={Cog}
                label="Machines"
                value={machines.length.toLocaleString()}
                detail={{ label: "Active", value: active.toLocaleString(), tone: "green" }}
                loading={machinesQuery.isPending}
            />
            <OverviewCard
                icon={Shapes}
                label="Categories"
                value={categories.toLocaleString()}
                detail={{ label: "Functions", value: functions.toLocaleString(), tone: "blue" }}
                loading={machinesQuery.isPending}
            />
            <OverviewCard
                icon={CalendarClock}
                label="Paid bookings"
                value={(summary?.paid.count ?? 0).toLocaleString()}
                detail={{ label: "To confirm", value: (summary?.byStatus.paid ?? 0).toLocaleString(), tone: "amber" }}
                href={SUPER_ADMIN_MACHINE_BOOKINGS_URL}
                loading={bookingsQuery.isPending}
            />
            <OverviewCard
                icon={Banknote}
                label="Booking income"
                value={formatCompactPrice(kept)}
                fullValue={formatPrice(kept)}
                detail={{ label: "Refunded", value: formatCompactPrice(refunded), tone: "red" }}
                href={SUPER_ADMIN_BOOKING_TRANSACTIONS_URL}
                loading={bookingsQuery.isPending}
            />
        </OverviewCardGrid>
    );
}
