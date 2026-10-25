import { api } from "@/lib/api";
import type { NigerianState, OrderPartStatus } from "@/constant/shop";
import type { ShopCoupon, ShopCouponPayload, ShopPageInfo } from "@/lib/services/shopService";

// ─────────────────────────────────────────────────────────────────────────────
// Shop customers, for the super admin's Customers page (/customers on the
// API). Lists come a page at a time by page number, searched and filtered on
// the server. Deactivating and reactivating need a fresh confirmation (the
// X-Reauth-Token from ReauthSteps). Money is whole kobo.
// ─────────────────────────────────────────────────────────────────────────────

/** A customer account's status (pending_verification: they never entered the code we emailed). */
export type CustomerStatus = "active" | "pending_verification" | "deactivated" | "disabled";

/** The statuses the list filters by. */
export type CustomerStatusFilter = "active" | "pending_verification" | "deactivated";

export type CustomerRow = {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: CustomerStatus;
    /** Paid orders, and what they came to. */
    ordersCount: number;
    spentKobo: number;
    creditKobo: number;
    joinedAt: string;
    lastLoginAt: string | null;
};

export type CustomersSummary = {
    total: number;
    active: number;
    unverified: number;
    deactivated: number;
    joinedLast30Days: number;
    creditHeldKobo: number;
    creditHolders: number;
};

export type CustomerAddress = {
    id: string;
    label: string;
    name: string;
    phone: string;
    street: string;
    city: string;
    state: NigerianState;
    isDefault: boolean;
};

export type CustomerDetail = CustomerRow & {
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    marketingOptIn: boolean;
    addresses: CustomerAddress[];
    /** What deactivating leaves running: paid orders on their way, open returns, checkouts not paid yet. */
    inFlight: { openOrders: number; openReturns: number; unpaidCheckouts: number };
    deactivation: { at: string; byName: string; reason: string } | null;
};

export type CustomerOrderStatus = "pending_payment" | "paid" | "cancelled" | "expired";

export type CustomerOrderRow = {
    id: string;
    code: string;
    status: CustomerOrderStatus;
    parts: { sellerName: string; status: OrderPartStatus }[];
    itemCount: number;
    totalKobo: number;
    /** Paid with store credit. */
    creditKobo: number;
    refundedKobo: number;
    placedAt: string;
};

export type CreditEntryKind = "refund" | "spent" | "released" | "adjustment";

export type CustomerCreditEntry = {
    id: string;
    kind: CreditEntryKind;
    amountKobo: number;
    balanceAfterKobo: number;
    summary: string;
    orderCode: string | null;
    at: string;
};

const path = (customerId: string) => `/customers/${encodeURIComponent(customerId)}`;

/** The most one referred sale can cost MANDE (SHOP_IMPLEMENTATION.md 5.7), at the lowest salesToReach on a listed MANDE product. */
export type AffiliateCost = {
    warnAbovePercent: number;
    lowestSalesToReach: number | null;
    product: { id: string; title: string } | null;
    linkPerSalePercent: number | null;
    couponPerSalePercent: number | null;
};

/** A personal coupon's payload: no products or minimum (it covers MANDE stock in the affiliate system). */
export type PersonalCouponPayload = Omit<ShopCouponPayload, "productIds" | "minSubtotalKobo">;

/** A customer's reward points (affiliate credit), as staff see them. */
export type CustomerRewardsEntry = {
    id: string;
    kind: "earn" | "reverse" | "expire" | "spent" | "refund" | "released" | "adjustment";
    status: "pending" | "available" | "void";
    via: "link" | "coupon" | null;
    amountKobo: number;
    balanceAfterKobo: number;
    summary: string;
    orderCode: string | null;
    note: string | null;
    expiresAt: string | null;
    at: string;
};

export type CustomerRewards = ShopPageInfo & {
    status: "active" | "suspended";
    suspendedReason: string | null;
    linkCode: string | null;
    balance: { availableKobo: number; pendingKobo: number };
    referredOrders: number;
    entries: CustomerRewardsEntry[];
};

