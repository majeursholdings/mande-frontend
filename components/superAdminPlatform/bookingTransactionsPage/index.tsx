"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BadgePercent, CircleAlert, Undo2, Wallet } from "lucide-react";
import {
    DataTable,
    StatusBadge,
    TableToolbar,
    useTableRows,
    type ColumnDef,
    type SelectFilterItem,
    type SortOptionDef,
    type StatusTone,
} from "@/components/customTable";
import UserAvatar from "@/components/ui/userAvatar";
import { cn } from "@/lib/utils";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService, type BookingTransaction } from "@/lib/services/reportsService";
import AdminPageHeader from "@/components/adminPlatform/pageHeader";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";

const TABLE_ID = "booking-transactions";

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminBookingTransactionsPage: the money side of machine bookings:
// every booking that was paid for, what it cost before and after discounts
// (plan or coupon), how it was paid, and whether the money was kept,
// refunded, or a refund is still to be sorted out
// (/reports/machine-bookings, with its totals from .../summary).
// The API pages by date, so every page is loaded up front and the table
// searches, filters, sorts and pages them here. A row opens the booking.
// ─────────────────────────────────────────────────────────────────────────────

/** Where the money is now: kept by MANDE, or on its way (or back) to the booker. */
type MoneyState = "kept" | "refunded" | "refund-pending" | "refund-failed";

const MONEY_STATES: Record<MoneyState, { label: string; tone: StatusTone }> = {
    kept: { label: "Paid", tone: "green" },
    refunded: { label: "Refunded", tone: "gray" },
    "refund-pending": { label: "Refund pending", tone: "amber" },
    "refund-failed": { label: "Refund failed", tone: "red" },
};

const MONEY_STATE_ITEMS: SelectFilterItem[] = (Object.keys(MONEY_STATES) as MoneyState[]).map((state) => ({
    value: state,
    label: MONEY_STATES[state].label,
}));

type Row = BookingTransaction & { state: MoneyState; amount: number };

function toRow(transaction: BookingTransaction): Row {
    const state: MoneyState =
        transaction.refundStatus === "refunded"
            ? "refunded"
            : transaction.refundStatus === "failed"
              ? "refund-failed"
              : transaction.refundStatus === "pending"
                ? "refund-pending"
                : "kept";
    return { ...transaction, state, amount: transaction.amountKobo };
}

const SORT_OPTIONS: SortOptionDef<Row>[] = [
    { value: "date", field: "paidAt", type: "date" },
    { value: "amount", field: "amount", type: "number", direction: "desc" },
];

const naira = (kobo: number) => formatPrice(fromKobo(kobo));

