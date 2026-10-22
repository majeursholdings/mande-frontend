import { api } from "@/lib/api";
import type { NigerianState, OrderPartStatus } from "@/constant/shop";
import type { ShopPageInfo } from "@/lib/services/shopService";

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

    async deactivate(customerId: string, reason: string, reauthToken: string): Promise<CustomerDetail> {
        const { data } = await api.post(`${path(customerId)}/deactivate`, { reason }, { headers: { "X-Reauth-Token": reauthToken } });
        return data.customer;
    },

    async reactivate(customerId: string, reason: string, reauthToken: string): Promise<CustomerDetail> {
        const { data } = await api.post(`${path(customerId)}/reactivate`, { reason }, { headers: { "X-Reauth-Token": reauthToken } });
        return data.customer;
    },
};
