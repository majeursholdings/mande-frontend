import { api } from "@/lib/api";
import type { NigerianState, OrderPartStatus, ProductStatus, SellingBlocker } from "@/constant/shop";

// ─────────────────────────────────────────────────────────────────────────────
// The shop, as manufacturers and staff run it from this app (the customers'
// side is the separate mande-shop site). A manufacturer's own store is
// /my-shop; MANDE's own stock is /shop-admin/mande, with the same product and
// delivery zone calls (see sellerShopApi). Lists come a page at a time, by
// page number, with the total. Money is whole kobo.
// ─────────────────────────────────────────────────────────────────────────────

export type ShopPageInfo = { page: number; limit: number; total: number; totalPages: number };

export type DeliveryZone = { id: string; name: string; states: NigerianState[] };

export type PayoutAccount = {
    bankName: string;
    accountNumberLast4: string;
    /** The bank's name for the account. */
    accountName: string;
    mode: "test" | "live";
    connectedAt: string;
};

export type ShopSeller = {
    id: string;
    kind: "manufacturer" | "mande";
    /** The store's address on the shop: shop.mande.com.ng/s/<slug>. */
    slug: string;
    shopAccess: { status: "allowed" | "revoked"; reason: string | null };
    payout: PayoutAccount | null;
    deliveryZones: DeliveryZone[];
    rating: { average: number; count: number };
    /** Where a new product's pickup starts: the manufacturer's profile address (empty for MANDE). */
    defaultPickupAddress: string;
};

export type SellerStanding = {
    /** What's stopping them selling, in the order to explain it. Empty when nothing is. */
    blockers: SellingBlocker[];
    /** They can add a product now. */
    canCreate: boolean;
    /** Their products can be on the shop. */
    canList: boolean;
    maxProducts: number | null;
    /** Products counting towards the plan's limit (drafts, listed, paused and hidden). */
    productCount: number;
    planId: string | null;
};

export type SellerOverview = { seller: ShopSeller; standing: SellerStanding };

export type ProductDeliveryFee = { zoneId: string; feeKobo: number; extraUnitKobo: number; etaDays: number };
export type ProductDelivery = { fees: ProductDeliveryFee[]; pickup: { available: boolean; address: string } };

/** A product as its seller sees it. */
export type SellerProduct = {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    subcategory: string;
    images: { publicId: string; url: string | null }[];
    priceKobo: number;
    /** Null when it's made to order. */
    stock: number | null;
    leadTimeDays: number | null;
    delivery: ProductDelivery;
    status: ProductStatus;
    /** Why MANDE took it down, when it's removed. */
    removalReason: string | null;
    listedAt: string | null;
    rating: { average: number; count: number };
    createdAt: string;
    updatedAt: string;
};

export type ProductPayload = {
    title: string;
    description: string;
    category: string;
    subcategory: string;
    images: { publicId: string }[];
    priceKobo: number;
    stock: number | null;
    leadTimeDays: number | null;
    delivery: ProductDelivery;
};

export type CreateProductPayload = ProductPayload & { status: "draft" | "listed" };

export type ProductListQuery = { page?: number; limit?: number; status?: ProductStatus; q?: string };

export type SellerProductsPage = ShopPageInfo & { products: SellerProduct[]; standing: SellerStanding };

/** One seller's part of a paid order: their lines, the customer's delivery details and their share. */
export type ShopOrderPart = {
    id: string;
    orderId: string;
    code: string;
    paidAt: string | null;
    customer: { name: string; phone: string; street: string; city: string; state: string };
    lines: { id: string; productId: string; title: string; imageUrl: string | null; unitPriceKobo: number; quantity: number; deliveryFeeKobo: number; pickup: boolean }[];
    itemsSubtotalKobo: number;
    deliveryFeeKobo: number;
    platformChargeKobo: number;
    /** What the seller is paid: items and delivery, less MANDE's charge. */
    sellerShareKobo: number;
    status: OrderPartStatus;
    trackingNote: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
};

/** Every row matching a table's filters, for saving as a file (up to 5,000: `truncated` when there were more). */
export type ExportBatch = { total: number; truncated: boolean };

