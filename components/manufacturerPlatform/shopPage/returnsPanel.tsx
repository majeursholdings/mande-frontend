"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ImageOff } from "lucide-react";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef } from "@/components/customTable";
import ReturnActionForm, { type ReturnAction } from "@/components/manufacturerPlatform/form/returnActionForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { RETURN_REASON_LABELS, RETURN_STATUS_FILTER_ITEMS, RETURN_STATUS_LABELS, RETURN_STATUS_TONES, type ReturnStatus } from "@/constant/shop";
import { formatPrice, fromKobo } from "@/lib/currency";
import type { ReturnsApi, ShopReturnRow } from "@/lib/services/shopService";

const PAGE_SIZE = 10;
const naira = (kobo: number) => formatPrice(fromKobo(kobo));

// ─────────────────────────────────────────────────────────────────────────────
// ReturnsPanel: customers sending things back (SHOP_IMPLEMENTATION.md 6.4),
// newest first, with the status filter and page in the URL. For a
// manufacturer (their own), staff (MANDE stock) and super admins (every
// seller's, to step in). Opening one shows what's coming back, why, the
// customer's photos and what's happened so far, and the next step:
// approve with how to send it back, don't accept (with why), or refund once
// it's back. The customer pays to send it back; a change of mind is refunded
// as store credit without the delivery, a problem with it.
// ─────────────────────────────────────────────────────────────────────────────

