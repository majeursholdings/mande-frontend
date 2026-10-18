"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dayjs from "dayjs";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef } from "@/components/customTable";
import { LoadError } from "@/components/adminPlatform/emptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SELLING_BLOCKER_MESSAGES } from "@/constant/shop";
import { queryKeys } from "@/lib/queryKeys";
import { shopAdminService, type ShopSellerRow } from "@/lib/services/shopService";
import ShopReasonForm from "../form/shopReasonForm";

const TABLE_ID = "shop-sellers";
const PAGE_SIZE = 10;

const ACCESS_ITEMS = [
    { value: "allowed", label: "Access allowed" },
    { value: "revoked", label: "Access revoked" },
];

const COLUMNS: ColumnDef<ShopSellerRow>[] = [
    {
        key: "name",
        header: "Store",
        cell: (seller) => (
            <span className="flex flex-col">
                <span className="max-w-56 truncate font-medium text-mist-950">{seller.name}</span>
                <span className="max-w-56 truncate text-xs text-mist-500">/s/{seller.slug}</span>
            </span>
        ),
    },
    {
        key: "access",
        header: "Shop access",
        cell: (seller) => (
            <StatusBadge label={seller.shopAccess.status === "allowed" ? "Allowed" : "Revoked"} tone={seller.shopAccess.status === "allowed" ? "green" : "red"} variant="pill" />
        ),
    },
    { key: "payout", header: "Payout account", cell: (seller) => (seller.payoutConnected ? "Connected" : <span className="text-mist-400">Not yet</span>) },
    { key: "products", header: "Products", cell: (seller) => <span className="whitespace-nowrap">{seller.products.listed} listed of {seller.products.total}</span> },
    {
        key: "rating",
        header: "Rating",
        cell: (seller) => (seller.rating.count > 0 ? `${seller.rating.average.toFixed(1)} (${seller.rating.count})` : <span className="text-mist-400">No reviews</span>),
    },
    { key: "since", header: "Selling since", cell: (seller) => <span className="whitespace-nowrap">{dayjs(seller.createdAt).format("D MMM YYYY")}</span> },
];

// ─────────────────────────────────────────────────────────────────────────────
// SellersTab: manufacturers selling on the shop, a page at a time. Opening
// one shows where they stand (what's stopping them selling), the history of
// their shop access, and revoking or restoring it with a reason: revoking
// takes their products off the shop and switches their Paystack payout off
// until a super admin restores it.
// ─────────────────────────────────────────────────────────────────────────────

