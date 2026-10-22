"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef, type StatusTone } from "@/components/customTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";
import { formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { shopPaymentsService, type CardRefundRow, type CardRefundStatus, type ShopDisputeRow, type ShopDisputeStatus } from "@/lib/services/shopService";

// ─────────────────────────────────────────────────────────────────────────────
// Shop › Refunds and disputes (super admins). Two lists:
//  • Card refunds the payment platform refused or couldn't finish (failed
//    first), and ones still on their way. A failed one is still owed to the
//    customer: retry it on their card, or give it as store credit. Each
//    refund is checked with the platform before it shows as done or failed.
//  • Chargebacks: a customer asked their bank for the money back. Open ones
//    first, by the date to answer by; evidence is sent on the payment
//    platform's dashboard. A lost one is counted against the order like a
//    refund, and a manufacturer's share of it is taken back.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const REFUNDS_TABLE = "shop-card-refunds";
const DISPUTES_TABLE = "shop-disputes";
const naira = (kobo: number) => formatPrice(fromKobo(kobo));
const PLATFORM_NAMES: Record<string, string> = { paystack: "Paystack", flutterwave: "Flutterwave" };

const REFUND_STATUS_ITEMS = [
    { value: "failed", label: "Failed" },
    { value: "pending", label: "On its way" },
    { value: "credited", label: "Given as credit" },
];
const REFUND_STATUS_LABELS: Record<CardRefundStatus, string> = { pending: "On its way", succeeded: "Refunded", failed: "Failed", credited: "Given as credit" };
const REFUND_STATUS_TONES: Record<CardRefundStatus, StatusTone> = { pending: "amber", succeeded: "green", failed: "red", credited: "blue" };

const DISPUTE_STATUS_ITEMS = [
    { value: "open", label: "Open" },
    { value: "won", label: "Won" },
    { value: "lost", label: "Lost" },
];
const DISPUTE_STATUS_LABELS: Record<ShopDisputeStatus, string> = { open: "Open", won: "Won", lost: "Lost" };
const DISPUTE_STATUS_TONES: Record<ShopDisputeStatus, StatusTone> = { open: "amber", won: "green", lost: "red" };

/** "Cancelled by the seller", "Return SR-..." and the like, from the refund's key. */
function refundFor(row: CardRefundRow) {
    if (row.key.startsWith("cancel:")) return "Cancelled part";
    if (row.key.startsWith("return:")) return "Return";
    if (row.key.startsWith("soldout:")) return "Sold out before payment";
    return "Refund";
}

const REFUND_COLUMNS: ColumnDef<CardRefundRow>[] = [
    { key: "order", header: "Order", cell: (row) => <span className="font-medium text-mist-950">{row.orderCode}</span> },
    { key: "customer", header: "Customer", cell: (row) => row.customerName },
    { key: "amount", header: "Amount", cell: (row) => <span className="whitespace-nowrap">{naira(row.amountKobo)}</span> },
    { key: "for", header: "For", cell: (row) => <span className="line-clamp-1 max-w-56 text-mist-600">{refundFor(row)}</span> },
    { key: "asked", header: "Asked", cell: (row) => <span className="whitespace-nowrap">{dayjs(row.at).format("D MMM YYYY")}</span> },
    {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge label={REFUND_STATUS_LABELS[row.status] ?? row.status} tone={REFUND_STATUS_TONES[row.status] ?? "gray"} variant="pill" />,
    },
];

/** The date to answer by, flagged when it's close or gone. */
function DueCell({ dispute }: { dispute: ShopDisputeRow }) {
    if (!dispute.dueAt) return <span className="text-mist-500">Not given</span>;
    const due = dayjs(dispute.dueAt);
    const label = due.format("D MMM YYYY");
    if (dispute.status !== "open") return <span className="whitespace-nowrap text-mist-600">{label}</span>;
    const hoursLeft = due.diff(dayjs(), "hour");
    if (hoursLeft < 0) return <StatusBadge label={`Overdue (${label})`} tone="red" />;
    if (hoursLeft < 48) return <StatusBadge label={`Due ${label}`} tone="amber" />;
    return <span className="whitespace-nowrap">{label}</span>;
}

const DISPUTE_COLUMNS: ColumnDef<ShopDisputeRow>[] = [
    { key: "order", header: "Order", cell: (row) => <span className="font-medium text-mist-950">{row.orderCode}</span> },
    { key: "customer", header: "Customer", cell: (row) => row.customerName ?? "Unknown" },
    { key: "amount", header: "Disputed", cell: (row) => <span className="whitespace-nowrap">{naira(row.amountKobo)}</span> },
    { key: "due", header: "Answer by", cell: (row) => <DueCell dispute={row} /> },
    { key: "opened", header: "Opened", cell: (row) => <span className="whitespace-nowrap">{row.openedAt ? dayjs(row.openedAt).format("D MMM YYYY") : ""}</span> },
    {
        key: "status",
        header: "Status",
        cell: (row) =>
            row.needsReview ? (
                <StatusBadge label="Check on platform" tone="indigo" variant="pill" />
            ) : (
                <StatusBadge label={DISPUTE_STATUS_LABELS[row.status]} tone={DISPUTE_STATUS_TONES[row.status]} variant="pill" />
            ),
    },
];

function usePage(tableId: string) {
    const searchParams = useSearchParams();
    const page = Math.max(1, Number(searchParams.get(`${tableId}_page`) ?? 1) || 1);
    return { page, status: searchParams.get(`${tableId}_status`) };
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex justify-between gap-4 border-b border-mist-100 py-2 last:border-0">
            <dt className="text-mist-500">{label}</dt>
            <dd className="text-right font-medium text-mist-950">{children}</dd>
        </div>
    );
}

