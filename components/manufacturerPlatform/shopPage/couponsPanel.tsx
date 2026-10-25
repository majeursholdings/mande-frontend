"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { DataTable, StatusBadge, TableToolbar, ToolbarActionButton, type ColumnDef, type StatusTone } from "@/components/customTable";
import ShopCouponForm from "@/components/manufacturerPlatform/form/shopCouponForm";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatPrice, fromKobo } from "@/lib/currency";
import { getErrorMessage } from "@/lib/api";
import type { SellerShopApi, ShopCoupon } from "@/lib/services/shopService";

const PAGE_SIZE = 10;
const naira = (kobo: number) => formatPrice(fromKobo(kobo));

// ─────────────────────────────────────────────────────────────────────────────
// CouponsPanel: a seller's coupons on MANDE Shop (SHOP_IMPLEMENTATION.md 5.8),
// a page at a time: each code, its discount, what it covers, its uses and
// dates, and whether customers can use it now. Making one, and switching one
// on or off, within the plan's limit of active coupons (MANDE stock has
// none). A plan without coupons shows an upgrade prompt instead. The seller
// pays for the discount: it comes off their part of the order.
// ─────────────────────────────────────────────────────────────────────────────

function statusOf(coupon: ShopCoupon): { label: string; tone: StatusTone } {
    if (!coupon.active) {
        if (coupon.pausedReason === "plan") return { label: "Off: over your plan's limit", tone: "amber" };
        if (coupon.pausedReason === "selling") return { label: "Off: you can't sell right now", tone: "amber" };
        return { label: "Off", tone: "gray" };
    }
    if (coupon.live) return { label: "Live", tone: "green" };
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) return { label: "Scheduled", tone: "blue" };
    if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) return { label: "Ended", tone: "gray" };
    return { label: "Used up", tone: "gray" };
}