export default function SellersTab() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const [openId, setOpenId] = useState<string | null>(null);
    const [isChanging, setIsChanging] = useState(false);

    const page = Math.max(1, Number(searchParams.get(`${TABLE_ID}_page`) ?? 1) || 1);
    const q = (searchParams.get(`${TABLE_ID}_search`) ?? "").trim();
    const accessParam = searchParams.get(`${TABLE_ID}_access`) ?? "";
    const access = accessParam === "allowed" || accessParam === "revoked" ? accessParam : undefined;

    const query = useQuery({
        queryKey: queryKeys.shop.sellers({ page, q, access: access ?? null }),
        queryFn: () => shopAdminService.listSellers({ page, limit: PAGE_SIZE, q: q || undefined, access }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    const detailQuery = useQuery({
        queryKey: queryKeys.shop.seller(openId ?? ""),
        queryFn: () => shopAdminService.getSeller(openId!),
        enabled: !!openId,
    });
    const detail = detailQuery.data;
    const revoked = detail?.seller.shopAccess.status === "revoked";

    const close = () => {
        setOpenId(null);
        setIsChanging(false);
    };

    return (
        <div className="flex flex-col">
            <DataTable
                tableId={TABLE_ID}
                columns={COLUMNS}
                rows={query.data?.sellers ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the sellers. Please refresh the page." : undefined}
                emptyMessage={q || access ? "No sellers match your search." : "No manufacturers have opened a store yet."}
                onRowClick={(seller) => setOpenId(seller.id)}
                rowActions={[{ label: "View", onSelect: (seller) => setOpenId(seller.id) }]}
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search store or manufacturer" }}
                        filters={[{ title: "Any access", paramKey: "access", items: ACCESS_ITEMS }]}
                    />
                }
            />

            <Dialog open={!!openId} onOpenChange={(open) => !open && close()}>
                <DialogContent className="max-w-130">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>{detail ? detail.seller.name : "Seller"}</DialogTitle>
                        <DialogDescription>
                            {detail ? `Store address /s/${detail.seller.slug}` : "Their store, where they stand, and their shop access."}
                        </DialogDescription>
                    </div>

                    {detailQuery.isError ? (
                        <LoadError message="We couldn't load this seller. Please try again." />
                    ) : !detail ? (
                        <div className="flex flex-col gap-3" aria-hidden>
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                    ) : isChanging ? (
                        <ShopReasonForm
                            label={revoked ? "Why access is back" : "Why access is revoked"}
                            placeholder={revoked ? "e.g. Deliveries are on time again" : "e.g. Repeated late deliveries"}
                            description="The manufacturer sees this."
                            submitLabel={revoked ? "Restore access" : "Revoke access"}
                            onCancel={() => setIsChanging(false)}
                            onSubmit={async (reason) => {
                                await shopAdminService.setSellerAccess(detail.seller.id, revoked ? "allowed" : "revoked", reason);
                                await queryClient.invalidateQueries({ queryKey: queryKeys.shop.all });
                                toast.success(revoked ? `${detail.seller.name}'s shop access is back on` : `${detail.seller.name}'s shop access is revoked`);
                                setIsChanging(false);
                            }}
                        />
                    ) : (
                        <div className="flex flex-col gap-5">
                            <section className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold font-text text-mist-950">Where they stand</h3>
                                {detail.standing.blockers.length === 0 ? (
                                    <p className="text-sm font-text text-primary-700">They can sell: nothing is stopping them.</p>
                                ) : (
                                    <ul className="flex list-disc flex-col gap-1 pl-5 text-sm font-text text-mist-700">
                                        {detail.standing.blockers.map((blocker) => (
                                            <li key={blocker}>{SELLING_BLOCKER_MESSAGES[blocker]}</li>
                                        ))}
                                    </ul>
                                )}
                                <p className="text-xs font-text text-mist-500">
                                    {detail.standing.productCount} products
                                    {detail.standing.maxProducts !== null ? ` of ${detail.standing.maxProducts} on their plan` : ""}.
                                    {detail.seller.payout ? ` Paid to ${detail.seller.payout.bankName} ending ${detail.seller.payout.accountNumberLast4}.` : " No payout account yet."}
                                </p>
                            </section>

                            <section className="flex flex-col gap-2">
                                <h3 className="text-sm font-semibold font-text text-mist-950">Shop access</h3>
                                {detail.seller.accessHistory.length === 0 ? (
                                    <p className="text-sm font-text text-mist-500">Allowed, never changed.</p>
                                ) : (
                                    <ol className="flex flex-col gap-2">
                                        {[...detail.seller.accessHistory].reverse().map((event) => (
                                            <li key={event.at} className="flex flex-col rounded-lg bg-mist-50 px-3.5 py-2.5 text-sm font-text">
                                                <span className="font-medium text-mist-950">
                                                    {event.status === "revoked" ? "Revoked" : "Restored"} by {event.byName}, {dayjs(event.at).format("D MMM YYYY")}
                                                </span>
                                                {event.reason && <span className="text-mist-600">{event.reason}</span>}
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </section>

                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    onClick={close}
                                    className="h-10 px-4 bg-mist-100 hover:bg-mist-200 text-mist-950 text-sm font-medium font-text rounded-button cursor-pointer"
                                >
                                    Close
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setIsChanging(true)}
                                    className="h-10 px-4 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer"
                                >
                                    {revoked ? "Restore access" : "Revoke access"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