/** A referrer on the Affiliates page. */
export type AffiliateRow = {
    customerId: string;
    name: string;
    email: string | null;
    status: "active" | "suspended";
    orders: number;
    viaCoupon: number;
    salesKobo: number;
    earnedKobo: number;
    balance: { availableKobo: number; pendingKobo: number };
    lastSaleAt: string;
};

export type AffiliatesPage = ShopPageInfo & {
    summary: { owedPendingKobo: number; owedAvailableKobo: number; holders: number; referrers: number; liveCoupons: number };
    affiliates: AffiliateRow[];
};

export const customerService = {
    async listCustomers(
        query: { page?: number; limit?: number; q?: string; status?: CustomerStatusFilter } = {},
    ): Promise<ShopPageInfo & { customers: CustomerRow[] }> {
        const { data } = await api.get("/customers", { params: query });
        return data;
    },

    async getSummary(): Promise<CustomersSummary> {
        const { data } = await api.get("/customers/summary");
        return data.summary;
    },

    async getCustomer(customerId: string): Promise<CustomerDetail> {
        const { data } = await api.get(path(customerId));
        return data.customer;
    },

    async listOrders(customerId: string, query: { page?: number; limit?: number } = {}): Promise<ShopPageInfo & { orders: CustomerOrderRow[] }> {
        const { data } = await api.get(`${path(customerId)}/orders`, { params: query });
        return data;
    },

    async getCredit(
        customerId: string,
        query: { page?: number; limit?: number } = {},
    ): Promise<ShopPageInfo & { balanceKobo: number; entries: CustomerCreditEntry[] }> {
        const { data } = await api.get(`${path(customerId)}/credit`, { params: query });
        return data;
    },

    async listCoupons(customerId: string, query: { page?: number; limit?: number } = {}): Promise<ShopPageInfo & { coupons: ShopCoupon[]; cost: AffiliateCost }> {
        const { data } = await api.get(`${path(customerId)}/coupons`, { params: query });
        return data;
    },

    async createCoupon(customerId: string, payload: PersonalCouponPayload): Promise<{ coupon: ShopCoupon; cost: AffiliateCost & { warn: boolean; totalPercent: number | null } }> {
        const { data } = await api.post(`${path(customerId)}/coupons`, payload);
        return data;
    },

    async updateCoupon(customerId: string, couponId: string, changes: { active: boolean }): Promise<ShopCoupon> {
        const { data } = await api.patch(`${path(customerId)}/coupons/${couponId}`, changes);
        return data.coupon;
    },

    async getRewards(customerId: string, query: { page?: number; limit?: number } = {}): Promise<CustomerRewards> {
        const { data } = await api.get(`${path(customerId)}/rewards`, { params: query });
        return data;
    },

    async setRewardsStatus(customerId: string, status: "active" | "suspended", reason: string): Promise<CustomerRewards> {
        const { data } = await api.post(`${path(customerId)}/rewards/status`, { status, reason });
        return data;
    },

    /** `amountKobo` above 0 adds points, below 0 takes them off. */
    async adjustRewards(customerId: string, amountKobo: number, note: string, reauthToken: string): Promise<CustomerRewards> {
        const { data } = await api.post(`${path(customerId)}/rewards/adjust`, { amountKobo, note }, { headers: { "X-Reauth-Token": reauthToken } });
        return data;
    },

    async listAffiliates(query: { page?: number; limit?: number; sort?: "sales" | "recent" } = {}): Promise<AffiliatesPage> {
        const { data } = await api.get("/shop-admin/affiliates", { params: query });
        return data;
    },

    async deactivate(customerId: string, reason: string, reauthToken: string): Promise<CustomerDetail> {
        const { data } = await api.post(`${path(customerId)}/deactivate`, { reason }, { headers: { "X-Reauth-Token": reauthToken } });
        return data.customer;
    },

    async reactivate(customerId: string, reason: string, reauthToken: string): Promise<CustomerDetail> {
        const { data } = await api.post(`${path(customerId)}/reactivate`, { reason }, { headers: { "X-Reauth-Token": reauthToken } });
        return data.customer;
    },
};