// ─── Card refunds ─────────────────────────────────────────────────────────────

function RefundsSection() {
    const queryClient = useQueryClient();
    const { page, status: statusParam } = usePage(REFUNDS_TABLE);
    const status = REFUND_STATUS_ITEMS.some((item) => item.value === statusParam) ? (statusParam as "failed" | "pending" | "credited") : undefined;
    const [open, setOpen] = useState<CardRefundRow | null>(null);
    const [busy, setBusy] = useState<"retry" | "credit" | null>(null);

    const query = useQuery({
        queryKey: queryKeys.shop.cardRefunds({ page, status }),
        queryFn: () => shopPaymentsService.listRefunds({ page, limit: PAGE_SIZE, status }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    const settle = async (action: "retry" | "credit") => {
        if (!open) return;
        setBusy(action);
        try {
            const updated = action === "retry" ? await shopPaymentsService.retryRefund(open) : await shopPaymentsService.creditRefund(open);
            await queryClient.invalidateQueries({ queryKey: queryKeys.shop.cardRefunds().slice(0, -1) });
            if (action === "credit") toast.success(`${naira(updated.amountKobo)} added to the customer's store credit`);
            else if (updated.status === "failed") toast.error("The payment platform refused the refund again. Give it as store credit instead.");
            else toast.success("Refund asked for again. It shows as refunded once the payment platform confirms it.");
            setOpen(null);
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't settle that refund. Please try again."));
        } finally {
            setBusy(null);
        }
    };

    return (
        <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-mist-950">Card refunds</h2>
                <p className="font-text text-sm text-mist-600">
                    Refunds the payment platform refused or couldn&apos;t finish, and ones still on their way. A failed refund is still owed to the customer: retry it on their card, or give it as store credit.
                </p>
            </div>
            <DataTable
                tableId={REFUNDS_TABLE}
                columns={REFUND_COLUMNS}
                rows={query.data?.refunds ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the refunds. Please refresh the page." : undefined}
                emptyMessage={status ? "No refunds here." : "No card refunds need attention."}
                onRowClick={setOpen}
                rowActions={[{ label: "View", onSelect: setOpen }]}
                toolbar={<TableToolbar filters={[{ title: "Needs attention", paramKey: "status", items: REFUND_STATUS_ITEMS }]} />}
            />

            <Dialog open={!!open} onOpenChange={(next) => !next && !busy && setOpen(null)}>
                <DialogContent className="max-w-130">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>{open ? `${naira(open.amountKobo)} to ${open.customerName}` : "Refund"}</DialogTitle>
                        <DialogDescription>{open ? `Order ${open.orderCode}, asked ${dayjs(open.at).format("D MMMM YYYY, h:mm a")}` : ""}</DialogDescription>
                    </div>
                    {open && (
                        <div className="flex flex-col gap-5 font-text text-sm">
                            <dl className="flex flex-col">
                                <Detail label="Status">
                                    <StatusBadge label={REFUND_STATUS_LABELS[open.status] ?? open.status} tone={REFUND_STATUS_TONES[open.status] ?? "gray"} variant="pill" />
                                </Detail>
                                <Detail label="Why">{open.reason}</Detail>
                                <Detail label="Paid with">{open.provider ? PLATFORM_NAMES[open.provider] : "Unknown"}</Detail>
                                {open.refundId && <Detail label="Platform refund id">{open.refundId}</Detail>}
                                {open.failureReason && <Detail label="What went wrong">{open.failureReason}</Detail>}
                                {open.checkedAt && <Detail label="Last checked">{dayjs(open.checkedAt).format("D MMM YYYY, h:mm a")}</Detail>}
                                <Detail label="Times asked">{open.attempts}</Detail>
                                {open.settledBy && open.settledAt && (
                                    <Detail label={open.status === "credited" ? "Given as credit by" : "Retried by"}>
                                        {open.settledBy}, {dayjs(open.settledAt).format("D MMM YYYY")}
                                    </Detail>
                                )}
                            </dl>
                            {open.status === "pending" && (
                                <p className="rounded-lg bg-mist-50 px-4 py-3 text-mist-700">
                                    The payment platform is still working on it. It updates here once they confirm it went through or failed.
                                </p>
                            )}
                            <div className="flex flex-wrap justify-end gap-3">
                                <Button
                                    type="button"
                                    disabled={!!busy}
                                    onClick={() => setOpen(null)}
                                    className="h-10 cursor-pointer rounded-button bg-mist-100 px-4 text-sm font-medium text-mist-950 hover:bg-mist-200"
                                >
                                    Close
                                </Button>
                                {open.status === "failed" && (
                                    <>
                                        <Button type="button" variant="outline" disabled={!!busy} onClick={() => settle("credit")} className="h-10 rounded-button px-4 text-sm">
                                            {busy === "credit" ? "Adding credit..." : "Give as store credit"}
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={!!busy}
                                            onClick={() => settle("retry")}
                                            className="h-10 cursor-pointer rounded-button bg-secondary-700 px-4 text-sm font-medium text-white hover:bg-secondary-900"
                                        >
                                            {busy === "retry" ? "Asking..." : "Retry on card"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

function DisputesSection() {
    const { page, status: statusParam } = usePage(DISPUTES_TABLE);
    const status = DISPUTE_STATUS_ITEMS.some((item) => item.value === statusParam) ? (statusParam as ShopDisputeStatus) : undefined;
    const [open, setOpen] = useState<ShopDisputeRow | null>(null);

    const query = useQuery({
        queryKey: queryKeys.shop.disputes({ page, status }),
        queryFn: () => shopPaymentsService.listDisputes({ page, limit: PAGE_SIZE, status }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    return (
        <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-mist-950">Disputes</h2>
                <p className="font-text text-sm text-mist-600">
                    Customers who asked their bank for their money back. Send your evidence on the payment platform&apos;s dashboard before the date shown. A lost dispute is counted against the order like a refund, and the seller&apos;s share of it is taken back.
                </p>
            </div>
            <DataTable
                tableId={DISPUTES_TABLE}
                columns={DISPUTE_COLUMNS}
                rows={query.data?.disputes ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the disputes. Please refresh the page." : undefined}
                emptyMessage={status ? "No disputes here." : "No disputes. Chargebacks on shop orders show here."}
                onRowClick={setOpen}
                rowActions={[{ label: "View", onSelect: setOpen }]}
                toolbar={<TableToolbar filters={[{ title: "All disputes", paramKey: "status", items: DISPUTE_STATUS_ITEMS }]} />}
            />

            <Dialog open={!!open} onOpenChange={(next) => !next && setOpen(null)}>
                <DialogContent className="max-w-130">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>{open ? `Dispute on order ${open.orderCode}` : "Dispute"}</DialogTitle>
                        <DialogDescription>{open?.openedAt ? `Opened ${dayjs(open.openedAt).format("D MMMM YYYY, h:mm a")}` : ""}</DialogDescription>
                    </div>
                    {open && (
                        <div className="flex flex-col gap-5 font-text text-sm">
                            <dl className="flex flex-col">
                                <Detail label="Status">
                                    {open.needsReview ? (
                                        <StatusBadge label="Check on platform" tone="indigo" variant="pill" />
                                    ) : (
                                        <StatusBadge label={DISPUTE_STATUS_LABELS[open.status]} tone={DISPUTE_STATUS_TONES[open.status]} variant="pill" />
                                    )}
                                </Detail>
                                <Detail label="Customer">{open.customerName ?? "Unknown"}</Detail>
                                <Detail label="Disputed">{naira(open.amountKobo)}</Detail>
                                {open.orderTotalKobo !== null && <Detail label="Order total">{naira(open.orderTotalKobo)}</Detail>}
                                <Detail label="Answer by">
                                    <DueCell dispute={open} />
                                </Detail>
                                <Detail label="Platform">
                                    {PLATFORM_NAMES[open.provider] ?? open.provider} (dispute {open.providerDisputeId})
                                </Detail>
                                {open.providerStatus && <Detail label="Platform status">{open.providerStatus.replace(/-/g, " ")}</Detail>}
                                {open.category && <Detail label="Kind">{open.category.replace(/-/g, " ")}</Detail>}
                                {open.reason && <Detail label="Note">{open.reason}</Detail>}
                                {open.resolvedAt && <Detail label="Decided">{dayjs(open.resolvedAt).format("D MMM YYYY")}</Detail>}
                                {open.status === "lost" && <Detail label="Counted against the order">{naira(open.appliedKobo)}</Detail>}
                            </dl>
                            {open.needsReview && (
                                <p className="rounded-lg bg-mist-50 px-4 py-3 text-mist-700">
                                    The platform closed this dispute in a way we couldn&apos;t read. Check who it went to on the platform&apos;s dashboard.
                                </p>
                            )}
                            {open.status === "lost" && open.appliedKobo < open.amountKobo && (
                                <p className="rounded-lg bg-mist-50 px-4 py-3 text-mist-700">
                                    More went back to the customer than was left to refund on the order. Check the order&apos;s refunds on the payment platform.
                                </p>
                            )}
                            <div className="flex justify-end">
                                <Button type="button" onClick={() => setOpen(null)} className="h-10 cursor-pointer rounded-button bg-mist-100 px-4 text-sm font-medium text-mist-950 hover:bg-mist-200">
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}

const TABS = [
    { value: "refunds", label: "Card refunds" },
    { value: "disputes", label: "Disputes" },
] as const;

export default function PaymentsTab() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tab = searchParams.get("tab") === "disputes" ? "disputes" : "refunds";
    return (
        <div className="flex flex-col gap-5">
            <div className="flex gap-2" role="tablist" aria-label="Refunds and disputes">
                {TABS.map((each) => (
                    <Link
                        key={each.value}
                        href={`${pathname}?tab=${each.value}`}
                        role="tab"
                        aria-selected={tab === each.value}
                        className={`rounded-button px-4 py-2 font-text text-sm font-medium ${tab === each.value ? "bg-secondary-700 text-white" : "bg-mist-100 text-mist-950 hover:bg-mist-200"}`}
                    >
                        {each.label}
                    </Link>
                ))}
            </div>
            {tab === "disputes" ? <DisputesSection /> : <RefundsSection />}
        </div>
    );
}