/** What the API made of a CSV file of products: checked only (dry run), or saved when `applied`. */
export type ProductImportReport = {
    applied: boolean;
    /** Problems with the whole file: its headings, the plan's limit, selling being blocked. */
    fileErrors: string[];
    summary: { rows: number; create: number; update: number; unchanged: number; withErrors: number };
    rows: { line: number; action: "create" | "update" | "unchanged"; productId: string | null; title: string; errors: Record<string, string[]> }[];
};

export type SalesPeriod = "week" | "month";

/** The shop overview. Sales are the seller's share, not counting cancelled or refunded orders. */
export type SellerSummary = {
    products: { listed: number; draft: number; paused: number; pausedByPlan: number; hidden: number; removed: number; soldOut: number };
    plan: { maxProducts: number | null; productCount: number };
    orders: { toFulfil: number; shipped: number; allTime: number; thisMonth: number };
    sales: { thisMonthKobo: number; lastMonthKobo: number; allTimeKobo: number };
    rating: { average: number; count: number };
    /** The last 12 weeks or months, oldest first. */
    series: { period: SalesPeriod; buckets: { start: string; salesKobo: number; orders: number }[] };
    recentOrders: ShopOrderPart[];
    /** Products needing a look: off the shop, paused by the plan, sold out, drafts not ready. */
    attention: { id: string; title: string; status: ProductStatus; reason: string }[];
};

/** The calls a seller makes on their own store: a manufacturer at /my-shop, staff for MANDE stock at /shop-admin/mande. */
function sellerShopApi(base: string, productsBase = `${base}/products`) {
    return {
        async getOverview(): Promise<SellerOverview> {
            const { data } = await api.get<SellerOverview>(base);
            return data;
        },

        async getSummary(period: SalesPeriod): Promise<SellerSummary> {
            const { data } = await api.get<{ summary: SellerSummary }>(`${base}/summary`, { params: { period } });
            return data.summary;
        },

        async listOrders(query: { page?: number; limit?: number; status?: OrderPartStatus } = {}): Promise<ShopPageInfo & { orders: ShopOrderPart[] }> {
            const { data } = await api.get<ShopPageInfo & { orders: ShopOrderPart[] }>(`${base}/orders`, { params: query });
            return data;
        },

        async exportOrders(query: { status?: OrderPartStatus } = {}): Promise<ExportBatch & { orders: ShopOrderPart[] }> {
            const { data } = await api.get<ExportBatch & { orders: ShopOrderPart[] }>(`${base}/orders/export`, { params: query });
            return data;
        },

        async exportProducts(query: { status?: ProductStatus; q?: string } = {}): Promise<ExportBatch & { products: SellerProduct[]; deliveryZones: { id: string; name: string }[] }> {
            const { data } = await api.get<ExportBatch & { products: SellerProduct[]; deliveryZones: { id: string; name: string }[] }>(`${productsBase}/export`, { params: query });
            return data;
        },

        /** Sends a CSV file of products: checked only unless `dryRun` is false, then saved (all or nothing) when nothing has a problem. */
        async importProducts(csv: string, dryRun: boolean): Promise<ProductImportReport> {
            const { data } = await api.post<ProductImportReport>(`${productsBase}/import`, csv, {
                params: { dryRun },
                headers: { "Content-Type": "text/csv" },
                // Sent as it is, never turned into JSON
                transformRequest: [(body: string) => body],
            });
            return data;
        },

        async listProducts(query: ProductListQuery = {}): Promise<SellerProductsPage> {
            const { data } = await api.get<SellerProductsPage>(productsBase, { params: query });
            return data;
        },

        async createProduct(payload: CreateProductPayload): Promise<SellerProduct> {
            const { data } = await api.post<{ product: SellerProduct }>(productsBase, payload);
            return data.product;
        },

        async updateProduct(productId: string, changes: Partial<ProductPayload>): Promise<SellerProduct> {
            const { data } = await api.patch<{ product: SellerProduct }>(`${productsBase}/${productId}`, changes);
            return data.product;
        },

        async setProductStatus(productId: string, status: "listed" | "paused_by_seller" | "draft"): Promise<SellerProduct> {
            const { data } = await api.put<{ product: SellerProduct }>(`${productsBase}/${productId}/status`, { status });
            return data.product;
        },

        async deleteProduct(productId: string): Promise<void> {
            await api.delete(`${productsBase}/${productId}`);
        },

        async setDeliveryZones(zones: { id?: string; name: string; states: NigerianState[] }[]): Promise<DeliveryZone[]> {
            const { data } = await api.put<{ deliveryZones: DeliveryZone[] }>(`${base}/delivery-zones`, { zones });
            return data.deliveryZones;
        },
    };
}

