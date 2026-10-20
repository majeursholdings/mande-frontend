"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef } from "@/components/customTable";
import ReviewStars from "@/components/manufacturerPlatform/shopPage/reviewStars";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { shopAdminService, type ShopReviewRow } from "@/lib/services/shopService";
import ShopReasonForm from "../form/shopReasonForm";

const TABLE_ID = "all-reviews";
const PAGE_SIZE = 10;
const SHOW_ITEMS = [
    { value: "reported", label: "Reported by the seller" },
    { value: "published", label: "Showing" },
    { value: "hidden", label: "Hidden" },
];

const COLUMNS: ColumnDef<ShopReviewRow>[] = [
    { key: "rating", header: "Rating", cell: (review) => <ReviewStars rating={review.rating} /> },
    {
        key: "about",
        header: "About",
        cell: (review) => (
            <span className="flex flex-col">
                <span className="max-w-56 truncate font-medium text-mist-950">{review.kind === "product" ? (review.product?.title ?? "A product") : "The seller"}</span>
                <span className="max-w-56 truncate text-xs text-mist-500">{review.seller?.name}</span>
            </span>
        ),
    },
    { key: "review", header: "Review", cell: (review) => <span className="line-clamp-1 max-w-72 text-mist-600">{review.body || "Stars only"}</span> },
    { key: "date", header: "Date", cell: (review) => <span className="whitespace-nowrap">{dayjs(review.createdAt).format("D MMM YYYY")}</span> },
    {
        key: "state",
        header: "",
        cell: (review) =>
            review.sellerReport?.status === "open" ? (
                <StatusBadge label="Reported" tone="red" variant="pill" />
            ) : review.status === "hidden" ? (
                <StatusBadge label="Hidden" tone="gray" variant="pill" />
            ) : (
                <StatusBadge label="Showing" tone="green" variant="pill" />
            ),
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// AllReviewsTab (super admins): every review on the shop, the ones a seller
// reported first. Reviews go up straight away, so this is where an abusive
// or false one is taken down: hidden with a reason (its author sees it; the
// rating no longer counts it), restored later if need be, or a report
// closed with the review kept showing.
// ─────────────────────────────────────────────────────────────────────────────

export default function AllReviewsTab() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState<ShopReviewRow | null>(null);
    const [hiding, setHiding] = useState(false);
    const [busy, setBusy] = useState(false);

    const page = Math.max(1, Number(searchParams.get(`${TABLE_ID}_page`) ?? 1) || 1);
    const show = searchParams.get(`${TABLE_ID}_show`) ?? "";
    const filters = { reported: show === "reported", status: show === "published" || show === "hidden" ? (show as "published" | "hidden") : undefined };

    const query = useQuery({
        queryKey: queryKeys.shop.allReviews({ page, show }),
        queryFn: () => shopAdminService.listAllReviews({ page, limit: PAGE_SIZE, ...filters }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    const done = async (message: string) => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.shop.allReviews().slice(0, -1) });
        toast.success(message);
        setOpen(null);
        setHiding(false);
    };

    const act = async (work: () => Promise<void>, message: string) => {
        setBusy(true);
        try {
            await work();
            await done(message);
        } catch (error) {
            toast.error(getErrorMessage(error, "That didn't work. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-col">
            <DataTable
                tableId={TABLE_ID}
                columns={COLUMNS}
                rows={query.data?.reviews ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the reviews. Please refresh the page." : undefined}
                emptyMessage={show ? "No reviews here." : "No reviews yet."}
                onRowClick={setOpen}
                rowActions={[{ label: "View", onSelect: setOpen }]}
                toolbar={<TableToolbar filters={[{ title: "All reviews", paramKey: "show", items: SHOW_ITEMS }]} />}
            />

            <Dialog open={!!open} onOpenChange={(next) => !next && (setOpen(null), setHiding(false))}>
                <DialogContent className="max-w-130">
                    {open && (
                        <>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>{open.kind === "product" ? (open.product?.title ?? "Product review") : `A review of ${open.seller?.name ?? "the seller"}`}</DialogTitle>
                                <DialogDescription>
                                    {open.author}, {dayjs(open.createdAt).format("D MMMM YYYY")}
                                    {open.orderCode ? `, order ${open.orderCode}` : ""}
                                </DialogDescription>
                            </div>
                            {hiding ? (
                                <ShopReasonForm
                                    label="Why it's hidden"
                                    placeholder="e.g. It names a delivery driver"
                                    description="The customer who wrote it sees this."
                                    submitLabel="Hide review"
                                    onCancel={() => setHiding(false)}
                                    onSubmit={async (reason) => {
                                        await shopAdminService.hideReview(open.id, reason);
                                        await done("Review hidden");
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col gap-4 text-sm font-text">
                                    <ReviewStars rating={open.rating} className="[&_svg]:size-5" />
                                    <p className="whitespace-pre-line text-mist-800">{open.body || "Stars without words."}</p>
                                    {open.reply && (
                                        <p className="rounded-lg border border-border px-3 py-2 text-mist-700">
                                            <span className="font-semibold">The seller replied: </span>
                                            {open.reply.body}
                                        </p>
                                    )}
                                    {open.sellerReport && (
                                        <p className="rounded-lg bg-warning-50 px-3 py-2 text-mist-700">
                                            The seller reported it ({open.sellerReport.status === "open" ? "waiting" : "closed"}): {open.sellerReport.reason}
                                        </p>
                                    )}
                                    {open.status === "hidden" && <p className="rounded-lg bg-mist-50 px-3 py-2 text-mist-700">Hidden: {open.hiddenReason}</p>}
                                    <div className="flex flex-wrap justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setOpen(null)} className="h-9 rounded-button">
                                            Close
                                        </Button>
                                        {open.status === "published" && open.sellerReport?.status === "open" && (
                                            <Button type="button" variant="outline" disabled={busy} onClick={() => act(() => shopAdminService.keepReview(open.id), "Report closed: the review stays")} className="h-9 rounded-button">
                                                Keep it showing
                                            </Button>
                                        )}
                                        {open.status === "published" ? (
                                            <Button type="button" onClick={() => setHiding(true)} className="h-9 rounded-button bg-secondary-700 text-white hover:bg-secondary-900">
                                                Hide review
                                            </Button>
                                        ) : (
                                            <Button type="button" disabled={busy} onClick={() => act(() => shopAdminService.restoreReview(open.id), "Review restored")} className="h-9 rounded-button bg-secondary-700 text-white hover:bg-secondary-900">
                                                Restore
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