export default function CouponsPanel({
    tableId,
    api,
    queryKey,
    planHref,
}: {
    tableId: string;
    api: SellerShopApi;
    queryKey: (filters: Record<string, unknown>) => readonly unknown[];
    /** Where to upgrade their plan (manufacturers); none for MANDE stock. */
    planHref?: string;
}) {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const [isCreating, setIsCreating] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const page = Math.max(1, Number(searchParams.get(`${tableId}_page`) ?? 1) || 1);

    const query = useQuery({
        queryKey: queryKey({ page }),
        queryFn: () => api.listCoupons({ page, limit: PAGE_SIZE }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });
    // Their products, to limit a coupon to some of them
    const products = useQuery({
        queryKey: [...queryKey({ products: true })],
        queryFn: () => api.listProducts({ page: 1, limit: 100 }),
        enabled: isCreating,
        staleTime: 60_000,
    });

    const standing = query.data?.standing;
    const atLimit = !!standing && standing.maxCoupons !== null && standing.activeCoupons >= standing.maxCoupons;
    const noCoupons = standing?.maxCoupons === 0;
    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKey({}).slice(0, -1) });

    const toggle = async (coupon: ShopCoupon) => {
        setBusyId(coupon.id);
        try {
            await api.updateCoupon(coupon.id, { active: !coupon.active });
            await refresh();
            toast.success(coupon.active ? `${coupon.code} is off` : `${coupon.code} is on`);
        } catch (error) {
            toast.error(getErrorMessage(error, "Couldn't change the coupon. Please try again."));
        } finally {
            setBusyId(null);
        }
    };

    const columns: ColumnDef<ShopCoupon>[] = [
        {
            key: "code",
            header: "Code",
            cell: (coupon) => (
                <span className="flex flex-col">
                    <span className="font-medium text-mist-950">{coupon.code}</span>
                    {coupon.description && <span className="max-w-56 truncate text-xs text-mist-500">{coupon.description}</span>}
                </span>
            ),
        },
        {
            key: "discount",
            header: "Discount",
            cell: (coupon) => (
                <span className="flex flex-col">
                    <span className="whitespace-nowrap text-mist-950">{coupon.type === "percentage" ? `${coupon.value}% off` : `${naira(coupon.value)} off`}</span>
                    <span className="text-xs text-mist-500">
                        {coupon.productIds.length === 0 ? "All products" : `${coupon.productIds.length} ${coupon.productIds.length === 1 ? "product" : "products"}`}
                        {coupon.minSubtotalKobo > 0 ? `, ${naira(coupon.minSubtotalKobo)} minimum` : ""}
                    </span>
                </span>
            ),
        },
        { key: "uses", header: "Uses", cell: (coupon) => <span className="whitespace-nowrap text-mist-950">{coupon.maxUses ? `${coupon.usedCount} of ${coupon.maxUses}` : coupon.usedCount}</span> },
        {
            key: "dates",
            header: "Dates",
            cell: (coupon) => (
                <span className="whitespace-nowrap text-sm text-mist-700">
                    {coupon.startsAt ? dayjs(coupon.startsAt).format("D MMM YYYY") : "Now"} to {coupon.expiresAt ? dayjs(coupon.expiresAt).format("D MMM YYYY") : "no end"}
                </span>
            ),
        },
        { key: "status", header: "Status", cell: (coupon) => <StatusBadge label={statusOf(coupon).label} tone={statusOf(coupon).tone} variant="pill" /> },
    ];

    return (
        <div className="flex flex-col gap-4">
            {noCoupons && (
                <div className="flex flex-col gap-1 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm font-text">
                    <p className="font-semibold text-mist-950">Your plan doesn&apos;t include coupons</p>
                    <p className="text-mist-700">
                        Upgrade to make coupons for your products.{" "}
                        {planHref && (
                            <Link href={planHref} className="font-medium text-primary-700 underline-offset-2 hover:underline">
                                See plans
                            </Link>
                        )}
                    </p>
                </div>
            )}
            <DataTable
                tableId={tableId}
                columns={columns}
                rows={query.data?.coupons ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load your coupons. Please refresh the page." : undefined}
                emptyMessage="No coupons yet. Make one to give customers money off your products."
                rowActions={[
                    { label: "Switch off", onSelect: (coupon) => void toggle(coupon), hidden: (coupon) => !coupon.active, disabledReason: (coupon) => (busyId === coupon.id ? "Saving..." : null) },
                    {
                        label: "Switch on",
                        onSelect: (coupon) => void toggle(coupon),
                        hidden: (coupon) => coupon.active,
                        disabledReason: (coupon) => (busyId === coupon.id ? "Saving..." : atLimit ? "You're at your plan's limit of active coupons" : null),
                    },
                ]}
                toolbar={
                    <TableToolbar
                        actions={
                            <>
                                {standing && standing.maxCoupons !== null && (
                                    <span className="self-center whitespace-nowrap text-sm font-text text-mist-500">
                                        {standing.activeCoupons} of {standing.maxCoupons} active
                                    </span>
                                )}
                                <span title={atLimit ? "Switch one off, or upgrade your plan, to make another" : undefined}>
                                    <ToolbarActionButton label="New coupon" onClick={() => setIsCreating(true)} disabled={!standing || atLimit || !standing.canCreate} />
                                </span>
                            </>
                        }
                    />
                }
            />

            <Dialog open={isCreating} onOpenChange={(open) => !open && setIsCreating(false)}>
                <DialogContent className="max-w-160">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>New coupon</DialogTitle>
                        <DialogDescription>You pay for the discount: it comes off your share of the order, and MANDE&apos;s charge is worked out on what&apos;s left.</DialogDescription>
                    </div>
                    {isCreating && (
                        <ShopCouponForm
                            products={(products.data?.products ?? []).map((product) => ({ id: product.id, title: product.title }))}
                            onCancel={() => setIsCreating(false)}
                            onCreate={async (payload) => {
                                const coupon = await api.createCoupon(payload);
                                await refresh();
                                toast.success(`${coupon.code} is ready`);
                                setIsCreating(false);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