export type SellerShopApi = ReturnType<typeof sellerShopApi>;

/** The signed-in manufacturer's own store. */
export const myShopService = {
    ...sellerShopApi("/my-shop"),

    /** Paystack's banks (the codes a payout account takes). */
    async listBanks(): Promise<{ code: string; name: string }[]> {
        const { data } = await api.get<{ banks: { code: string; name: string }[] }>("/my-shop/banks");
        return data.banks;
    },

    async lookupPayoutAccount(bankCode: string, accountNumber: string): Promise<{ accountName: string }> {
        const { data } = await api.post<{ accountName: string }>("/my-shop/payout-account/lookup", { bankCode, accountNumber });
        return data;
    },

    /** Connects or changes it: needs the reauth token from a fresh password and code. */
    async connectPayoutAccount(payload: { bankCode: string; accountNumber: string }, reauthToken: string): Promise<SellerOverview> {
        const { data } = await api.put<SellerOverview>("/my-shop/payout-account", payload, { headers: { "X-Reauth-Token": reauthToken } });
        return data;
    },
};

/** MANDE's own stock, for admins and super admins. */
export const mandeStockService = sellerShopApi("/shop-admin/mande");

// ─── Super admins: every product, sellers and shop access ────────────────────

/** A product in the super admin's list, with who sells it. */
export type ShopAdminProduct = SellerProduct & { seller: { id: string; kind: "manufacturer" | "mande"; slug: string; name: string } | null };

export type ShopSellerRow = {
    id: string;
    manufacturerId: string;
    name: string;
    slug: string;
    shopAccess: { status: "allowed" | "revoked"; reason: string | null };
    payoutConnected: boolean;
    rating: { average: number; count: number };
    products: { listed: number; total: number };
    createdAt: string;
};

export type ShopSellerDetail = SellerOverview & {
    seller: ShopSeller & {
        manufacturerId: string;
        name: string;
        accessHistory: { status: "allowed" | "revoked"; reason: string | null; byName: string; at: string }[];
    };
};

export const shopAdminService = {
    async listProducts(query: ProductListQuery & { sellerKind?: "manufacturer" | "mande" } = {}): Promise<ShopPageInfo & { products: ShopAdminProduct[] }> {
        const { data } = await api.get<ShopPageInfo & { products: ShopAdminProduct[] }>("/shop-admin/products", { params: query });
        return data;
    },

    async exportProducts(query: { status?: ProductStatus; q?: string; sellerKind?: "manufacturer" | "mande" } = {}): Promise<ExportBatch & { products: ShopAdminProduct[] }> {
        const { data } = await api.get<ExportBatch & { products: ShopAdminProduct[] }>("/shop-admin/products/export", { params: query });
        return data;
    },

    /** Takes it off the shop; its seller is told the reason. */
    async removeProduct(productId: string, reason: string): Promise<SellerProduct> {
        const { data } = await api.post<{ product: SellerProduct }>(`/shop-admin/products/${productId}/remove`, { reason });
        return data.product;
    },

    /** Back as paused, for its seller to list. */
    async restoreProduct(productId: string): Promise<SellerProduct> {
        const { data } = await api.post<{ product: SellerProduct }>(`/shop-admin/products/${productId}/restore`);
        return data.product;
    },

    async listSellers(query: { page?: number; limit?: number; access?: "allowed" | "revoked"; q?: string } = {}): Promise<ShopPageInfo & { sellers: ShopSellerRow[] }> {
        const { data } = await api.get<ShopPageInfo & { sellers: ShopSellerRow[] }>("/shop-admin/sellers", { params: query });
        return data;
    },

    async getSeller(sellerId: string): Promise<ShopSellerDetail> {
        const { data } = await api.get<ShopSellerDetail>(`/shop-admin/sellers/${sellerId}`);
        return data;
    },

    async setSellerAccess(sellerId: string, status: "allowed" | "revoked", reason: string): Promise<ShopSellerDetail> {
        const { data } = await api.put<ShopSellerDetail>(`/shop-admin/sellers/${sellerId}/access`, { status, reason });
        return data;
    },
};
