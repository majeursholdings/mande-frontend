"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Banknote, Gift, Scale, TrendingUp, type LucideIcon } from "lucide-react";
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
import { StatCard, StatCardRow } from "@/components/adminPlatform/statCard";
import { ReportError, StatCardSkeleton } from "@/components/adminPlatform/dashboardPage/reportStates";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";
import {
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
// SuperAdminRevenuePage: the platform's own money: what's come in from
// manufacturers' plans and from charges for rejected work, the on-time
// bonuses paid out of it, and what that leaves (/reports/revenue/summary).
// Then every entry (/reports/revenue), to search, filter by kind and sort.
// The API pages by date, so every page is loaded up front (see
// getAllPlatformRevenue) and the table searches, sorts and pages them here.
// ─────────────────────────────────────────────────────────────────────────────

const NO_SUMMARY: RevenueSummary = {
    subscription: { total: 0, count: 0 },
    charge: { total: 0, count: 0 },
    bonus: { total: 0, count: 0 },
    net: 0,
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
        filters: [{ paramKey: "type", field: "type" }],
        sortOptions: SORT_OPTIONS,
        rowsPerPage: 15,
    });

    const cards: { key: string; label: string; amount: number; icon: LucideIcon; iconClassName: string; footer: string }[] = [
        {
            key: "subscriptions",
            label: "From subscriptions",
            amount: summary.subscription.total,
            icon: Banknote,
            iconClassName: "bg-error-500",
            footer: `Over ${plural(summary.subscription.count, "plan payment")}`,
        },
        {
            key: "charges",
            label: "From rejection charges",
            amount: summary.charge.total,
            icon: Scale,
            iconClassName: "bg-indigo-500",
            footer: `For ${plural(summary.charge.count, "rejection")}`,
        },
        {
            key: "bonuses",
            label: "Paid in bonuses",
            amount: summary.bonus.total,
            icon: Gift,
            iconClassName: "bg-warning-500",
            footer: `To ${plural(summary.bonus.count, "job", "jobs")} delivered on time`,
        },
        {
            key: "net",
            label: "Net revenue",
            amount: summary.net,
            icon: TrendingUp,
            iconClassName: "bg-primary-600",
            footer: "What came in, less bonuses",
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
                description="What the platform has made: plan payments and charges for rejected work, less the on-time bonuses it pays."
            />

            {summaryQuery.isError ? (
                <ReportError message="Couldn't load the revenue totals. Please refresh to try again." />
            ) : (
                <StatCardRow>
                    {cards.map((card) =>
                        summaryQuery.isPending ? (
                            <StatCardSkeleton
                                key={card.key}
                                label={card.label}
                                icon={card.icon}
                                iconClassName={card.iconClassName}
                            />
                        ) : (
                            <StatCard
                                key={card.key}
                                label={card.label}
                                value={formatCompactPrice(card.amount)}
                                fullValue={formatPrice(card.amount)}
                                icon={card.icon}
                                iconClassName={card.iconClassName}
                                footer={card.footer}
                            />
                        ),
                    )}
                </StatCardRow>
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
                    if (entry.companyName) router.push(getManufacturerUrl(entry.manufacturerId));
                }}
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search by manufacturer, plan or job" }}
                        filters={[{ title: "Type", paramKey: "type", items: REVENUE_ENTRY_TYPES }]}
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
