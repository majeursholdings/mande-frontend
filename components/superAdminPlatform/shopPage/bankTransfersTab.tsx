"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef, type StatusTone } from "@/components/customTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";
import { formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { bankTransfersService, type BankTransferRow, type BankTransferStatus } from "@/lib/services/shopService";
import ShopReasonForm from "../form/shopReasonForm";

// ─────────────────────────────────────────────────────────────────────────────
// Shop › Bank transfers (admins and super admins): orders the customer is
// paying by bank transfer to MANDE's account: all of them, or one status.
// The ones the customer says they've sent come first, longest waiting first.
// Staff check MANDE's bank for the exact amount (with the order code as the
// reference, from the account the customer named, as on their receipt), then:
//  • confirm it: the order is paid, exactly as a card payment would be, and
//    the customer and staff get the usual new order emails
//  • or reject it with a reason: the order is cancelled, any store credit it
//    used goes back, and the customer is told why
// The receipt is private: each "View receipt" fetches a link that works for
// a few minutes. ?order=<orderId> (a notification's "Review transfer") opens
// that order's transfer, fetched on its own when it isn't on the page shown.
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const TABLE = "shop-bank-transfers";
const naira = (kobo: number) => formatPrice(fromKobo(kobo));

const STATUS_ITEMS: { value: BankTransferStatus; label: string }[] = [
    { value: "sent", label: "To check" },
    { value: "awaiting_transfer", label: "Waiting for the customer" },
    { value: "confirmed", label: "Confirmed" },
    { value: "rejected", label: "Rejected" },
    { value: "expired", label: "Expired" },
];
const STATUS_LABELS: Record<BankTransferStatus, string> = {
    sent: "To check",
    awaiting_transfer: "Not sent yet",
    confirmed: "Confirmed",
    rejected: "Rejected",
    expired: "Expired",
};
const STATUS_TONES: Record<BankTransferStatus, StatusTone> = { sent: "amber", awaiting_transfer: "gray", confirmed: "green", rejected: "red", expired: "gray" };

const accountLine = (account: { bankName: string; accountNumber: string; accountName: string }) => `${account.accountName}, ${account.bankName} ${account.accountNumber}`;
const senderLine = (sender: { bankName: string; accountName: string; accountNumberLast4: string }) => `${sender.accountName}, ${sender.bankName} ending ${sender.accountNumberLast4}`;

const COLUMNS: ColumnDef<BankTransferRow>[] = [
    { key: "order", header: "Order", cell: (row) => <span className="font-medium text-mist-950">{row.orderCode}</span> },
    { key: "customer", header: "Customer", cell: (row) => row.customer.name },
    { key: "amount", header: "Amount", cell: (row) => <span className="whitespace-nowrap font-medium">{naira(row.amountKobo)}</span> },
    {
        key: "from",
        header: "Sent from",
        cell: (row) =>
            row.sender ? <span className="line-clamp-1 max-w-56">{`${row.sender.bankName} ending ${row.sender.accountNumberLast4}`}</span> : <span className="text-mist-500">Not yet</span>,
    },
    {
        key: "when",
        header: "Sent",
        cell: (row) => <span className="whitespace-nowrap">{row.sentAt ? dayjs(row.sentAt).format("D MMM, h:mm a") : `Due ${dayjs(row.dueAt).format("D MMM, h:mm a")}`}</span>,
    },
    { key: "status", header: "Status", cell: (row) => <StatusBadge label={STATUS_LABELS[row.status]} tone={STATUS_TONES[row.status]} variant="pill" /> },
];

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex justify-between gap-4 border-b border-mist-100 py-2 last:border-0">
            <dt className="shrink-0 text-mist-500">{label}</dt>
            <dd className="text-right font-medium text-mist-950">{children}</dd>
        </div>
    );
}