export default function SuperAdminBookingTransactionsPage() {
    const router = useRouter();
    const { getMachineBookingUrl } = useStaffPlatform();
    const summaryQuery = useQuery({
        queryKey: queryKeys.reports.bookingTransactionsSummary(),
        queryFn: () => reportsService.getBookingTransactionSummary(),
        staleTime: 30_000,
    });
    const listQuery = useQuery({
        queryKey: queryKeys.reports.bookingTransactions(),
        queryFn: () => reportsService.getAllBookingTransactions(),
        staleTime: 30_000,
    });

    const { rows, pagination } = useTableRows({
        tableId: TABLE_ID,
        data: (listQuery.data ?? []).map(toRow),
        searchFields: ["code", "fullName", "email", "machines", "couponCode", "providerReference"],
        filters: [{ paramKey: "state", field: "state" }],
        sortOptions: SORT_OPTIONS,
        rowsPerPage: 15,
    });

    const summary = summaryQuery.data;
    const loading = summaryQuery.isPending;
    const kept = fromKobo(summary?.kept.totalKobo ?? 0);
    const refunded = fromKobo(summary?.refunded.totalKobo ?? 0);
    const discounts = fromKobo(summary?.discountKobo ?? 0);
    const openRefunds = (summary?.refundPending.totalKobo ?? 0) + (summary?.refundFailed.totalKobo ?? 0);
    const openRefundCount = (summary?.refundPending.count ?? 0) + (summary?.refundFailed.count ?? 0);

    const columns: ColumnDef<Row>[] = [
        {
            key: "booking",
            header: "Booking",
            className: "min-w-48 whitespace-normal",
            cell: (row) => (
                <span className="flex min-w-0 flex-col">
                    <span className="font-medium text-mist-950">{row.code}</span>
                    <span className="max-w-56 truncate text-xs text-gray-500" title={row.machines}>
                        {row.machines}
                    </span>
                    {/* When, where its column doesn't fit */}
                    <span className="text-xs text-mist-400 md:hidden">{formatOrdinalDate(new Date(row.paidAt))}</span>
                </span>
            ),
        },
        {
            key: "booker",
            header: "Booked by",
            className: "hidden md:table-cell",
            cell: (row) => (
                <span className="flex items-center gap-3">
                    <UserAvatar name={row.manufacturerName} src={row.avatar?.url ?? null} className="size-8 text-xs" />
                    <span className="flex min-w-0 flex-col">
                        <span className="font-medium text-mist-950">{row.manufacturerName}</span>
                        <span className="text-xs text-gray-500">{row.companyName || (row.manufacturerId ? row.email : "Guest")}</span>
                    </span>
                </span>
            ),
        },
        {
            key: "paid",
            header: "Paid",
            className: "hidden lg:table-cell",
            cell: (row) => (
                <span className="flex flex-col">
                    <span className="text-mist-700">{formatOrdinalDate(new Date(row.paidAt))}</span>
                    <span className="text-xs capitalize text-mist-400">{row.provider}</span>
                </span>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            className: "text-right",
            cell: (row) => (
                <span className="flex flex-col items-end">
                    <span className={cn("font-semibold", row.state === "kept" ? "text-primary-700" : "text-mist-500")}>{naira(row.amountKobo)}</span>
                    {row.discountKobo > 0 && (
                        <span className="text-xs text-mist-400">
                            {naira(row.subtotalKobo)} less {row.couponCode ? `coupon ${row.couponCode}` : "plan discount"}
                        </span>
                    )}
                </span>
            ),
        },
        {
            key: "state",
            header: "Status",
            cell: (row) => <StatusBadge label={MONEY_STATES[row.state].label} tone={MONEY_STATES[row.state].tone} variant="pill" />,
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <AdminPageHeader
                title="Booking transactions"
                description="The money from machine bookings: every paid booking, its discount, how it was paid, and whether it was kept or refunded."
            />

            {summaryQuery.isError ? (
                <ReportError message="Couldn't load the booking totals. Please refresh to try again." />
            ) : (
                <OverviewCardGrid columns={4}>
                    <OverviewCard
                        icon={Wallet}
                        label="Kept from bookings"
                        value={formatCompactPrice(kept)}
                        fullValue={formatPrice(kept)}
                        detail={{ label: "Paid bookings", value: summary?.kept.count.toLocaleString(), tone: "green" }}
                        loading={loading}
                    />
                    <OverviewCard
                        icon={Undo2}
                        label="Refunded"
                        value={formatCompactPrice(refunded)}
                        fullValue={formatPrice(refunded)}
                        detail={{ label: "Refunds", value: summary?.refunded.count.toLocaleString(), tone: "gray" }}
                        loading={loading}
                    />
                    <OverviewCard
                        icon={CircleAlert}
                        label="Refunds to sort out"
                        value={formatCompactPrice(fromKobo(openRefunds))}
                        fullValue={formatPrice(fromKobo(openRefunds))}
                        detail={{
                            label: "Failed",
                            value: summary?.refundFailed.count.toLocaleString(),
                            tone: (summary?.refundFailed.count ?? 0) > 0 ? "red" : "gray",
                        }}
                        badge={openRefundCount > 0 ? <StatusBadge label={`${openRefundCount} open`} tone="amber" variant="pill" /> : undefined}
                        loading={loading}
                    />
                    <OverviewCard
                        icon={BadgePercent}
                        label="Discounts given"
                        value={formatCompactPrice(discounts)}
                        fullValue={formatPrice(discounts)}
                        detail={{ label: "Paid in all", value: formatCompactPrice(fromKobo(summary?.paid.totalKobo ?? 0)), tone: "blue" }}
                        loading={loading}
                    />
                </OverviewCardGrid>
            )}

            <DataTable
                tableId={TABLE_ID}
                columns={columns}
                rows={rows}
                pagination={pagination}
                loading={listQuery.isPending}
                error={listQuery.isError ? "Couldn't load the booking transactions. Please refresh to try again." : undefined}
                emptyMessage={(listQuery.data?.length ?? 0) === 0 ? "No paid machine bookings yet." : "No transactions match your search."}
                onRowClick={(row) => router.push(getMachineBookingUrl(row.id))}
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search by code, name, email, coupon or reference" }}
                        filters={[{ title: "All statuses", paramKey: "state", items: MONEY_STATE_ITEMS }]}
                        sortBy={{
                            title: "Sort by",
                            items: [
                                { label: "Date", value: "date" },
                                { label: "Amount", value: "amount" },
                            ],
                        }}
                    />
                }
            />
        </div>
    );
}
