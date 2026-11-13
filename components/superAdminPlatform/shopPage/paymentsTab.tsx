"use client";

import { useState } from "react";
import { useLinkedItem } from "@/hooks/useLinkedItem";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef, type StatusTone } from "@/components/customTable";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
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
//    Refunds on orders paid by bank transfer are here too: the platform
//    never had that money, so a super admin sends it back by transfer to the
//    account the customer paid from and marks it sent (or gives it as store
//    credit). Those still to send come first, with the failed card ones.
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
const REFUND_METHOD_ITEMS = [
    { value: "card", label: "Card" },
    { value: "bank", label: "Bank transfer" },
];

/** A bank refund still pending is waiting on a super admin to send it, not on the platform. */
const refundStatus = (row: CardRefundRow): { label: string; tone: StatusTone } =>
    row.method === "bank" && row.status === "pending"
        ? { label: "To send", tone: "red" }
        : row.method === "bank" && row.status === "succeeded"
          ? { label: "Sent", tone: "green" }
          : { label: REFUND_STATUS_LABELS[row.status] ?? row.status, tone: REFUND_STATUS_TONES[row.status] ?? "gray" };

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
    { key: "to", header: "Back to", cell: (row) => (row.method === "bank" ? "Bank transfer" : "Card") },
    { key: "asked", header: "Asked", cell: (row) => <span className="whitespace-nowrap">{dayjs(row.at).format("D MMM YYYY")}</span> },
    {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge label={refundStatus(row).label} tone={refundStatus(row).tone} variant="pill" />,
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
    return { page, status: searchParams.get(`${tableId}_status`), method: searchParams.get(`${tableId}_method`) };
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
    const { page, status: statusParam, method: methodParam } = usePage(REFUNDS_TABLE);
    const status = REFUND_STATUS_ITEMS.some((item) => item.value === statusParam) ? (statusParam as "failed" | "pending" | "credited") : undefined;
    const method = REFUND_METHOD_ITEMS.some((item) => item.value === methodParam) ? (methodParam as "card" | "bank") : undefined;
    const [picked, setPicked] = useState<CardRefundRow | null>(null);
    const [busy, setBusy] = useState<"retry" | "credit" | null>(null);
    const searchParams = useSearchParams();

    const query = useQuery({
        queryKey: queryKeys.shop.cardRefunds({ page, status, method }),
        queryFn: () => shopPaymentsService.listRefunds({ page, limit: PAGE_SIZE, status, method }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });
    // ?order=&part=&key= (a notification's "View refund") opens that refund
    const linkOrder = searchParams.get("order");
    const linkPart = searchParams.get("part");
    const linkKey = searchParams.get("key");
    const { linked, closeLink } = useLinkedItem({
        id: linkOrder && linkPart && linkKey ? [linkOrder, linkPart, linkKey].join("|") : null,
        queryKey: queryKeys.shop.cardRefunds(),
        findOnPage: (id) => {
            const [orderId, partId, key] = id.split("|");
            return query.data?.refunds.find((row) => row.orderId === orderId && row.partId === partId && row.key === key);
        },
        fetchOne: (id) => {
            const [orderId = "", partId = "", key = ""] = id.split("|");
            return shopPaymentsService.getRefund({ orderId, partId, key });
        },
        ready: !!query.data,
        notFoundMessage: "We couldn't open that refund. Find it in the list below.",
    });
    const open = picked ?? linked;
    const setOpen = (row: CardRefundRow | null) => {
        setPicked(row);
        if (!row) closeLink();
    };

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
                <h2 className="text-lg font-semibold text-mist-950">Refunds</h2>
                <p className="font-text text-sm text-mist-600">
                    Refunds the payment platform refused or couldn&apos;t finish, and ones still on their way. A failed refund is still owed to the customer: retry it on their card, or give it as store credit.
                    A refund on an order paid by bank transfer is yours to send: transfer it to the customer&apos;s account, then mark it sent.
                </p>
            </div>
            <DataTable
                tableId={REFUNDS_TABLE}
                columns={REFUND_COLUMNS}
                rows={query.data?.refunds ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the refunds. Please refresh the page." : undefined}
                emptyMessage={status || method ? "No refunds here." : "No refunds need attention."}
                onRowClick={setOpen}
                rowActions={[{ label: "View", onSelect: setOpen }]}
                toolbar={
                    <TableToolbar
                        filters={[
                            { title: "Needs attention", paramKey: "status", items: REFUND_STATUS_ITEMS },
                            { title: "Card and bank", paramKey: "method", items: REFUND_METHOD_ITEMS },
                        ]}
                    />
                }
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
                                    <StatusBadge label={refundStatus(open).label} tone={refundStatus(open).tone} variant="pill" />
                                </Detail>
                                <Detail label="Why">{open.reason}</Detail>
                                <Detail label="Paid with">{open.method === "bank" ? "Bank transfer" : open.provider ? PLATFORM_NAMES[open.provider] : "Unknown"}</Detail>
                                {open.sendTo && (
                                    <Detail label="Send it to">
                                        {open.sendTo.accountName}, {open.sendTo.bankName} {open.sendTo.accountNumber}
                                    </Detail>
                                )}
                                {open.refundId && <Detail label={open.method === "bank" ? "Bank reference" : "Platform refund id"}>{open.refundId}</Detail>}
                                {open.failureReason && <Detail label="What went wrong">{open.failureReason}</Detail>}
                                {open.checkedAt && <Detail label="Last checked">{dayjs(open.checkedAt).format("D MMM YYYY, h:mm a")}</Detail>}
                                {open.method !== "bank" && <Detail label="Times asked">{open.attempts}</Detail>}
                                {open.settledBy && open.settledAt && (
                                    <Detail label={open.status === "credited" ? "Given as credit by" : open.method === "bank" ? "Sent by" : "Retried by"}>
                                        {open.settledBy}, {dayjs(open.settledAt).format("D MMM YYYY")}
                                    </Detail>
                                )}
                            </dl>
                            {open.method === "bank" && open.status === "pending" && (
                                <BankRefundSentForm
                                    key={open.id}
                                    refund={open}
                                    busy={!!busy}
                                    onClose={() => setOpen(null)}
                                    onCredit={() => settle("credit")}
                                    onSent={async () => {
                                        await queryClient.invalidateQueries({ queryKey: queryKeys.shop.cardRefunds().slice(0, -1) });
                                        setOpen(null);
                                    }}
                                />
                            )}
                            {open.method !== "bank" && open.status === "pending" && (
                                <p className="rounded-lg bg-mist-50 px-4 py-3 text-mist-700">
                                    The payment platform is still working on it. It updates here once they confirm it went through or failed.
                                </p>
                            )}
                            {!(open.method === "bank" && open.status === "pending") && (
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
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}

/**
 * A bank refund to send: the super admin transfers it from MANDE's bank to
 * the customer's account, then marks it sent here, with the bank's reference
 * if they have it. Or they give it as store credit instead.
 */
function BankRefundSentForm({
    refund,
    busy,
    onClose,
    onCredit,
    onSent,
}: {
    refund: CardRefundRow;
    busy: boolean;
    onClose: () => void;
    onCredit: () => void;
    onSent: () => Promise<void>;
}) {
    const methods = useForm<{ reference: string }>({ mode: "onTouched", defaultValues: { reference: "" } });
    const [sending, setSending] = useState(false);
    const fields: FormFieldConfig[] = [
        {
            name: "reference",
            type: "text",
            label: "Bank reference (optional)",
            placeholder: "From your bank's receipt",
            maxLength: 120,
            validation: { maxLength: { value: 120, message: "Keep it to 120 characters" } },
        },
    ];

    const submit = async ({ reference }: { reference: string }) => {
        setSending(true);
        try {
            await shopPaymentsService.markRefundSent(refund, reference);
            toast.success("Marked as sent. The customer has been told.");
            await onSent();
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't mark that refund as sent. Please try again."));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <p className="rounded-lg bg-mist-50 px-4 py-3 text-mist-700">
                Send {naira(refund.amountKobo)} from MANDE&apos;s bank to the account above, then mark it sent. Only mark it once the transfer has gone: the customer is told it&apos;s on its way.
            </p>
            <MainForm<{ reference: string }>
                methods={methods}
                fields={fields}
                onSubmit={submit}
                requireValidToSubmit={false}
                hideRequiredMarks
                renderFooter={() => (
                    <div className="flex flex-wrap justify-end gap-3">
                        <Button
                            type="button"
                            disabled={busy || sending}
                            onClick={onClose}
                            className="h-10 cursor-pointer rounded-button bg-mist-100 px-4 text-sm font-medium text-mist-950 hover:bg-mist-200"
                        >
                            Close
                        </Button>
                        <Button type="button" variant="outline" disabled={busy || sending} onClick={onCredit} className="h-10 rounded-button px-4 text-sm">
                            {busy ? "Adding credit..." : "Give as store credit"}
                        </Button>
                        <Button
                            type="submit"
                            disabled={busy || sending}
                            className="h-10 cursor-pointer rounded-button bg-secondary-700 px-4 text-sm font-medium text-white hover:bg-secondary-900"
                        >
                            {sending ? "Saving..." : "Mark as sent"}
                        </Button>
                    </div>
                )}
            />
        </div>
    );
}

// ─── Disputes ─────────────────────────────────────────────────────────────────

function DisputesSection() {
    const { page, status: statusParam } = usePage(DISPUTES_TABLE);
    const status = DISPUTE_STATUS_ITEMS.some((item) => item.value === statusParam) ? (statusParam as ShopDisputeStatus) : undefined;
    const [picked, setPicked] = useState<ShopDisputeRow | null>(null);
    const searchParams = useSearchParams();

    const query = useQuery({
        queryKey: queryKeys.shop.disputes({ page, status }),
        queryFn: () => shopPaymentsService.listDisputes({ page, limit: PAGE_SIZE, status }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });
    // ?dispute=<id> (a notification's "View dispute") opens that dispute
    const { linked, closeLink } = useLinkedItem({
        id: searchParams.get("dispute"),
        queryKey: queryKeys.shop.disputes(),
        findOnPage: (id) => query.data?.disputes.find((dispute) => dispute.id === id),
        fetchOne: (id) => shopPaymentsService.getDispute(id),
        ready: !!query.data,
        notFoundMessage: "We couldn't open that dispute. Find it in the list below.",
    });
    const open = picked ?? linked;
    const setOpen = (dispute: ShopDisputeRow | null) => {
        setPicked(dispute);
        if (!dispute) closeLink();
    };

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
