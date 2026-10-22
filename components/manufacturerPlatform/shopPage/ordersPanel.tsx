"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ImageOff } from "lucide-react";
import { toast } from "sonner";
import { DataTable, ExportMenu, StatusBadge, TableToolbar, exportRows, type ColumnDef, type ExportFormat } from "@/components/customTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ORDER_PART_STATUS_FILTER_ITEMS, ORDER_PART_STATUS_LABELS, ORDER_PART_STATUS_TONES, type OrderPartStatus } from "@/constant/shop";
import { formatPrice, fromKobo } from "@/lib/currency";
import type { OrderPartMove, SellerShopApi, ShopOrderPart } from "@/lib/services/shopService";
import { getErrorMessage } from "@/lib/api";
import { exportFilename, orderExportColumns } from "./shopTransfer";

const PAGE_SIZE = 10;
const naira = (kobo: number) => formatPrice(fromKobo(kobo));
const itemCount = (order: ShopOrderPart) => order.lines.reduce((sum, line) => sum + line.quantity, 0);

// ─────────────────────────────────────────────────────────────────────────────
// OrdersPanel: a seller's part of each paid order, a page at a time (status
// filter and page in the URL). Opening one shows what was bought, where it
// goes and the money, and moves it on: being prepared, shipped (with a note
// for the customer, like a courier and waybill), delivered, or cancelled
// before it ships (with a reason; the customer is refunded in full and the
// stock goes back). The customer is told at each step. Export saves every
// order matching the filter.
// ─────────────────────────────────────────────────────────────────────────────

