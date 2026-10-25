"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { DataTable, StatusBadge, TableToolbar, ToolbarActionButton, type ColumnDef, type StatusTone } from "@/components/customTable";
import ShopCouponForm from "@/components/manufacturerPlatform/form/shopCouponForm";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";
import { formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { customerService, type AffiliateCost } from "@/lib/services/customerService";
import type { ShopCoupon } from "@/lib/services/shopService";

const PAGE_SIZE = 10;
const naira = (kobo: number) => formatPrice(fromKobo(kobo));

// ─────────────────────────────────────────────────────────────────────────────
// A customer's personal coupons (SHOP_IMPLEMENTATION.md 5.7), for super
// admins. A buyer who types one gets its discount on MANDE stock in the
// affiliate system, and the customer earns the coupon reward. MANDE pays for
// both, so the form warns when one sale at the lowest "sales to reach" would
// cost more than the warning line. Switch one off to stop it.
// ─────────────────────────────────────────────────────────────────────────────

function statusOf(coupon: ShopCoupon): { label: string; tone: StatusTone } {
    if (!coupon.active) return { label: "Off", tone: "gray" };
    if (coupon.live) return { label: "Live", tone: "green" };
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) return { label: "Scheduled", tone: "blue" };
    if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) return { label: "Ended", tone: "gray" };
    return { label: "Used up", tone: "gray" };
}

/** The warning under the discount: the reward per sale plus a percentage discount, against the line. */
function costWarning(cost: AffiliateCost | undefined, type: "percentage" | "fixed", value: number): string | null {
    if (!cost || cost.couponPerSalePercent === null || cost.lowestSalesToReach === null) return null;
    const reward = `${cost.couponPerSalePercent}% reward per sale (at ${cost.lowestSalesToReach} sales to reach, on "${cost.product?.title}")`;
    // A fixed discount's share depends on the price, so only the reward is checked against the line
    if (type === "fixed") {
        return cost.couponPerSalePercent > cost.warnAbovePercent ? `One sale could cost MANDE the ${reward}, plus ${naira(value)} off. That's over ${cost.warnAbovePercent}% before the discount.` : null;
    }
    const total = Math.round((cost.couponPerSalePercent + value) * 10) / 10;
    return total > cost.warnAbovePercent ? `One sale could cost MANDE ${total}% of the price: the ${reward} plus ${value}% off. That's over ${cost.warnAbovePercent}%.` : null;
}

export default function CustomerCoupons({ customerId, customerName }: { customerId: string; customerName: string }) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const query = useQuery({
        queryKey: queryKeys.customers.coupons(customerId, page),
        queryFn: () => customerService.listCoupons(customerId, { page, limit: PAGE_SIZE }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });
    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.coupons(customerId, page).slice(0, -1) });

    const toggle = async (coupon: ShopCoupon) => {
        setBusyId(coupon.id);
        try {
            await customerService.updateCoupon(customerId, coupon.id, { active: !coupon.active });
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
        { key: "discount", header: "Buyer gets", cell: (coupon) => <span className="whitespace-nowrap text-mist-950">{coupon.type === "percentage" ? `${coupon.value}% off` : `${naira(coupon.value)} off`}</span> },
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
            <DataTable
                tableId="customer-coupons"
                columns={columns}
                rows={query.data?.coupons ?? []}
                page={page}
                onPageChange={setPage}
                pagination={{ total: query.data?.total ?? 0, totalPages: query.data?.totalPages || 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load their coupons. Please refresh the page." : undefined}
                emptyMessage="No personal coupons yet. Make one for an influencer or a loyal buyer to share."
                rowActions={[
                    { label: "Switch off", onSelect: (coupon) => void toggle(coupon), hidden: (coupon) => !coupon.active, disabledReason: (coupon) => (busyId === coupon.id ? "Saving..." : null) },
                    { label: "Switch on", onSelect: (coupon) => void toggle(coupon), hidden: (coupon) => coupon.active, disabledReason: (coupon) => (busyId === coupon.id ? "Saving..." : null) },
                ]}
                toolbar={<TableToolbar actions={<ToolbarActionButton label="New coupon" onClick={() => setIsCreating(true)} />} />}
            />

            <Dialog open={isCreating} onOpenChange={(open) => !open && setIsCreating(false)}>
                <DialogContent className="max-w-160">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>New personal coupon for {customerName}</DialogTitle>
                        <DialogDescription>
                            Buyers who type it get the discount on MANDE products in the affiliate program, and {customerName} earns store credit. MANDE pays for both.
                        </DialogDescription>
                    </div>
                    {isCreating && (
                        <ShopCouponForm
                            products={[]}
                            withCoverage={false}
                            noteDescription="For staff. The customer doesn't see it."
                            warningFor={(type, value) => costWarning(query.data?.cost, type, value)}
                            onCancel={() => setIsCreating(false)}
                            onCreate={async (payload) => {
                                const { code, type, value, startsAt, expiresAt, maxUses, maxUsesPerCustomer, description } = payload;
                                const made = await customerService.createCoupon(customerId, { code, type, value, startsAt, expiresAt, maxUses, maxUsesPerCustomer, description });
                                await refresh();
                                toast.success(`${made.coupon.code} is ready`);
                                setIsCreating(false);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
