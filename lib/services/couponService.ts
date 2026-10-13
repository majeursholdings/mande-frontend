import { api } from "@/lib/api";
import { formatPrice, fromKobo } from "@/lib/currency";

// ─────────────────────────────────────────────────────────────────────────────
// Coupons: codes a super admin creates for machine bookings, subscriptions or
// both. A coupon never stacks with a plan discount (or the platform plan
// offer): the customer gets whichever saves more. All money is in whole kobo.
// ─────────────────────────────────────────────────────────────────────────────

export type CouponType = "percent" | "fixed";
export type CouponAppliesTo = "bookings" | "subscriptions" | "both";
export type CouponKind = "booking" | "subscription";
export type CouponStatusFilter = "active" | "inactive" | "expired";

export type Coupon = {
    id: string;
    /** Stored uppercase, ^[A-Z0-9-]{3,30}$, unique. */
    code: string;
    /** Internal note, up to 200 characters. */
    description: string | null;
    type: CouponType;
    /** Percent 1 to 100, or kobo (at least 100) for fixed. */
    value: number;
    appliesTo: CouponAppliesTo;
    /** ISO. */
    startsAt: string | null;
    expiresAt: string | null;
    /** Total successful redemptions allowed. */
    maxUses: number | null;
    /** Per email. */
    maxUsesPerCustomer: number | null;
    active: boolean;
    usedCount: number;
    createdAt: string;
};

export type CouponRedemption = {
    id: string;
    kind: CouponKind;
    reference: string;
    customerName: string;
    email: string;
    discountKobo: number;
    amountKobo: number;
    createdAt: string;
};

export type CouponPage = { coupons: Coupon[]; nextBefore: string | null };
export type CouponRedemptionPage = { redemptions: CouponRedemption[]; nextBefore: string | null };

export type CouponListParams = {
    status?: CouponStatusFilter;
    q?: string;
    limit?: number;
    before?: string;
};

export type CreateCouponPayload = {
    code: string;
    description?: string | null;
    type: CouponType;
    value: number;
    appliesTo: CouponAppliesTo;
    startsAt?: string | null;
    expiresAt?: string | null;
    maxUses?: number | null;
    maxUsesPerCustomer?: number | null;
    active?: boolean;
};

/** Any create field except the code. Deactivate with `active: false` (there is no delete). */
export type UpdateCouponPayload = Partial<Omit<CreateCouponPayload, "code">>;

export type CheckCouponPayload = {
    code: string;
    kind: CouponKind;
    /** The amount before any discount. */
    amountKobo: number;
    email?: string;
};

/** POST /coupons/check: what the coupon would take off `amountKobo`. */
export type CouponCheckResult = {
    coupon: { code: string; type: CouponType; value: number };
    discountKobo: number;
};

/** The error codes a coupon can be turned down with (checking or applying it). */
export const COUPON_ERROR_MESSAGES: Record<string, string> = {
    COUPON_INVALID: "That coupon code isn't valid.",
    COUPON_NOT_STARTED: "That coupon isn't active yet.",
    COUPON_EXPIRED: "That coupon has expired.",
    COUPON_USED_UP: "That coupon has been fully used.",
    COUPON_LIMIT_REACHED: "You've already used this coupon the maximum number of times.",
    COUPON_NOT_FOR_THIS: "That coupon can't be used here.",
    AMOUNT_TOO_LOW: "The discounted total is too low to pay. Try without the coupon.",
};

/** "10% off", "N5,000 off". */
export function formatCouponValue(coupon: { type: CouponType; value: number }): string {
    if (coupon.type === "percent") return `${coupon.value}% off`;
    return `${formatPrice(fromKobo(coupon.value))} off`;
}

export const couponService = {
    // ── Public ──────────────────────────────────────────────────────────────

    /** Checks a code for a booking or subscription amount (signed in or not). */
    async checkCoupon(payload: CheckCouponPayload): Promise<CouponCheckResult> {
        const { data } = await api.post<CouponCheckResult>("/coupons/check", {
            ...payload,
            code: payload.code.trim().toUpperCase(),
        });
        return data;
    },

    // ── Super admin ─────────────────────────────────────────────────────────

    async listCoupons(params: CouponListParams = {}): Promise<CouponPage> {
        const { data } = await api.get<CouponPage>("/coupons", { params });
        return data;
    },

    async createCoupon(payload: CreateCouponPayload): Promise<Coupon> {
        const { data } = await api.post<{ coupon: Coupon }>("/coupons", payload);
        return data.coupon;
    },

    async updateCoupon(id: string, payload: UpdateCouponPayload): Promise<Coupon> {
        const { data } = await api.patch<{ coupon: Coupon }>(`/coupons/${encodeURIComponent(id)}`, payload);
        return data.coupon;
    },

    async listRedemptions(id: string, params: { limit?: number; before?: string } = {}): Promise<CouponRedemptionPage> {
        const { data } = await api.get<CouponRedemptionPage>(`/coupons/${encodeURIComponent(id)}/redemptions`, {
            params,
        });
        return data;
    },
};
