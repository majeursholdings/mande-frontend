"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Banknote, BriefcaseBusiness, Factory, Landmark, Store, TrendingUp, type LucideIcon } from "lucide-react";
import {
    DataTable,
    TableToolbar,
    useTableRows,
    type ColumnDef,
    type SortOptionDef,
} from "@/components/customTable";
import UserAvatar from "@/components/ui/userAvatar";
import { cn } from "@/lib/utils";
import { formatCompactPrice, formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService } from "@/lib/services/reportsService";
import AdminPageHeader from "@/components/adminPlatform/pageHeader";
import OverviewCard, { OverviewCardGrid, type OverviewCardProps } from "@/components/common/overviewCard";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";
import {
    REVENUE_AREAS,
    REVENUE_ENTRY_TYPES,
    getRevenueTypeLabel,
    toRevenueEntry,
    toRevenueSummary,
    type RevenueEntry,
    type RevenueSummary,
} from "./revenueStats";

const TABLE_ID = "revenue";

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

const SORT_OPTIONS: SortOptionDef<RevenueEntry>[] = [
    { value: "date", field: "date", type: "date" },
    { value: "amount", field: "amount", type: "number", direction: "desc" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminRevenuePage: the platform's own money, gross (everything in)
// and net, then by area: jobs (rejection charges in; installments and
// on-time bonuses out), the shop, machine bookings (each less refunds) and
// subscriptions (/reports/revenue/summary). Then every entry
// (/reports/revenue), to search, filter by area or kind, and sort.
// The API pages by date, so every page is loaded up front (see
// getAllPlatformRevenue) and the table searches, sorts and pages them here.
// ─────────────────────────────────────────────────────────────────────────────

const NO_AREA = { in: 0, out: 0, net: 0 };
const NO_SUMMARY: RevenueSummary = {
    areas: { jobs: NO_AREA, shop: NO_AREA, bookings: NO_AREA, subscriptions: NO_AREA },
    gross: 0,
    net: 0,
    counts: { installments: 0, bonuses: 0, charges: 0, bookings: 0, bookingRefunds: 0, shopSales: 0, shopCharges: 0, plans: 0 },
};

export default function SuperAdminRevenuePage() {
    const router = useRouter();
    const { getManufacturerUrl } = useStaffPlatform();
    const summaryQuery = useQuery({
        queryKey: queryKeys.reports.revenueSummary(),
        queryFn: () => reportsService.getRevenueSummary(),
        staleTime: 30_000,
    });
    const entriesQuery = useQuery({
        queryKey: queryKeys.reports.revenue({ all: true }),
        queryFn: () => reportsService.getAllPlatformRevenue(),
        staleTime: 30_000,
    });
    const entries = (entriesQuery.data ?? []).map(toRevenueEntry);
    const summary = summaryQuery.data ? toRevenueSummary(summaryQuery.data.summary) : NO_SUMMARY;

    const { rows, pagination } = useTableRows({
        tableId: TABLE_ID,
        data: entries,
        searchFields: ["manufacturerName", "companyName", "description"],
        filters: [
            { paramKey: "area", field: "area" },
            { paramKey: "type", field: "type" },
        ],
        sortOptions: SORT_OPTIONS,
        rowsPerPage: 15,
    });

    const { areas, counts } = summary;
    const paidOut = areas.jobs.out + areas.shop.out + areas.bookings.out + areas.subscriptions.out;
    /** "₦1.2M" from naira, with the minus sign for an area that paid out more than it took. */
    const money = (amount: number) => `${amount < 0 ? "−" : ""}${formatCompactPrice(Math.abs(amount))}`;
    const cards: { key: string; label: string; amount: number; icon: LucideIcon; detail: OverviewCardProps["detail"] }[] = [
        {
            key: "gross",
            label: "Gross revenue",
            amount: summary.gross,
            icon: Landmark,
            // Everything that came in, before anything went back out
            detail: { label: "Paid out of it", value: money(paidOut), tone: "red" },
        },
        {
            key: "net",
            label: "Net revenue",
            amount: summary.net,
            icon: TrendingUp,
            detail: {
                label: "Of gross",
                value: summary.gross > 0 ? `${Math.round((summary.net / summary.gross) * 100)}%` : "0%",
                tone: summary.net < 0 ? "red" : "green",
            },
        },
        {
            key: "jobs",
            label: "Jobs (net)",
            amount: areas.jobs.net,
            icon: BriefcaseBusiness,
            // Charges in; installments and bonuses out
            detail: { label: `Paid to manufacturers, ${plural(counts.installments + counts.bonuses, "payment")}`, value: money(areas.jobs.out), tone: "red" },
        },
        {
            key: "shop",
            label: "Shop (net)",
            amount: areas.shop.net,
            icon: Store,
            detail:
                areas.shop.out > 0
                    ? { label: "Refunded", value: money(areas.shop.out), tone: "amber" }
                    : { label: "Sales", value: (counts.shopSales + counts.shopCharges).toLocaleString(), tone: "green" },
        },
        {
            key: "bookings",
            label: "Machine bookings (net)",
            amount: areas.bookings.net,
            icon: Factory,
            detail:
                counts.bookingRefunds > 0
                    ? { label: `Refunded, ${plural(counts.bookingRefunds, "booking")}`, value: money(areas.bookings.out), tone: "amber" }
                    : { label: "Paid bookings", value: counts.bookings.toLocaleString(), tone: "green" },
        },
        {
            key: "subscriptions",
            label: "Subscriptions",
            amount: areas.subscriptions.net,
            icon: Banknote,
            detail: { label: "Plan payments", value: counts.plans.toLocaleString(), tone: "blue" },
        },
    ];

    const columns: ColumnDef<RevenueEntry>[] = [
        {
            key: "entry",
            header: "Entry",
            className: "min-w-56 whitespace-normal",
            cell: (entry) => (
                <span className="flex items-start gap-3">
                    <DirectionIcon direction={entry.direction} />
                    <span className="flex min-w-0 flex-col">
                        <span className="font-medium text-mist-950">{getRevenueTypeLabel(entry.type)}</span>
                        <span className="text-xs text-gray-500">
                            {entry.description} · {entry.detail}
                        </span>
                        {/* Who and when, where their columns don't fit */}
                        <span className="text-xs text-mist-400 md:hidden">
                            {entry.manufacturerName} · {formatOrdinalDate(new Date(entry.date))}
                        </span>
                    </span>
                </span>
            ),
        },
        {
            key: "manufacturer",
            header: "Manufacturer",
            className: "hidden md:table-cell",
            cell: (entry) => (
                <span className="flex items-center gap-3">
                    <UserAvatar name={entry.manufacturerName} src={entry.avatarUrl} className="size-8 text-xs" />
                    <span className="flex min-w-0 flex-col">
                        <span className="font-medium text-mist-950">{entry.manufacturerName}</span>
                        {entry.companyName && <span className="text-xs text-gray-500">{entry.companyName}</span>}
                    </span>
                </span>
            ),
        },
        {
            key: "date",
            header: "Date",
            className: "hidden md:table-cell",
            cell: (entry) => <span className="text-mist-500">{formatOrdinalDate(new Date(entry.date))}</span>,
        },
        {
            key: "amount",
            header: "Amount",
            className: "text-right",
            cell: (entry) => (
                <span className={cn("font-semibold", entry.direction === "in" ? "text-primary-700" : "text-error-600")}>
                    {entry.direction === "in" ? "+" : "−"}
                    {formatPrice(entry.amount)}
                </span>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <AdminPageHeader
                title="Revenue"
                description="What the platform has made from jobs, the shop, machine bookings and subscriptions, and what it has paid out: installments and on-time bonuses to manufacturers, and refunds."
            />

            {summaryQuery.isError ? (
                <ReportError message="Couldn't load the revenue totals. Please refresh to try again." />
            ) : (
                <OverviewCardGrid columns={3}>
                    {cards.map((card) => (
                        <OverviewCard
                            key={card.key}
                            icon={card.icon}
                            label={card.label}
                            value={money(card.amount)}
                            fullValue={formatPrice(card.amount)}
                            detail={card.detail}
                            loading={summaryQuery.isPending}
                        />
                    ))}
                </OverviewCardGrid>
            )}

            <DataTable
                tableId={TABLE_ID}
                columns={columns}
                rows={rows}
                pagination={pagination}
                loading={entriesQuery.isPending}
                error={entriesQuery.isError ? "Couldn't load the revenue. Please refresh to try again." : undefined}
                emptyMessage="No revenue matches your search."
                onRowClick={(entry) => {
                    // A guest's machine booking or a shop customer has no manufacturer page
                    if (entry.manufacturerId && entry.companyName) router.push(getManufacturerUrl(entry.manufacturerId));
                }}
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search by name, plan, job, booking or order" }}
                        filters={[
                            { title: "Area", paramKey: "area", items: REVENUE_AREAS },
                            { title: "Type", paramKey: "type", items: REVENUE_ENTRY_TYPES },
                        ]}
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

/** Green down arrow for money in to Mande, red up arrow for money it paid out. */
function DirectionIcon({ direction }: { direction: RevenueEntry["direction"] }) {
    const Arrow = direction === "in" ? ArrowDown : ArrowUp;
    return (
        <span
            aria-hidden
            className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white",
                direction === "in" ? "bg-primary-500" : "bg-error-500",
            )}
        >
            <Arrow className="size-3" strokeWidth={2.5} />
        </span>
    );
}