export default function ReturnsPanel({
    tableId,
    api,
    queryKey,
    showSeller = false,
}: {
    tableId: string;
    api: ReturnsApi;
    queryKey: (filters: Record<string, unknown>) => readonly unknown[];
    /** Every seller's returns (super admins): name the seller on each. */
    showSeller?: boolean;
}) {
    const searchParams = useSearchParams();
    const [open, setOpen] = useState<ShopReturnRow | null>(null);
    const page = Math.max(1, Number(searchParams.get(`${tableId}_page`) ?? 1) || 1);
    const statusParam = searchParams.get(`${tableId}_status`);
    const status = RETURN_STATUS_FILTER_ITEMS.some((item) => item.value === statusParam) ? (statusParam as ReturnStatus | "open") : undefined;

    const query = useQuery({
        queryKey: queryKey({ page, status: status ?? null }),
        queryFn: () => api.listReturns({ page, limit: PAGE_SIZE, status }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    const columns: ColumnDef<ShopReturnRow>[] = [
        { key: "code", header: "Return", cell: (entry) => <span className="font-medium text-mist-950">{entry.code}</span> },
        { key: "order", header: "Order", cell: (entry) => entry.orderCode },
        ...(showSeller ? [{ key: "seller", header: "Seller", cell: (entry: ShopReturnRow) => entry.seller.name }] : []),
        {
            key: "items",
            header: "Items",
            cell: (entry) => <span className="line-clamp-1 max-w-64 text-mist-700">{entry.lines.map((line) => `${line.quantity} × ${line.title}`).join(", ")}</span>,
        },
        { key: "reason", header: "Why", cell: (entry) => RETURN_REASON_LABELS[entry.reason] },
        { key: "refund", header: "Refund", cell: (entry) => <span className="whitespace-nowrap">{naira(entry.amountKobo)}</span> },
        { key: "date", header: "Asked", cell: (entry) => <span className="whitespace-nowrap">{dayjs(entry.createdAt).format("D MMM YYYY")}</span> },
        { key: "status", header: "Status", cell: (entry) => <StatusBadge label={RETURN_STATUS_LABELS[entry.status]} tone={RETURN_STATUS_TONES[entry.status]} variant="pill" /> },
    ];

    return (
        <div className="flex flex-col gap-3">
            {query.data && query.data.waiting > 0 && (
                <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 font-text">
                    {query.data.waiting === 1 ? "1 return needs" : `${query.data.waiting} returns need`} you: answer new requests within 2 working days, and refund what&apos;s come back.
                </p>
            )}
            <DataTable
                tableId={tableId}
                columns={columns}
                rows={query.data?.returns ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the returns. Please refresh the page." : undefined}
                emptyMessage={status ? "No returns match." : "No returns yet. Customers can ask within 7 days of delivery."}
                onRowClick={setOpen}
                rowActions={[{ label: "View", onSelect: setOpen }]}
                toolbar={<TableToolbar filters={[{ title: "All returns", paramKey: "status", items: RETURN_STATUS_FILTER_ITEMS }]} />}
            />
            {open && (
                <ReturnDialog
                    key={`${open.code}-${open.status}`}
                    entry={open}
                    api={api}
                    onClose={() => setOpen(null)}
                    onChanged={(updated) => {
                        setOpen(updated);
                        void query.refetch();
                    }}
                />
            )}
        </div>
    );
}

function ReturnDialog({ entry, api, onClose, onChanged }: { entry: ShopReturnRow; api: ReturnsApi; onClose: () => void; onChanged: (updated: ShopReturnRow) => void }) {
    const [action, setAction] = useState<ReturnAction | null>(null);
    const delivery = entry.lines.reduce((sum, line) => sum + line.deliveryRefundKobo, 0);

    return (
        <Dialog open onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-140 overflow-y-auto">
                <div className="flex flex-col gap-1">
                    <DialogTitle>Return {entry.code}</DialogTitle>
                    <DialogDescription>
                        Order {entry.orderCode}
                        {entry.seller.kind === "manufacturer" ? `, from ${entry.seller.name}` : ""}, asked {dayjs(entry.createdAt).format("D MMMM YYYY")}
                    </DialogDescription>
                </div>
                <div className="flex flex-col gap-4 text-sm font-text">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={RETURN_STATUS_LABELS[entry.status]} tone={RETURN_STATUS_TONES[entry.status]} variant="pill" />
                        <span className="text-mist-700">{RETURN_REASON_LABELS[entry.reason]}</span>
                    </div>

                    <ul className="flex flex-col gap-2">
                        {entry.lines.map((line) => (
                            <li key={line.lineId} className="flex items-center gap-3">
                                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-mist-100">
                                    {line.image ? (
                                        <Image src={line.image.url} alt="" fill sizes="48px" className="object-cover" />
                                    ) : (
                                        <span className="flex h-full items-center justify-center text-mist-400">
                                            <ImageOff className="size-4" aria-hidden />
                                        </span>
                                    )}
                                </div>
                                <span className="flex-1 text-mist-900">
                                    {line.quantity} × {line.title}
                                </span>
                                <span className="text-mist-700">{naira(line.unitPriceKobo * line.quantity)}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="rounded-lg bg-mist-50 px-3 py-2 text-mist-700">
                        Refund: <span className="font-semibold text-mist-950">{naira(entry.amountKobo)}</span> {entry.refundMethod === "credit" ? "as store credit" : "to their card"}
                        {delivery > 0 ? `, including ${naira(delivery)} delivery` : ""}. The customer pays to send it back.
                    </p>

                    {entry.details && (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-mist-950">What they said</span>
                            <p className="whitespace-pre-line text-mist-800">{entry.details}</p>
                        </div>
                    )}
                    {entry.photos.length > 0 && (
                        <ul className="flex flex-wrap gap-2">
                            {entry.photos.map((photo, index) => (
                                <li key={photo.url}>
                                    <a href={photo.url} target="_blank" rel="noreferrer" className="relative block size-20 overflow-hidden rounded-lg bg-mist-100">
                                        {/* Signed, short-lived links: plain <img>, not the image optimiser */}
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={photo.url} alt={`Photo ${index + 1}`} className="size-full object-cover" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="flex flex-col gap-1">
                        <span className="font-semibold text-mist-950">Customer</span>
                        <span className="text-mist-700">
                            {entry.customer.name}, {entry.customer.phone}
                        </span>
                    </div>
                    {entry.instructions && (
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-mist-950">How to send it back</span>
                            <p className="whitespace-pre-line text-mist-700">{entry.instructions}</p>
                            {entry.sendBackBy && entry.status === "approved" && <span className="text-mist-500">To be sent by {dayjs(entry.sendBackBy).format("D MMMM YYYY")}</span>}
                        </div>
                    )}
                    {entry.sentNote && <p className="text-mist-700">Their note on sending it: &quot;{entry.sentNote}&quot;</p>}
                    {entry.rejectReason && <p className="rounded-lg bg-secondary-50 px-3 py-2 text-secondary-700">Not accepted: {entry.rejectReason}</p>}

                    <ol className="flex flex-col gap-1 border-t border-border pt-3 text-xs text-mist-500">
                        {entry.history.map((event) => (
                            <li key={`${event.status}-${event.at}`}>
                                {dayjs(event.at).format("D MMM YYYY, h:mma")}: {RETURN_STATUS_LABELS[event.status]} ({event.byName})
                            </li>
                        ))}
                    </ol>

                    {action ? (
                        <ReturnActionForm
                            entry={entry}
                            action={action}
                            api={api}
                            onCancel={() => setAction(null)}
                            onDone={(updated) => {
                                setAction(null);
                                onChanged(updated);
                            }}
                        />
                    ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button type="button" variant="outline" onClick={onClose} className="h-9 rounded-button">
                                Close
                            </Button>
                            {entry.canReject && (
                                <Button type="button" variant="outline" onClick={() => setAction("reject")} className="h-9 rounded-button text-secondary-700">
                                    Don&apos;t accept
                                </Button>
                            )}
                            {entry.canApprove && (
                                <Button type="button" onClick={() => setAction("approve")} className="h-9 rounded-button bg-secondary-700 text-white hover:bg-secondary-900">
                                    Approve
                                </Button>
                            )}
                            {entry.canRefund && (
                                <Button type="button" onClick={() => setAction("refund")} className="h-9 rounded-button bg-secondary-700 text-white hover:bg-secondary-900">
                                    It&apos;s back: refund
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