export default function BankTransfersTab() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const page = Math.max(1, Number(searchParams.get(`${TABLE}_page`) ?? 1) || 1);
    const statusParam = searchParams.get(`${TABLE}_status`);
    const status = STATUS_ITEMS.some((item) => item.value === statusParam) ? (statusParam as BankTransferStatus) : undefined;
    const [picked, setOpen] = useState<BankTransferRow | null>(null);
    const [rejecting, setRejecting] = useState(false);
    const [busy, setBusy] = useState<"confirm" | "receipt" | null>(null);
    // ?order=<orderId> opens that transfer, until it's closed
    const [linkClosed, setLinkClosed] = useState(false);
    const linkedOrderId = searchParams.get("order");

    const query = useQuery({
        queryKey: queryKeys.shop.bankTransfers({ page, status }),
        queryFn: () => bankTransfersService.list({ page, limit: PAGE_SIZE, status }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });
    const linkedOnPage = !linkClosed && linkedOrderId ? (query.data?.transfers.find((transfer) => transfer.orderId === linkedOrderId) ?? null) : null;
    // Not on this page: fetched on its own
    const linkedQuery = useQuery({
        queryKey: queryKeys.shop.bankTransfers({ order: linkedOrderId }),
        queryFn: async () => {
            try {
                return await bankTransfersService.get(linkedOrderId!);
            } catch (error) {
                toast.error(getErrorMessage(error, "We couldn't open that transfer. Find it in the list below."));
                throw error;
            }
        },
        enabled: !linkClosed && !!linkedOrderId && !!query.data && !linkedOnPage,
        retry: false,
        staleTime: 30_000,
    });
    const open = picked ?? linkedOnPage ?? (!linkClosed && linkedOrderId ? (linkedQuery.data ?? null) : null);

    const close = () => {
        setOpen(null);
        setLinkClosed(true);
        setRejecting(false);
    };

    const refresh = () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.shop.bankTransfers().slice(0, -1) }),
            // A confirmed transfer is a new paid order
            queryClient.invalidateQueries({ queryKey: queryKeys.shop.mandeOrders().slice(0, -1) }),
        ]);

    const confirm = async () => {
        if (!open) return;
        setBusy("confirm");
        try {
            const updated = await bankTransfersService.confirm(open.orderId);
            await refresh();
            toast.success(`Order ${updated.orderCode} is paid. The customer has been told.`);
            close();
        } catch (error) {
            await refresh();
            toast.error(getErrorMessage(error, "We couldn't confirm that transfer. Please try again."));
        } finally {
            setBusy(null);
        }
    };

    /** A fresh link each time (the last one may have expired), opened in a new tab. */
    const openReceipt = async () => {
        if (!open) return;
        // Opened straight away, so the browser doesn't block it as a popup once the link arrives
        const tab = window.open("", "_blank");
        setBusy("receipt");
        try {
            const { url } = await bankTransfersService.receipt(open.orderId);
            if (tab) {
                tab.opener = null;
                tab.location.href = url;
            } else {
                window.open(url, "_blank", "noopener,noreferrer");
            }
        } catch (error) {
            tab?.close();
            toast.error(getErrorMessage(error, "Couldn't open the receipt. Please try again."));
        } finally {
            setBusy(null);
        }
    };

    const waiting = open?.status === "sent" || open?.status === "awaiting_transfer";

    return (
        <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-mist-950">Bank transfers</h2>
                <p className="font-text text-sm text-mist-600">
                    Orders paid by bank transfer to MANDE&apos;s account. Check the money arrived (the exact amount, with the order code as the reference), then confirm it so the order goes ahead, or
                    reject it if it didn&apos;t come.
                </p>
            </div>
            <DataTable
                tableId={TABLE}
                columns={COLUMNS}
                rows={query.data?.transfers ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the bank transfers. Please refresh the page." : undefined}
                emptyMessage={status === "sent" ? "No transfers waiting to be checked." : status ? "No transfers here." : "No bank transfers yet."}
                onRowClick={setOpen}
                rowActions={[{ label: "View", onSelect: setOpen }]}
                toolbar={<TableToolbar filters={[{ title: "All statuses", paramKey: "status", items: STATUS_ITEMS }]} />}
            />

            <Dialog open={!!open} onOpenChange={(next) => !next && !busy && close()}>
                <DialogContent className="max-h-[90vh] max-w-130 overflow-y-auto">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>{open ? `${naira(open.amountKobo)} for order ${open.orderCode}` : "Bank transfer"}</DialogTitle>
                        <DialogDescription>{open ? `From ${open.customer.name}, placed ${dayjs(open.createdAt).format("D MMMM YYYY, h:mm a")}` : ""}</DialogDescription>
                    </div>
                    {open && rejecting && (
                        <ShopReasonForm
                            key={open.orderId}
                            label="Why are you rejecting it?"
                            placeholder="e.g. No transfer from this account reached us by the due time."
                            description="The customer sees this. The order is cancelled, and any store credit it used goes back to them."
                            submitLabel="Reject transfer"
                            loadingLabel="Rejecting..."
                            maxLength={300}
                            onCancel={() => setRejecting(false)}
                            onSubmit={async (reason) => {
                                await bankTransfersService.reject(open.orderId, reason);
                                await refresh();
                                toast.success(`Order ${open.orderCode} cancelled. The customer has been told why.`);
                                close();
                            }}
                        />
                    )}
                    {open && !rejecting && (
                        <div className="flex flex-col gap-5 font-text text-sm">
                            <dl className="flex flex-col">
                                <Detail label="Status">
                                    <StatusBadge label={STATUS_LABELS[open.status]} tone={STATUS_TONES[open.status]} variant="pill" />
                                </Detail>
                                <Detail label="Amount to receive">{naira(open.amountKobo)}</Detail>
                                {open.creditKobo > 0 && <Detail label="Paid with store credit">{naira(open.creditKobo)}</Detail>}
                                <Detail label="Reference">{open.orderCode}</Detail>
                                <Detail label="Into">{accountLine(open.payTo)}</Detail>
                                <Detail label="Sent from">{open.sender ? senderLine(open.sender) : "Not sent yet"}</Detail>
                                {open.sentAt ? (
                                    <Detail label="Marked as sent">{dayjs(open.sentAt).format("D MMM YYYY, h:mm a")}</Detail>
                                ) : (
                                    <Detail label="Due by">{dayjs(open.dueAt).format("D MMM YYYY, h:mm a")}</Detail>
                                )}
                                <Detail label="Customer">
                                    {open.customer.name}
                                    {open.customer.email ? `, ${open.customer.email}` : ""}, {open.customer.phone}
                                </Detail>
                                <Detail label="Items">{open.items.map((item) => `${item.quantity} × ${item.title}`).join(", ")}</Detail>
                                {open.reviewedBy && open.reviewedAt && (
                                    <Detail label={open.status === "rejected" ? "Rejected by" : "Confirmed by"}>
                                        {open.reviewedBy}, {dayjs(open.reviewedAt).format("D MMM YYYY")}
                                    </Detail>
                                )}
                                {open.rejectReason && <Detail label="Reason">{open.rejectReason}</Detail>}
                            </dl>
                            {open.hasReceipt && (
                                <Button type="button" variant="outline" disabled={!!busy} onClick={openReceipt} className="h-10 self-start rounded-button px-4 text-sm">
                                    {busy === "receipt" ? "Opening..." : "View receipt"}
                                </Button>
                            )}
                            {open.status === "sent" && (
                                <p className="rounded-lg bg-mist-50 px-4 py-3 text-mist-700">
                                    Only confirm once you&apos;ve seen {naira(open.amountKobo)} arrive in MANDE&apos;s account{open.sender ? ` from ${open.sender.accountName}` : ""}. Confirming pays the
                                    order and can&apos;t be undone.
                                </p>
                            )}
                            {open.status === "awaiting_transfer" && (
                                <p className="rounded-lg bg-mist-50 px-4 py-3 text-mist-700">
                                    The customer hasn&apos;t said they&apos;ve sent it yet. You can confirm it once they do, with their receipt. If it isn&apos;t sent by the due time, the order is
                                    cancelled on its own.
                                </p>
                            )}
                            <div className="flex flex-wrap justify-end gap-3">
                                <Button
                                    type="button"
                                    disabled={!!busy}
                                    onClick={close}
                                    className="h-10 cursor-pointer rounded-button bg-mist-100 px-4 text-sm font-medium text-mist-950 hover:bg-mist-200"
                                >
                                    Close
                                </Button>
                                {waiting && (
                                    <Button type="button" variant="outline" disabled={!!busy} onClick={() => setRejecting(true)} className="h-10 rounded-button px-4 text-sm text-error-700">
                                        Reject
                                    </Button>
                                )}
                                {open.status === "sent" && (
                                    <Button
                                        type="button"
                                        disabled={!!busy}
                                        onClick={confirm}
                                        className="h-10 cursor-pointer rounded-button bg-secondary-700 px-4 text-sm font-medium text-white hover:bg-secondary-900"
                                    >
                                        {busy === "confirm" ? "Confirming..." : "Confirm payment"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
