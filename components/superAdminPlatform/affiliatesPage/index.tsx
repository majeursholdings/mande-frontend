"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Clock, Gift, Ticket, Users } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { DataTable, SelectFilter, StatusBadge, TableToolbar, type ColumnDef } from "@/components/customTable";
import { SUPER_ADMIN_CUSTOMERS_URL } from "@/constant/superAdmin";
import { formatBalance, formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { customerService, type AffiliateRow } from "@/lib/services/customerService";

// ─────────────────────────────────────────────────────────────────────────────
// Affiliates (SHOP_IMPLEMENTATION.md 5.7), for super admins: what MANDE owes
// in reward points (on the way and spendable: its liability), and customers
// whose referral links and personal coupons have sold MANDE stock, best
// sellers first (or most recent), each linking to their page to suspend or
// adjust their rewards. Manufacturers never see any of it.
// ─────────────────────────────────────────────────────────────────────────────

const TABLE_ID = "affiliates";
const PAGE_SIZE = 20;
const naira = (kobo: number) => formatPrice(fromKobo(kobo));

type Row = AffiliateRow & { id: string };

const COLUMNS: ColumnDef<Row>[] = [
    {
        key: "customer",
        header: "Customer",
        cell: (row) => (
            <Link href={`${SUPER_ADMIN_CUSTOMERS_URL}/${row.customerId}`} className="flex flex-col hover:underline">
                <span className="font-medium text-mist-950">{row.name}</span>
                {row.email && <span className="text-xs text-mist-500">{row.email}</span>}
            </Link>
        ),
    },
    {
        key: "orders",
        header: "Referred orders",
        cell: (row) => (
            <span className="flex flex-col">
                <span className="text-mist-950">{row.orders.toLocaleString()}</span>
                {row.viaCoupon > 0 && <span className="text-xs text-mist-500">{row.viaCoupon} through coupons</span>}
            </span>
        ),
    },
    { key: "sales", header: "MANDE stock sold", cell: (row) => <span className="whitespace-nowrap tabular-nums text-mist-950">{naira(row.salesKobo)}</span> },
    { key: "earned", header: "Points earned", cell: (row) => <span className="whitespace-nowrap tabular-nums text-mist-950">{naira(row.earnedKobo)}</span> },
    {
        key: "balance",
        header: "Owed now",
        cell: (row) => (
            <span className="flex flex-col whitespace-nowrap tabular-nums">
                <span className="text-mist-950">{formatBalance(fromKobo(row.balance.availableKobo))}</span>
                {row.balance.pendingKobo > 0 && <span className="text-xs text-mist-500">{naira(row.balance.pendingKobo)} on the way</span>}
            </span>
        ),
    },
    { key: "last", header: "Last sale", cell: (row) => <span className="whitespace-nowrap text-mist-700">{dayjs(row.lastSaleAt).format("D MMM YYYY")}</span> },
    { key: "status", header: "Rewards", cell: (row) => <StatusBadge label={row.status === "suspended" ? "Suspended" : "Active"} tone={row.status === "suspended" ? "red" : "green"} variant="pill" /> },
];

export default function AffiliatesPage() {
    const searchParams = useSearchParams();
    const page = Math.max(1, Number(searchParams.get(`${TABLE_ID}_page`) ?? 1) || 1);
    const sort = searchParams.get(`${TABLE_ID}_sort`) === "recent" ? "recent" : "sales";
    const query = useQuery({
        queryKey: queryKeys.customers.affiliates({ page, sort }),
        queryFn: () => customerService.listAffiliates({ page, limit: PAGE_SIZE, sort }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });
    const summary = query.data?.summary;
    const loading = !summary;

    return (
        <div className="flex flex-col gap-6">
            <OverviewCardGrid columns={4}>
                <OverviewCard
                    icon={Gift}
                    label="Points owed"
                    value={summary ? naira(summary.owedAvailableKobo) : null}
                    detail={summary ? { label: "Customers", value: summary.holders.toLocaleString(), tone: "blue" } : undefined}
                    loading={loading}
                />
                <OverviewCard
                    icon={Clock}
                    label="Points on the way"
                    value={summary ? naira(summary.owedPendingKobo) : null}
                    detail={summary ? { label: "Total owed", value: naira(summary.owedAvailableKobo + summary.owedPendingKobo), tone: "amber" } : undefined}
                    loading={loading}
                />
                <OverviewCard icon={Users} label="Referrers" value={summary ? summary.referrers.toLocaleString() : null} loading={loading} />
                <OverviewCard icon={Ticket} label="Live personal coupons" value={summary ? summary.liveCoupons.toLocaleString() : null} loading={loading} />
            </OverviewCardGrid>
            <DataTable
                tableId={TABLE_ID}
                columns={COLUMNS}
                rows={(query.data?.affiliates ?? []).map((row) => ({ ...row, id: row.customerId }))}
                pagination={{ total: query.data?.total ?? 0, totalPages: query.data?.totalPages || 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the affiliates. Please refresh the page." : undefined}
                emptyMessage="No referred sales yet. Customers earn points when their link or personal coupon sells MANDE stock."
                toolbar={
                    <TableToolbar
                        actions={
                            <SelectFilter
                                title="Sort"
                                prefixLabel="Sort by"
                                placeholder="Most sold"
                                paramKey="sort"
                                items={[{ value: "recent", label: "Most recent" }]}
                            />
                        }
                    />
                }
            />
        </div>
    );
}
