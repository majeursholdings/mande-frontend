"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef } from "@/components/customTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";
import type { SellerShopApi, ShopReviewRow } from "@/lib/services/shopService";
import ReviewStars from "./reviewStars";

const PAGE_SIZE = 10;

const KIND_ITEMS = [
    { value: "product", label: "Product reviews" },
    { value: "seller", label: "Reviews of you" },
];
const STAR_ITEMS = [5, 4, 3, 2, 1].map((stars) => ({ value: String(stars), label: `${stars} star` }));

// ─────────────────────────────────────────────────────────────────────────────
// ReviewsPanel: what customers say about a seller and their products, newest
// first (filters and page in the URL), for a manufacturer and for staff on
// MANDE stock. Opening one shows it in full; the seller replies once (the
// reply shows under the review on the shop, and can be changed), and a
// manufacturer can ask MANDE to look at a review they think is unfair.
// ─────────────────────────────────────────────────────────────────────────────

export default function ReviewsPanel({
    tableId,
    api,
    queryKey,
    onReport,
}: {
    tableId: string;
    api: Pick<SellerShopApi, "listReviews" | "replyToReview">;
    queryKey: (filters: Record<string, unknown>) => readonly unknown[];
    /** Reporting a review to MANDE: a manufacturer's. Staff (MANDE stock) don't report their own. */
    onReport?: (id: string, reason: string) => Promise<ShopReviewRow>;
}) {
    const searchParams = useSearchParams();
    const [open, setOpen] = useState<ShopReviewRow | null>(null);
    const page = Math.max(1, Number(searchParams.get(`${tableId}_page`) ?? 1) || 1);
    const kindParam = searchParams.get(`${tableId}_kind`);
    const kind = kindParam === "product" || kindParam === "seller" ? kindParam : undefined;
    const starsParam = Number(searchParams.get(`${tableId}_stars`));
    const stars = Number.isInteger(starsParam) && starsParam >= 1 && starsParam <= 5 ? starsParam : undefined;

    const query = useQuery({
        queryKey: queryKey({ page, kind: kind ?? null, stars: stars ?? null }),
        queryFn: () => api.listReviews({ page, limit: PAGE_SIZE, kind, stars }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    const columns: ColumnDef<ShopReviewRow>[] = [
        { key: "rating", header: "Rating", cell: (review) => <ReviewStars rating={review.rating} /> },
        {
            key: "about",
            header: "About",
            cell: (review) => <span className="max-w-56 truncate font-medium text-mist-950">{review.kind === "product" ? (review.product?.title ?? "A product") : "You, as a seller"}</span>,
        },
        { key: "review", header: "Review", cell: (review) => <span className="line-clamp-1 max-w-72 text-mist-600">{review.body || "Stars only"}</span> },
        { key: "by", header: "By", cell: (review) => review.author },
        { key: "date", header: "Date", cell: (review) => <span className="whitespace-nowrap">{dayjs(review.createdAt).format("D MMM YYYY")}</span> },
        {
            key: "state",
            header: "",
            cell: (review) =>
                review.status === "hidden" ? (
                    <StatusBadge label="Hidden by MANDE" tone="gray" variant="pill" />
                ) : review.reply ? (
                    <StatusBadge label="Replied" tone="green" variant="pill" />
                ) : (
                    <StatusBadge label="No reply" tone="amber" variant="pill" />
                ),
        },
    ];

    return (
        <div className="flex flex-col">
            <DataTable
                tableId={tableId}
                columns={columns}
                rows={query.data?.reviews ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the reviews. Please refresh the page." : undefined}
                emptyMessage={kind || stars ? "No reviews match." : "No reviews yet. Customers can review once their order is delivered."}
                onRowClick={setOpen}
                rowActions={[{ label: "View", onSelect: setOpen }]}
                toolbar={
                    <TableToolbar
                        filters={[
                            { title: "All reviews", paramKey: "kind", items: KIND_ITEMS },
                            { title: "Any rating", paramKey: "stars", items: STAR_ITEMS },
                        ]}
                    />
                }
            />
            {open && (
                <ReviewDialog
                    key={open.id}
                    review={open}
                    onClose={() => setOpen(null)}
                    onReply={async (body) => {
                        const updated = await api.replyToReview(open.id, body);
                        setOpen(updated);
                        void query.refetch();
                    }}
                    onReport={
                        onReport
                            ? async (reason) => {
                                  setOpen(await onReport(open.id, reason));
                                  void query.refetch();
                              }
                            : undefined
                    }
                />
            )}
        </div>
    );
}

function ReviewDialog({
    review,
    onClose,
    onReply,
    onReport,
}: {
    review: ShopReviewRow;
    onClose: () => void;
    onReply: (body: string) => Promise<void>;
    onReport?: (reason: string) => Promise<void>;
}) {
    const [mode, setMode] = useState<"view" | "reply" | "report">("view");
    const [text, setText] = useState(review.reply?.body ?? "");
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        const value = text.trim();
        if (value.length < (mode === "report" ? 5 : 2)) {
            toast.error(mode === "report" ? "Say what's wrong with the review." : "Write your reply.");
            return;
        }
        setBusy(true);
        try {
            if (mode === "reply") {
                await onReply(value);
                toast.success("Reply saved. It shows under the review on the shop.");
            } else if (onReport) {
                await onReport(value);
                toast.success("Reported. MANDE will look into it.");
            }
            setMode("view");
        } catch (error) {
            toast.error(getErrorMessage(error, "That didn't save. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-w-130">
                <div className="flex flex-col gap-1">
                    <DialogTitle>{review.kind === "product" ? (review.product?.title ?? "Product review") : "A review of you"}</DialogTitle>
                    <DialogDescription>
                        {review.author}, {dayjs(review.createdAt).format("D MMMM YYYY")}
                        {review.orderCode ? `, order ${review.orderCode}` : ""}
                        {review.editedAt ? " (edited)" : ""}
                    </DialogDescription>
                </div>
                <div className="flex flex-col gap-4 text-sm font-text">
                    <ReviewStars rating={review.rating} className="[&_svg]:size-5" />
                    <p className="whitespace-pre-line text-mist-800">{review.body || "They gave stars without words."}</p>
                    {review.images.length > 0 && (
                        <ul className="flex flex-wrap gap-2">
                            {review.images.map((image, index) => (
                                <li key={image.url} className="relative size-20 overflow-hidden rounded-lg bg-mist-100">
                                    <Image src={image.url} alt={`Photo ${index + 1}`} fill sizes="80px" className="object-cover" />
                                </li>
                            ))}
                        </ul>
                    )}
                    {review.status === "hidden" && <p className="rounded-lg bg-mist-50 px-3 py-2 text-mist-700">Hidden by MANDE: {review.hiddenReason}</p>}
                    {review.sellerReport && (
                        <p className="rounded-lg bg-warning-50 px-3 py-2 text-mist-700">
                            You reported this on {dayjs(review.sellerReport.at).format("D MMM YYYY")}: {review.sellerReport.reason}
                            {review.sellerReport.status === "closed" ? " MANDE has looked into it." : " MANDE is looking into it."}
                        </p>
                    )}
                    {mode === "view" && review.reply && (
                        <div className="rounded-lg border border-border px-3 py-2">
                            <p className="text-xs font-semibold text-mist-500">Your reply</p>
                            <p className="whitespace-pre-line text-mist-800">{review.reply.body}</p>
                        </div>
                    )}
                    {mode !== "view" ? (
                        <div className="flex flex-col gap-2">
                            <label htmlFor="review-response" className="font-semibold text-mist-950">
                                {mode === "reply" ? "Your reply (shown on the shop)" : "What's wrong with this review?"}
                            </label>
                            <textarea
                                id="review-response"
                                value={text}
                                onChange={(event) => setText(event.target.value.slice(0, mode === "reply" ? 1000 : 500))}
                                rows={4}
                                placeholder={mode === "reply" ? "Thank them, or say how you've put it right." : "e.g. This customer never bought from us"}
                                className="w-full resize-y rounded-button border border-border px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-secondary-200"
                            />
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setMode("view")} disabled={busy} className="h-9 rounded-button">
                                    Back
                                </Button>
                                <Button type="button" onClick={submit} disabled={busy} className="h-9 rounded-button bg-secondary-700 text-white hover:bg-secondary-900">
                                    {busy ? "Saving..." : mode === "reply" ? "Save reply" : "Send to MANDE"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-end gap-2">
                            {onReport && !review.sellerReport && review.status === "published" && (
                                <Button type="button" variant="outline" onClick={() => { setText(""); setMode("report"); }} className="h-9 rounded-button text-mist-700">
                                    Report to MANDE
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={onClose} className="h-9 rounded-button">
                                Close
                            </Button>
                            <Button type="button" onClick={() => { setText(review.reply?.body ?? ""); setMode("reply"); }} className="h-9 rounded-button bg-secondary-700 text-white hover:bg-secondary-900">
                                {review.reply ? "Edit reply" : "Reply"}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
