"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ImageOff } from "lucide-react";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef } from "@/components/customTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ORDER_PART_STATUS_FILTER_ITEMS, ORDER_PART_STATUS_LABELS, ORDER_PART_STATUS_TONES, type OrderPartStatus } from "@/constant/shop";
import { formatPrice, fromKobo } from "@/lib/currency";
import type { SellerShopApi, ShopOrderPart } from "@/lib/services/shopService";

const PAGE_SIZE = 10;
const naira = (kobo: number) => formatPrice(fromKobo(kobo));
const itemCount = (order: ShopOrderPart) => order.lines.reduce((sum, line) => sum + line.quantity, 0);

// ─────────────────────────────────────────────────────────────────────────────
// OrdersPanel: a seller's part of each paid order, a page at a time (status
// filter and page in the URL). Opening one shows what was bought, where it
// goes and the money. Read-only for now: moving an order along (processing,
// shipped, delivered) and cancelling come with fulfilment (phase 3).
// ─────────────────────────────────────────────────────────────────────────────

export default function OrdersPanel({
    tableId,
    api,
    queryKey,
    payoutLabel = "Paid to you",
}: {
    tableId: string;
    api: SellerShopApi;
    queryKey: (filters: Record<string, unknown>) => readonly unknown[];
    /** The order's last line: what the seller is paid, e.g. "Paid to MANDE" for MANDE stock. */
    payoutLabel?: string;
}) {
    const searchParams = useSearchParams();
    const [open, setOpen] = useState<ShopOrderPart | null>(null);
    const page = Math.max(1, Number(searchParams.get(`${tableId}_page`) ?? 1) || 1);
    const statusParam = searchParams.get(`${tableId}_status`) ?? "";
    const status = ORDER_PART_STATUS_FILTER_ITEMS.some((item) => item.value === statusParam) ? (statusParam as OrderPartStatus) : undefined;

    const query = useQuery({
        queryKey: queryKey({ page, status: status ?? null }),
        queryFn: () => api.listOrders({ page, limit: PAGE_SIZE, status }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

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
                toolbar={<TableToolbar filters={[{ title: "All statuses", paramKey: "status", items: ORDER_PART_STATUS_FILTER_ITEMS }]} />}
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
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <section className="flex flex-col gap-1 rounded-lg bg-mist-50 px-4 py-3 text-sm font-text">
                                <h3 className="font-semibold text-mist-950">Deliver to</h3>
                                <p className="text-mist-700">{open.customer.name}, {open.customer.phone}</p>
                                <p className="text-mist-700">{[open.customer.street, open.customer.city, open.customer.state].filter(Boolean).join(", ")}</p>
                            </section>
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
