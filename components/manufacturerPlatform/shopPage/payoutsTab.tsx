"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Clock, Landmark, Undo2, Wallet } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef, type StatusTone } from "@/components/customTable";
import { Skeleton } from "@/components/ui/skeleton";
import { MANUFACTURER_TRANSACTIONS_URL } from "@/constant/manufacturer";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { myShopService, type PayoutAccount, type PayoutStatus, type SellerPayout } from "@/lib/services/shopService";

const PAGE_SIZE = 10;
const naira = (kobo: number) => formatPrice(fromKobo(kobo));

const STATUS_LABELS: Record<PayoutStatus, string> = { held: "Held", released: "In your wallet", reversed: "Not paid (refunded)" };
const STATUS_TONES: Record<PayoutStatus, StatusTone> = { held: "amber", released: "green", reversed: "gray" };
const STATUS_ITEMS = (Object.keys(STATUS_LABELS) as PayoutStatus[]).map((status) => ({ value: status, label: STATUS_LABELS[status] }));

// ─────────────────────────────────────────────────────────────────────────────
// PayoutsTab: a manufacturer's shop money (SHOP_IMPLEMENTATION.md 3.3).
// Customers pay MANDE; each order's share (the price and delivery, less the
// platform charge) is held until 24 hours after delivery, then goes to their
// MANDE wallet, where they withdraw it with their job money, to the bank
// account on their wallet. A refund before then comes off the share; after,
// it's taken back from the wallet. The cards add it up; the table shows each
// order (status filter and page in the URL).
// ─────────────────────────────────────────────────────────────────────────────

export default function PayoutsTab({ payout, isLoading }: { payout: PayoutAccount | null | undefined; isLoading: boolean }) {
    const searchParams = useSearchParams();
    const tableId = "shop-payouts";
    const page = Math.max(1, Number(searchParams.get(`${tableId}_page`) ?? 1) || 1);
    const statusParam = searchParams.get(`${tableId}_status`);
    const status = STATUS_ITEMS.some((item) => item.value === statusParam) ? (statusParam as PayoutStatus) : undefined;

    const query = useQuery({
        queryKey: queryKeys.shop.myPayouts({ page, status: status ?? null }),
        queryFn: () => myShopService.listPayouts({ page, limit: PAGE_SIZE, status }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });
    const totals = query.data?.totals;
    const loading = query.isPending;

    const columns: ColumnDef<SellerPayout & { id: string }>[] = [
        { key: "order", header: "Order", cell: (row) => <span className="font-medium text-mist-950">{row.orderCode}</span> },
        { key: "paid", header: "Paid", cell: (row) => (row.paidAt ? dayjs(row.paidAt).format("D MMM YYYY") : "") },
        { key: "share", header: "Your share", cell: (row) => <span className="whitespace-nowrap">{naira(row.sellerShareKobo)}</span> },
        {
            key: "refunded",
            header: "Refunded",
            cell: (row) => (row.refundedKobo > 0 ? <span className="whitespace-nowrap text-secondary-700">-{naira(row.refundedKobo)}</span> : <span className="text-mist-400">None</span>),
        },
        {
            key: "when",
            header: "To your wallet",
            cell: (row) =>
                row.status === "released" && row.releasedAt ? (
                    <span className="whitespace-nowrap">
                        {naira(row.releasedKobo)} on {dayjs(row.releasedAt).format("D MMM")}
                    </span>
                ) : row.status === "held" ? (
                    <span className="whitespace-nowrap text-mist-600">{row.releaseAt ? dayjs(row.releaseAt).format("D MMM, h:mma") : "A day after delivery"}</span>
                ) : (
                    <span className="text-mist-400">Nothing</span>
                ),
        },
        { key: "status", header: "Status", cell: (row) => <StatusBadge label={STATUS_LABELS[row.status]} tone={STATUS_TONES[row.status]} variant="pill" /> },
    ];

    return (
        <div className="flex flex-col gap-6">
            <OverviewCardGrid columns={3}>
                <OverviewCard
                    icon={Clock}
                    label="Held, on its way"
                    value={totals ? formatCompactPrice(fromKobo(totals.heldKobo)) : ""}
                    fullValue={totals ? naira(totals.heldKobo) : undefined}
                    loading={loading}
                />
                <OverviewCard
                    icon={Wallet}
                    label="Paid to your wallet"
                    value={totals ? formatCompactPrice(fromKobo(totals.releasedKobo)) : ""}
                    fullValue={totals ? naira(totals.releasedKobo) : undefined}
                    href={MANUFACTURER_TRANSACTIONS_URL}
                    loading={loading}
                />
                <OverviewCard
                    icon={Undo2}
                    label="Taken back for refunds"
                    value={totals ? formatCompactPrice(fromKobo(totals.clawedBackKobo)) : ""}
                    fullValue={totals ? naira(totals.clawedBackKobo) : undefined}
                    loading={loading}
                />
            </OverviewCardGrid>

            <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 font-text">
                <div className="flex items-center gap-3">
                    <Landmark className="size-5 text-mist-500" aria-hidden />
                    {isLoading ? (
                        <Skeleton className="h-5 w-56" />
                    ) : payout ? (
                        <p className="text-sm text-mist-700">
                            Withdrawals go to <span className="font-medium text-mist-950">{payout.bankName}</span> ending {payout.accountNumberLast4} ({payout.accountName}).
                        </p>
                    ) : (
                        <p className="text-sm text-mist-700">Add a bank account to your wallet to list products and withdraw your sales.</p>
                    )}
                </div>
                <Link href={MANUFACTURER_TRANSACTIONS_URL} className="text-sm font-medium text-secondary-700 hover:underline">
                    {payout ? "Go to your wallet" : "Add a bank account"}
                </Link>
            </section>

            <DataTable
                tableId={tableId}
                columns={columns}
                rows={(query.data?.payouts ?? []).map((row) => ({ ...row, id: row.orderId }))}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={loading}
                error={query.isError ? "We couldn't load your shop money. Please refresh the page." : undefined}
                emptyMessage={status ? "Nothing matches." : "No sales yet. Your share of each order shows here once it's paid."}
                toolbar={<TableToolbar filters={[{ title: "All payouts", paramKey: "status", items: STATUS_ITEMS }]} />}
            />
        </div>
    );
}
