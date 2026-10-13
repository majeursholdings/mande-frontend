"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/customTable";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { queryKeys } from "@/lib/queryKeys";
import { couponService, formatCouponValue, type Coupon } from "@/lib/services/couponService";
import { REDEMPTION_COLUMNS } from "./couponParts";

const PAGE_SIZE = 20;

/** Who used a coupon, newest first, paged by date ("Show older uses" loads the next page). */
function RedemptionsTable({ coupon }: { coupon: Coupon }) {
    const query = useInfiniteQuery({
        queryKey: queryKeys.coupons.redemptions(coupon.id),
        queryFn: ({ pageParam }) =>
            couponService.listRedemptions(coupon.id, { limit: PAGE_SIZE, before: pageParam ?? undefined }),
        initialPageParam: null as string | null,
        getNextPageParam: (last) => last.nextBefore,
        staleTime: 30_000,
    });
    const rows = query.data?.pages.flatMap((page) => page.redemptions) ?? [];

    return (
        <div className="flex flex-col">
            <DataTable
                tableId={`couponRedemptions-${coupon.id}`}
                columns={REDEMPTION_COLUMNS}
                rows={rows}
                loading={query.isPending}
                error={query.isError ? "We couldn't load who used this coupon. Please try again." : undefined}
                emptyMessage="Nobody has used this coupon yet. A use counts once the payment goes through."
                compact
            />
            {query.hasNextPage && (
                <button
                    type="button"
                    onClick={() => void query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                    className="mt-4 self-center text-sm font-medium font-text text-secondary-700 hover:underline disabled:opacity-60 cursor-pointer"
                >
                    {query.isFetchingNextPage ? "Loading..." : "Show older uses"}
                </button>
            )}
        </div>
    );
}

/** A dialog listing who used a coupon. */
export default function CouponRedemptionsDialog({ coupon, onClose }: { coupon: Coupon | null; onClose: () => void }) {
    return (
        <Dialog open={!!coupon} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl">
                {coupon && (
                    <>
                        <div className="flex flex-col gap-1">
                            <DialogTitle>Who used {coupon.code}</DialogTitle>
                            <DialogDescription>
                                {formatCouponValue(coupon)}. Used {coupon.usedCount}
                                {coupon.maxUses !== null ? ` of ${coupon.maxUses}` : ""} time{coupon.usedCount === 1 ? "" : "s"}.
                            </DialogDescription>
                        </div>
                        <RedemptionsTable coupon={coupon} />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