export default function OrdersPanel({
    tableId,
    api,
    queryKey,
    payoutLabel = "Paid to you",
    exportName = "orders",
    renderLine,
}: {
    tableId: string;
    api: SellerShopApi;
    queryKey: (filters: Record<string, unknown>) => readonly unknown[];
    /** The order's last line: what the seller is paid, e.g. "Paid to MANDE" for MANDE stock. */
    payoutLabel?: string;
    /** The start of an export's file name, e.g. "mande-stock-orders". */
    exportName?: string;
    /** More under a line in the open order (MANDE stock: its job, or "Create job"). `onChanged` reloads the orders. */
    renderLine?: (order: ShopOrderPart, line: ShopOrderPart["lines"][number], onChanged: () => void) => ReactNode;
}) {
    const searchParams = useSearchParams();
    const [picked, setPicked] = useState<ShopOrderPart | null>(null);
    // ?order=<orderId> (from Actions) opens that order once it's on the page, until it's closed
    const [linkClosed, setLinkClosed] = useState(false);
    const linkedOrderId = searchParams.get("order");
    const page = Math.max(1, Number(searchParams.get(`${tableId}_page`) ?? 1) || 1);
    const statusParam = searchParams.get(`${tableId}_status`) ?? "";
    const status = ORDER_PART_STATUS_FILTER_ITEMS.some((item) => item.value === statusParam) ? (statusParam as OrderPartStatus) : undefined;

    const query = useQuery({
        queryKey: queryKey({ page, status: status ?? null }),
        queryFn: () => api.listOrders({ page, limit: PAGE_SIZE, status }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });
    const linked = !linkClosed && linkedOrderId ? (query.data?.orders.find((order) => order.orderId === linkedOrderId) ?? null) : null;
    // The open order, as last loaded (so a job made from it shows straight away)
    const openId = picked?.id ?? linked?.id;
    const open = openId ? (query.data?.orders.find((order) => order.id === openId) ?? picked ?? linked) : null;
    const setOpen = (order: ShopOrderPart | null) => {
        setPicked(order);
        if (!order) setLinkClosed(true);
    };

    const exportOrders = async (format: ExportFormat) => {
        const data = await api.exportOrders({ status });
        if (data.orders.length === 0) {
            toast.info("There are no orders to export.");
            return;
        }
        await exportRows(data.orders, orderExportColumns(payoutLabel), {
            format,
            filename: exportFilename(exportName),
            title: status ? `Orders (${ORDER_PART_STATUS_LABELS[status]})` : "Orders",
        });
        if (data.truncated) toast.info(`Exported the newest ${data.orders.length.toLocaleString("en-NG")} of ${data.total.toLocaleString("en-NG")}. Filter the table to export the rest.`);
    };

    const columns: ColumnDef<ShopOrderPart>[] = [
        {
            key: "order",
            header: "Order",
            cell: (order) => (
                <span className="flex flex-col">
                    <span className="font-medium text-mist-950">{order.code}</span>
                    <span className="text-xs text-mist-500">{order.paidAt ? dayjs(order.paidAt).format("D MMM YYYY, h:mm a") : ""}</span>
                </span>
            ),
        },
        {
            key: "customer",
            header: "Customer",
            cell: (order) => (
                <span className="flex flex-col">
                    <span className="max-w-48 truncate text-mist-950">{order.customer.name}</span>
                    <span className="text-xs text-mist-500">
                        {order.customer.city ? `${order.customer.city}, ` : ""}
                        {order.customer.state}
                    </span>
                </span>
            ),
        },
        {
            key: "items",
            header: "Items",
            cell: (order) => (
                <span className="flex flex-col">
                    <span className="max-w-56 truncate text-mist-950">{order.lines.map((line) => line.title).join(", ")}</span>
                    <span className="text-xs text-mist-500">{itemCount(order)} {itemCount(order) === 1 ? "item" : "items"}</span>
                </span>
            ),
        },
        { key: "share", header: "Price", cell: (order) => <span className="whitespace-nowrap font-medium text-mist-950">{naira(order.sellerShareKobo)}</span> },
        {
            key: "status",
            header: "Status",
            cell: (order) => <StatusBadge label={ORDER_PART_STATUS_LABELS[order.status]} tone={ORDER_PART_STATUS_TONES[order.status]} variant="pill" />,
        },
    ];

    return (
        <div className="flex flex-col">
            <DataTable
                tableId={tableId}
                columns={columns}
                rows={query.data?.orders ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the orders. Please refresh the page." : undefined}
                emptyMessage={status ? "No orders in that status." : "No orders yet. They show here once customers buy your products."}
                onRowClick={setOpen}
                rowActions={[{ label: "View order", onSelect: setOpen }]}
                toolbar={
                    <TableToolbar
                        filters={[{ title: "All statuses", paramKey: "status", items: ORDER_PART_STATUS_FILTER_ITEMS }]}
                        actions={<ExportMenu onExport={exportOrders} />}
                    />
                }
            />

            <Dialog open={!!open} onOpenChange={(next) => !next && setOpen(null)}>
                <DialogContent className="max-w-130">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Order {open?.code}</DialogTitle>
                        <DialogDescription>{open?.paidAt ? `Paid ${dayjs(open.paidAt).format("D MMMM YYYY, h:mm a")}` : ""}</DialogDescription>
                    </div>
                    {open && (
                        <div className="flex flex-col gap-5">
                            <StatusBadge label={ORDER_PART_STATUS_LABELS[open.status]} tone={ORDER_PART_STATUS_TONES[open.status]} variant="pill" />
                            <ul className="flex flex-col gap-3">
                                {open.lines.map((line) => (
                                    <li key={line.id} className="flex items-center gap-3">
                                        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist-100 text-mist-400">
                                            {line.imageUrl ? <Image src={line.imageUrl} alt="" fill sizes="48px" className="object-cover" /> : <ImageOff className="size-4" aria-hidden />}
                                        </span>
                                        <span className="flex min-w-0 flex-1 flex-col text-sm font-text">
                                            <span className="truncate font-medium text-mist-950">{line.title}</span>
                                            <span className="text-mist-500">
                                                {line.quantity} × {naira(line.unitPriceKobo)}
                                                {line.pickup ? ", picked up" : line.deliveryFeeKobo ? `, delivery ${naira(line.deliveryFeeKobo)}` : ", free delivery"}
                                            </span>
                                            {renderLine?.(open, line, () => void query.refetch())}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <section className="flex flex-col gap-1 rounded-lg bg-mist-50 px-4 py-3 text-sm font-text">
                                <h3 className="font-semibold text-mist-950">Deliver to</h3>
                                <p className="text-mist-700">{open.customer.name}, {open.customer.phone}</p>
                                <p className="text-mist-700">{[open.customer.street, open.customer.city, open.customer.state].filter(Boolean).join(", ")}</p>
                            </section>
                            {open.note && (
                                <section className="flex flex-col gap-1 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm font-text">
                                    <h3 className="font-semibold text-mist-950">Note from the customer</h3>
                                    <p className="whitespace-pre-line text-mist-700">{open.note}</p>
                                </section>
                            )}
                            <dl className="flex flex-col text-sm font-text">
                                {[
                                    ["Items", naira(open.itemsSubtotalKobo)],
                                    ["Delivery", naira(open.deliveryFeeKobo)],
                                    ["Platform charge", open.platformChargeKobo ? `-${naira(open.platformChargeKobo)}` : naira(0)],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex justify-between gap-4 py-1">
                                        <dt className="text-mist-500">{label}</dt>
                                        <dd className="text-mist-950">{value}</dd>
                                    </div>
                                ))}
                                <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold">
                                    <dt className="text-mist-950">{payoutLabel}</dt>
                                    <dd className="text-mist-950">{naira(open.sellerShareKobo)}</dd>
                                </div>
                            </dl>
                            <OrderActions
                                order={open}
                                api={api}
                                onMoved={(order) => {
                                    setOpen(order);
                                    void query.refetch();
                                }}
                            />
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    onClick={() => setOpen(null)}
                                    className="h-10 px-4 bg-mist-100 hover:bg-mist-200 text-mist-950 text-sm font-medium font-text rounded-button cursor-pointer"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

const MOVE_LABELS: Record<OrderPartMove, string> = {
    processing: "Start preparing it",
    shipped: "Mark as shipped",
    delivered: "Mark as delivered",
    cancelled: "Cancel order",
};

const MOVE_DONE: Record<OrderPartMove, string> = {
    processing: "Marked as being prepared. The customer has been told.",
    shipped: "Marked as shipped. The customer has been told.",
    delivered: "Marked as delivered. The customer has been told.",
    cancelled: "Order cancelled. The customer is being refunded.",
};

/**
 * The order's next steps, as the API allows them (`nextMoves`). Shipping
 * takes an optional note for the customer; cancelling needs a reason and a
 * second click, since it refunds the customer.
 */
function OrderActions({ order, api, onMoved }: { order: ShopOrderPart; api: SellerShopApi; onMoved: (order: ShopOrderPart) => void }) {
    const [pending, setPending] = useState<OrderPartMove | null>(null);
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    if (order.nextMoves.length === 0) return null;

    const run = async (status: OrderPartMove) => {
        if (status === "cancelled" && note.trim().length < 3) {
            toast.error("Say why you're cancelling. The customer will see it.");
            return;
        }
        setBusy(true);
        try {
            const moved = await api.moveOrder(order.orderId, {
                status,
                ...(status === "shipped" && note.trim() && { trackingNote: note.trim() }),
                ...(status === "cancelled" && { reason: note.trim() }),
            });
            toast.success(MOVE_DONE[status]);
            setPending(null);
            setNote("");
            onMoved(moved);
        } catch (error) {
            toast.error(getErrorMessage(error, "We couldn't update the order. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    if (pending === "shipped" || pending === "cancelled") {
        const cancelling = pending === "cancelled";
        return (
            <section className="flex flex-col gap-2 rounded-lg border border-border px-4 py-3 text-sm font-text">
                <label htmlFor="order-move-note" className="font-semibold text-mist-950">
                    {cancelling ? "Why are you cancelling?" : "A note for the customer (optional)"}
                </label>
                <textarea
                    id="order-move-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value.slice(0, 300))}
                    rows={3}
                    maxLength={300}
                    placeholder={cancelling ? "e.g. The material we needed ran out" : "e.g. Sent with GIG Logistics, waybill 12345"}
                    className="w-full resize-y rounded-button border border-border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-secondary-200"
                />
                {cancelling && <p className="text-xs text-mist-500">The customer is refunded in full (items and delivery), and the stock goes back on the shop.</p>}
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setPending(null)} disabled={busy} className="h-9 rounded-button">
                        Back
                    </Button>
                    <Button
                        type="button"
                        onClick={() => run(pending)}
                        disabled={busy}
                        className={cancelling ? "h-9 rounded-button bg-error-600 text-white hover:bg-error-700" : "h-9 rounded-button bg-secondary-700 text-white hover:bg-secondary-900"}
                    >
                        {busy ? "Saving..." : cancelling ? "Cancel and refund" : "Mark as shipped"}
                    </Button>
                </div>
            </section>
        );
    }

    return (
        <section className="flex flex-wrap gap-2">
            {order.nextMoves.map((status) => (
                <Button
                    key={status}
                    type="button"
                    disabled={busy}
                    onClick={() => (status === "shipped" || status === "cancelled" ? setPending(status) : run(status))}
                    className={
                        status === "cancelled"
                            ? "h-9 rounded-button border border-error-200 bg-white text-error-700 hover:bg-error-50"
                            : "h-9 rounded-button bg-secondary-700 text-white hover:bg-secondary-900"
                    }
                >
                    {MOVE_LABELS[status]}
                </Button>
            ))}
        </section>
    );
}
