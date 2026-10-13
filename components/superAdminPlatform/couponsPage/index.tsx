"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DataTable, TableToolbar, ToolbarActionButton } from "@/components/customTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import AdminPageHeader from "@/components/adminPlatform/pageHeader";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { couponService, type Coupon, type CouponStatusFilter } from "@/lib/services/couponService";
import CouponForm from "../form/couponForm";
import { COUPON_COLUMNS, COUPON_STATUS_ITEMS } from "./couponParts";
import CouponRedemptionsDialog from "./couponRedemptions";

const TABLE_ID = "coupons";
const PAGE_SIZE = 20;

const PRIMARY_BUTTON_CLASS =
    "h-10 px-4 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer";
const SECONDARY_BUTTON_CLASS =
    "h-10 px-4 bg-mist-100 hover:bg-mist-200 text-mist-950 text-sm font-medium font-text rounded-button cursor-pointer";

// ─────────────────────────────────────────────────────────────────────────────
// CouponsPage: the codes super admins hand out for machine bookings,
// subscriptions or both. A coupon never stacks with a plan discount (the
// customer gets whichever saves more). Searched and filtered on the API,
// paged by date ("Show older coupons" loads the next page). Coupons are
// never deleted: deactivate one to stop it being used.
// ─────────────────────────────────────────────────────────────────────────────

export default function CouponsPage() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const [isCreating, setIsCreating] = useState(false);
    const [editing, setEditing] = useState<Coupon | null>(null);
    const [deactivating, setDeactivating] = useState<Coupon | null>(null);
    const [viewing, setViewing] = useState<Coupon | null>(null);
    const [isTogglingId, setIsTogglingId] = useState<string | null>(null);

    // The toolbar keeps its search and filter in the URL, under the table's id
    const q = (searchParams.get(`${TABLE_ID}_search`) ?? "").trim();
    const statusParam = searchParams.get(`${TABLE_ID}_status`) ?? "";
    const status = COUPON_STATUS_ITEMS.some((item) => item.value === statusParam)
        ? (statusParam as CouponStatusFilter)
        : undefined;

    const query = useInfiniteQuery({
        queryKey: queryKeys.coupons.list({ q, status: status ?? null }),
        queryFn: ({ pageParam }) =>
            couponService.listCoupons({ q: q || undefined, status, limit: PAGE_SIZE, before: pageParam ?? undefined }),
        initialPageParam: null as string | null,
        getNextPageParam: (last) => last.nextBefore,
        staleTime: 30_000,
    });

    const rows: Coupon[] = query.data?.pages.flatMap((page) => page.coupons) ?? [];
    const isFiltered = !!q || !!status;

    const refreshList = () => queryClient.invalidateQueries({ queryKey: [...queryKeys.coupons.all, "list"] });

    const setActive = async (coupon: Coupon, active: boolean) => {
        setIsTogglingId(coupon.id);
        try {
            await couponService.updateCoupon(coupon.id, { active });
            await refreshList();
            toast.success(active ? `${coupon.code} is active` : `${coupon.code} is deactivated`);
            setDeactivating(null);
        } catch (err) {
            toast.error(
                getErrorMessage(
                    err,
                    active ? "Couldn't activate the coupon. Please try again." : "Couldn't deactivate the coupon. Please try again.",
                ),
            );
        } finally {
            setIsTogglingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <AdminPageHeader
                title="Coupons"
                description="Codes customers enter for money off machine bookings, subscriptions or both. A coupon never adds to a plan discount: the customer gets whichever saves more."
            />

            <div className="flex flex-col">
                <DataTable
                    tableId={TABLE_ID}
                    columns={COUPON_COLUMNS}
                    rows={rows}
                    loading={query.isPending}
                    error={query.isError ? "We couldn't load the coupons. Please refresh the page." : undefined}
                    emptyMessage={
                        isFiltered ? "No coupons match your search." : "No coupons yet. Create one to give customers money off."
                    }
                    viewAction={{ type: "popup", onClick: setViewing }}
                    onRowClick={setViewing}
                    rowActions={[
                        { label: "Edit", onSelect: setEditing },
                        { label: "Who used it", onSelect: setViewing },
                        {
                            label: "Activate",
                            onSelect: (coupon) => void setActive(coupon, true),
                            hidden: (coupon) => coupon.active,
                            disabledReason: (coupon) => (isTogglingId === coupon.id ? "Saving..." : null),
                        },
                        {
                            label: "Deactivate",
                            tone: "danger",
                            onSelect: setDeactivating,
                            hidden: (coupon) => !coupon.active,
                        },
                    ]}
                    toolbar={
                        <TableToolbar
                            search={{ placeholder: "Search by code" }}
                            filters={[{ title: "All statuses", paramKey: "status", items: COUPON_STATUS_ITEMS }]}
                            actions={<ToolbarActionButton label="New coupon" onClick={() => setIsCreating(true)} />}
                        />
                    }
                />
                {query.hasNextPage && (
                    <button
                        type="button"
                        onClick={() => void query.fetchNextPage()}
                        disabled={query.isFetchingNextPage}
                        className="mt-4 self-center text-sm font-medium font-text text-secondary-700 hover:underline disabled:opacity-60 cursor-pointer"
                    >
                        {query.isFetchingNextPage ? "Loading..." : "Show older coupons"}
                    </button>
                )}
            </div>

            <Dialog open={isCreating} onOpenChange={(open) => !open && setIsCreating(false)}>
                <DialogContent className="max-w-140">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>New coupon</DialogTitle>
                        <DialogDescription>
                            Customers enter the code at checkout. It only counts as used once their payment goes through.
                        </DialogDescription>
                    </div>
                    {isCreating && (
                        <CouponForm
                            onCancel={() => setIsCreating(false)}
                            onCreate={async (payload) => {
                                const coupon = await couponService.createCoupon(payload);
                                await refreshList();
                                toast.success(`${coupon.code} is created`);
                                setIsCreating(false);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent className="max-w-140">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Edit {editing?.code}</DialogTitle>
                        <DialogDescription>Changes apply the next time someone uses the code.</DialogDescription>
                    </div>
                    {editing && (
                        <CouponForm
                            key={editing.id}
                            coupon={editing}
                            onCancel={() => setEditing(null)}
                            onUpdate={async (payload) => {
                                const coupon = await couponService.updateCoupon(editing.id, payload);
                                await refreshList();
                                toast.success(`${coupon.code} is saved`);
                                setEditing(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!deactivating} onOpenChange={(open) => !open && !isTogglingId && setDeactivating(null)}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Deactivate {deactivating?.code}?</DialogTitle>
                        <DialogDescription>
                            Nobody can use it until it&apos;s activated again. Payments it was already used on aren&apos;t affected.
                        </DialogDescription>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            onClick={() => setDeactivating(null)}
                            disabled={!!isTogglingId}
                            className={SECONDARY_BUTTON_CLASS}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => deactivating && void setActive(deactivating, false)}
                            disabled={!!isTogglingId}
                            className={`${PRIMARY_BUTTON_CLASS} gap-2`}
                        >
                            {isTogglingId && <Loader2 className="size-4 animate-spin" />}
                            {isTogglingId ? "Deactivating..." : "Deactivate"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <CouponRedemptionsDialog coupon={viewing} onClose={() => setViewing(null)} />
        </div>
    );
}
