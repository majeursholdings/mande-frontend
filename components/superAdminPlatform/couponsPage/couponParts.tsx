"use client";

import { StatusBadge, type ColumnDef, type SelectFilterItem, type StatusTone } from "@/components/customTable";
import { formatPrice, fromKobo } from "@/lib/currency";
import { formatCouponValue, type Coupon, type CouponRedemption, type CouponStatusFilter } from "@/lib/services/couponService";
import { formatDayAndTime } from "@/lib/date";
import { COUPON_APPLIES_TO_LABELS } from "../form/couponForm";

/** Where a coupon stands right now. */
export type CouponStatus = "active" | "inactive" | "expired" | "scheduled";

const STATUS_LABELS: Record<CouponStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    expired: "Expired",
    scheduled: "Scheduled",
};

const STATUS_TONES: Record<CouponStatus, StatusTone> = {
    active: "green",
    inactive: "gray",
    expired: "red",
    scheduled: "blue",
};

/** The status filter's choices (what the API filters by). */
export const COUPON_STATUS_ITEMS: SelectFilterItem[] = (["active", "inactive", "expired"] as CouponStatusFilter[]).map(
    (status) => ({ label: STATUS_LABELS[status], value: status }),
);

/** Switched off, past its end date, not started yet, or active. */
export function getCouponStatus(coupon: Coupon, now: Date = new Date()): CouponStatus {
    if (!coupon.active) return "inactive";
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return "expired";
    if (coupon.startsAt && new Date(coupon.startsAt) > now) return "scheduled";
    return "active";
}

export function CouponStatusBadge({ coupon }: { coupon: Coupon }) {
    const status = getCouponStatus(coupon);
    return <StatusBadge label={STATUS_LABELS[status]} tone={STATUS_TONES[status]} variant="pill" />;
}

/** "12 Oct 2026", read as a Lagos date. */
function formatCouponDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Africa/Lagos",
    });
}

/** "12 Oct 2026 to 31 Dec 2026", "From 12 Oct 2026", "Until 31 Dec 2026", "No end date". */
export function formatCouponDates(coupon: Pick<Coupon, "startsAt" | "expiresAt">): string {
    const { startsAt, expiresAt } = coupon;
    if (startsAt && expiresAt) return `${formatCouponDate(startsAt)} to ${formatCouponDate(expiresAt)}`;
    if (startsAt) return `From ${formatCouponDate(startsAt)}`;
    if (expiresAt) return `Until ${formatCouponDate(expiresAt)}`;
    return "No end date";
}

/** "12 / 100", or "12" with "No limit". */
function CouponUses({ coupon }: { coupon: Coupon }) {
    if (coupon.maxUses === null) {
        return (
            <div className="flex flex-col">
                <span className="whitespace-nowrap">{coupon.usedCount}</span>
                <span className="text-xs text-mist-500 whitespace-nowrap">No limit</span>
            </div>
        );
    }
    return (
        <span className="whitespace-nowrap">
            {coupon.usedCount} / {coupon.maxUses}
        </span>
    );
}

export const COUPON_COLUMNS: ColumnDef<Coupon>[] = [
    {
        key: "code",
        header: "Code",
        cell: (coupon) => (
            <div className="flex min-w-0 flex-col">
                <span className="font-medium text-mist-950 whitespace-nowrap">{coupon.code}</span>
                {coupon.description && <span className="max-w-56 truncate text-xs text-mist-500">{coupon.description}</span>}
            </div>
        ),
    },
    {
        key: "value",
        header: "Discount",
        cell: (coupon) => <span className="whitespace-nowrap">{formatCouponValue(coupon)}</span>,
    },
    {
        key: "appliesTo",
        header: "Applies to",
        cell: (coupon) => <span className="whitespace-nowrap">{COUPON_APPLIES_TO_LABELS[coupon.appliesTo] ?? coupon.appliesTo}</span>,
    },
    {
        key: "dates",
        header: "Valid",
        cell: (coupon) => <span className="whitespace-nowrap">{formatCouponDates(coupon)}</span>,
    },
    {
        key: "uses",
        header: "Uses",
        cell: (coupon) => <CouponUses coupon={coupon} />,
    },
    {
        key: "status",
        header: "Status",
        cell: (coupon) => <CouponStatusBadge coupon={coupon} />,
    },
];

const formatKobo = (amountKobo: number) => formatPrice(fromKobo(amountKobo));

export const REDEMPTION_COLUMNS: ColumnDef<CouponRedemption>[] = [
    {
        key: "customer",
        header: "Customer",
        cell: (redemption) => (
            <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-mist-950">{redemption.customerName}</span>
                <span className="truncate text-xs text-mist-500">{redemption.email}</span>
            </div>
        ),
    },
    {
        key: "kind",
        header: "Used on",
        cell: (redemption) => (
            <div className="flex min-w-0 flex-col">
                <span className="whitespace-nowrap">{redemption.kind === "booking" ? "Machine booking" : "Subscription"}</span>
                <span className="truncate text-xs text-mist-500">{redemption.reference}</span>
            </div>
        ),
    },
    {
        key: "discount",
        header: "Discount",
        cell: (redemption) => <span className="whitespace-nowrap">{formatKobo(redemption.discountKobo)}</span>,
    },
    {
        key: "amount",
        header: "Paid",
        cell: (redemption) => <span className="whitespace-nowrap">{formatKobo(redemption.amountKobo)}</span>,
    },
    {
        key: "date",
        header: "Date",
        cell: (redemption) => <span className="whitespace-nowrap">{formatDayAndTime(new Date(redemption.createdAt))}</span>,
    },
];
