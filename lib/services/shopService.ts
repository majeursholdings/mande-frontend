import { api } from "@/lib/api";
import type { NigerianState, OrderPartStatus, ProductStatus, ReturnReason, ReturnStatus, SellingBlocker } from "@/constant/shop";

// ─────────────────────────────────────────────────────────────────────────────
// The shop, as manufacturers and staff run it from this app (the customers'
// side is the separate mande-shop site). A manufacturer's own store is
// /my-shop; MANDE's own stock is /shop-admin/mande, with the same product and
// delivery zone calls (see sellerShopApi). Lists come a page at a time, by
// page number, with the total. Money is whole kobo.
// ─────────────────────────────────────────────────────────────────────────────

export type ShopPageInfo = { page: number; limit: number; total: number; totalPages: number };

export type DeliveryZone = { id: string; name: string; states: NigerianState[] };

/** Where a manufacturer's shop money is withdrawn to: the bank account on their wallet. */
export type PayoutAccount = {
    bankName: string;
    accountNumberLast4: string;
    /** The bank's name for the account. */
    accountName: string;
};

/** A seller's share of one order (SHOP_IMPLEMENTATION.md 3.3): held until a day after delivery, then released to their wallet. */
export type PayoutStatus = "held" | "released" | "reversed";

export type SellerPayout = {
    orderId: string;
    orderCode: string;
    paidAt: string | null;
    partStatus: OrderPartStatus;
    deliveredAt: string | null;
    itemsSubtotalKobo: number;
    deliveryFeeKobo: number;
    platformChargeKobo: number;
    sellerShareKobo: number;
    status: PayoutStatus;
    /** When it goes to their wallet (set once it's delivered). */
    releaseAt: string | null;
    releasedAt: string | null;
    releasedKobo: number;
    /** Their part of refunds: taken off before release, or back from the wallet after. */
    refundedKobo: number;
    clawedBackKobo: number;
};

export type SellerPayoutsPage = ShopPageInfo & {
    totals: { heldKobo: number; releasedKobo: number; clawedBackKobo: number };
    payouts: SellerPayout[];
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
    /** When the seller was flagged for a low rating, or null. It only lowers their ranking on the shop. */
    lowRatingFlaggedAt: string | null;
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
    /** Taken back for a change of mind. */
    returnable: boolean;
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
    returnable: boolean;
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
    /** What the customer wrote at checkout for the sellers (delivery directions, a gate code...). */
    note: string | null;
    lines: {
        id: string;
        productId: string;
        title: string;
        imageUrl: string | null;
        unitPriceKobo: number;
        quantity: number;
        deliveryFeeKobo: number;
        pickup: boolean;
        status: "active" | "cancelled";
        /** MANDE stock made through a job (SHOP_IMPLEMENTATION.md 5.2): null when it has none. */
        job: ShopLineJob | null;
    }[];
    itemsSubtotalKobo: number;
    /** Their coupon on this order, and what it took off their items (they pay for it). */
    coupon: { code: string } | null;
    discountKobo: number;
    deliveryFeeKobo: number;
    platformChargeKobo: number;
    /** What the seller is paid: items (less any coupon) and delivery, less MANDE's charge. */
    sellerShareKobo: number;
    status: OrderPartStatus;
    /** What the seller can do next (the API's rules): the order's buttons. */
    nextMoves: OrderPartMove[];
    trackingNote: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
};

/** A MANDE stock line's job, as staff see it on the order. "closed": rejected for the last time, so the line needs a new job or a refund. */
export type ShopLineJob = { id: string; code: string; status: string; dueDate: string; readyToShip: boolean; closed: boolean };

/** A made-to-order MANDE product's job template (staff only). `payKobo` and `autoCreate` are set by super admins. */
export type JobTemplate = {
    brief: string;
    attachments: ({ url: string | null; name: string | null; kind: "document" | "image"; publicId: string } | null)[];
    payKobo: number | null;
    productionDays: number;
    leadId: string | null;
    manufacturerIds: string[];
    autoCreate: boolean;
    margin: { marginKobo: number; marginPercent: number } | null;
};

export type JobTemplatePayload = {
    brief: string;
    attachments: { publicId: string; name?: string }[];
    payKobo?: number | null;
    productionDays: number;
    leadId: string | null;
    manufacturerIds: string[];
    autoCreate?: boolean;
    /** Saves a margin under the shop's minimum (the API answers 409 LOW_JOB_MARGIN without it). */
    confirmLowMargin?: boolean;
};

/** A MANDE product as staff see it: with its job template, and the job it was made from. */
/** A MANDE product in the affiliate system: referrals earn the shop's reward over salesToReach sales. */
export type ProductAffiliate = { enabled: boolean; salesToReach: number | null };

export type MandeProduct = SellerProduct & {
    jobTemplate: JobTemplate | null;
    affiliate: ProductAffiliate;
    sourceJob: { id: string; code: string; title: string } | null;
};

/** The job form for a paid made-to-order line, prefilled from the product's template and the order. */
export type ShopJobDraft = {
    title: string;
    description: string;
    category: string;
    quantity: number;
    amountKobo: number | null;
    dueDate: string | null;
    deliveryLocation: { street: string; city: string; state: string; country: string } | null;
    image: { url: string | null; name: string | null; kind: "document" | "image"; publicId: string } | null;
    attachments: ({ url: string | null; name: string | null; kind: "document" | "image"; publicId: string } | null)[];
    projectLeadIds: string[];
    manufacturerIds: string[];
    shopLine: { orderId: string; lineId: string; orderCode: string };
    hasTemplate: boolean;
};

/** A seller's coupon (5.8): they pay for the discount. The type and value are set when it's made. */
export type ShopCoupon = {
    id: string;
    code: string;
    description: string | null;
    type: "percentage" | "fixed";
    /** A whole percent, or kobo off the order's items from this seller. */
    value: number;
    /** Empty: all their products. */
    productIds: string[];
    minSubtotalKobo: number;
    startsAt: string | null;
    expiresAt: string | null;
    maxUses: number | null;
    maxUsesPerCustomer: number | null;
    active: boolean;
    /** Switched off by the shop: "plan" (over the plan's limit) or "selling" (they can't sell right now). */
    pausedReason: "plan" | "selling" | null;
    usedCount: number;
    /** A customer could use it now. */
    live: boolean;
    createdAt: string | null;
};

export type ShopCouponPayload = {
    code: string;
    type: "percentage" | "fixed";
    value: number;
    description?: string | null;
    productIds: string[];
    minSubtotalKobo: number;
    startsAt?: string | null;
    expiresAt?: string | null;
    maxUses?: number | null;
    maxUsesPerCustomer?: number | null;
};

/** Their coupon limit: null for none (MANDE stock). */
export type CouponStanding = { maxCoupons: number | null; activeCoupons: number; canCreate: boolean };

/** Where a seller can move their part of an order. */
export type OrderPartMove = "processing" | "shipped" | "delivered" | "cancelled";

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

/** A review as sellers and staff see it (GET .../reviews). The reviewer shows by first name and last initial. */
export type ShopReviewRow = {
    id: string;
    kind: "product" | "seller";
    rating: number;
    body: string;
    images: { url: string }[];
    author: string;
    product: { slug: string; title: string } | null;
    seller: { slug: string; name: string } | null;
    orderCode: string | null;
    status: "published" | "hidden";
    hiddenReason: string | null;
    reply: { body: string; at: string } | null;
    sellerReport: { reason: string; at: string; status: "open" | "closed" } | null;
    createdAt: string;
    editedAt: string | null;
};

/** A customer's return as sellers and staff see it (GET .../returns). */
export type ShopReturnRow = {
    id: string;
    code: string;
    orderCode: string;
    status: ReturnStatus;
    reason: ReturnReason;
    details: string;
    /** Private photos, through short-lived signed links. */
    photos: { url: string }[];
    refundMethod: "credit" | "card";
    /** What it refunds: the items, plus their delivery for a problem. */
    amountKobo: number;
    lines: { lineId: string; title: string; image: { url: string; alt?: string } | null; unitPriceKobo: number; quantity: number; deliveryRefundKobo: number }[];
    instructions: string | null;
    rejectReason: string | null;
    sentNote: string | null;
    sendBackBy: string | null;
    createdAt: string;
    approvedAt: string | null;
    sentAt: string | null;
    refundedAt: string | null;
    history: { status: ReturnStatus; at: string; byName: string }[];
    seller: { slug: string; name: string; kind: "manufacturer" | "mande" };
    customer: { name: string; phone: string };
    canApprove: boolean;
    canReject: boolean;
    canRefund: boolean;
};

export type ReturnsQuery = { page?: number; limit?: number; status?: ReturnStatus | "open" };

/** Looking after returns: a seller's own at /my-shop, MANDE stock's at /shop-admin/mande, or (super admins) every one at /shop-admin. */
function returnsApi(base: string) {
    return {
        /** `waiting` counts those needing the seller (requested, or sent back). */
        async listReturns(query: ReturnsQuery = {}): Promise<ShopPageInfo & { returns: ShopReturnRow[]; waiting: number }> {
            const { data } = await api.get<ShopPageInfo & { returns: ShopReturnRow[]; waiting: number }>(`${base}/returns`, { params: query });
            return data;
        },
        /** Yes, with where and how to send it back. */
        async approveReturn(code: string, instructions: string): Promise<ShopReturnRow> {
            const { data } = await api.post<{ return: ShopReturnRow }>(`${base}/returns/${encodeURIComponent(code)}/approve`, { instructions });
            return data.return;
        },
        /** No, with why (before it's sent, or once it's back and not as agreed). */
        async rejectReturn(code: string, reason: string): Promise<ShopReturnRow> {
            const { data } = await api.post<{ return: ShopReturnRow }>(`${base}/returns/${encodeURIComponent(code)}/reject`, { reason });
            return data.return;
        },
        /** It's back and as agreed: refunds the customer, and puts it back in stock when `restock`. */
        async refundReturn(code: string, restock: boolean): Promise<ShopReturnRow> {
            const { data } = await api.post<{ return: ShopReturnRow }>(`${base}/returns/${encodeURIComponent(code)}/refund`, { restock });
            return data.return;
        },
    };
}

export type ReturnsApi = ReturnType<typeof returnsApi>;

/** Every return on the shop, for super admins to step in on. */
export const allReturnsService = returnsApi("/shop-admin");

/** The calls a seller makes on their own store: a manufacturer at /my-shop, staff for MANDE stock at /shop-admin/mande. */
function sellerShopApi(base: string, productsBase = `${base}/products`) {
    return {
        ...returnsApi(base),
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

        /** Reviews of them and their products, newest first. */
        async listReviews(query: { page?: number; limit?: number; kind?: "product" | "seller"; stars?: number } = {}): Promise<ShopPageInfo & { reviews: ShopReviewRow[] }> {
            const { data } = await api.get<ShopPageInfo & { reviews: ShopReviewRow[] }>(`${base}/reviews`, { params: query });
            return data;
        },

        /** Their one reply to a review, shown under it on the shop. Sending it again changes it. */
        async replyToReview(id: string, body: string): Promise<ShopReviewRow> {
            const { data } = await api.put<{ review: ShopReviewRow }>(`${base}/reviews/${encodeURIComponent(id)}/reply`, { body });
            return data.review;
        },

        /** Moves their part of an order on: being prepared, shipped (with an optional note), delivered, or cancelled (with a reason; the customer is refunded). */
        async moveOrder(orderId: string, body: { status: OrderPartMove; trackingNote?: string; reason?: string }): Promise<ShopOrderPart> {
            const { data } = await api.post<{ order: ShopOrderPart }>(`${base}/orders/${encodeURIComponent(orderId)}/status`, body);
            return data.order;
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

        async listCoupons(query: { page?: number; limit?: number } = {}): Promise<ShopPageInfo & { coupons: ShopCoupon[]; standing: CouponStanding }> {
            const { data } = await api.get<ShopPageInfo & { coupons: ShopCoupon[]; standing: CouponStanding }>(`${base}/coupons`, { params: query });
            return data;
        },

        async createCoupon(payload: ShopCouponPayload): Promise<ShopCoupon> {
            const { data } = await api.post<{ coupon: ShopCoupon }>(`${base}/coupons`, payload);
            return data.coupon;
        },

        /** Anything but the code, type and value; `active` switches it on or off. */
        async updateCoupon(couponId: string, changes: Partial<Omit<ShopCouponPayload, "code" | "type" | "value">> & { active?: boolean }): Promise<ShopCoupon> {
            const { data } = await api.patch<{ coupon: ShopCoupon }>(`${base}/coupons/${couponId}`, changes);
            return data.coupon;
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

    /** Asks MANDE to look at a review (it stays up until they decide). Once per review. */
    async reportReview(id: string, reason: string): Promise<ShopReviewRow> {
        const { data } = await api.post<{ review: ShopReviewRow }>(`/my-shop/reviews/${encodeURIComponent(id)}/report`, { reason });
        return data.review;
    },

    /** Their shop money: each order's share and where it is, and the totals. */
    async listPayouts(query: { page?: number; limit?: number; status?: PayoutStatus } = {}): Promise<SellerPayoutsPage> {
        const { data } = await api.get<SellerPayoutsPage>("/my-shop/payouts", { params: query });
        return data;
    },
};

/** MANDE's own stock, for admins and super admins. */
export const mandeStockService = {
    ...sellerShopApi("/shop-admin/mande"),

    /** One MANDE product with its job template (staff only). */
    async getProduct(productId: string): Promise<MandeProduct> {
        const { data } = await api.get<{ product: MandeProduct }>(`/shop-admin/mande/products/${productId}`);
        return data.product;
    },

    async setJobTemplate(productId: string, payload: JobTemplatePayload): Promise<MandeProduct> {
        const { data } = await api.put<{ product: MandeProduct }>(`/shop-admin/mande/products/${productId}/job-template`, payload);
        return data.product;
    },

    async setAffiliate(productId: string, payload: ProductAffiliate): Promise<MandeProduct> {
        const { data } = await api.put<{ product: MandeProduct }>(`/shop-admin/mande/products/${productId}/affiliate`, payload);
        return data.product;
    },

    async removeJobTemplate(productId: string): Promise<MandeProduct> {
        const { data } = await api.delete<{ product: MandeProduct }>(`/shop-admin/mande/products/${productId}/job-template`);
        return data.product;
    },

    /** The job form for a paid made-to-order line (409 LINE_HAS_JOB when it has one). */
    async getJobDraft(orderId: string, lineId: string): Promise<ShopJobDraft> {
        const { data } = await api.get<{ draft: ShopJobDraft }>(`/shop-admin/mande/orders/${orderId}/lines/${lineId}/job-draft`);
        return data.draft;
    },
};

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
    /** When they were flagged for a low rating (below Settings' low rating alert), or null. Shown as the "Low rating" badge. */
    lowRatingFlaggedAt: string | null;
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

/** A customer's report of a product (GET /shop-admin/reports). The customer isn't named. */
export type ProductReportRow = {
    id: string;
    product: { id: string; slug: string; title: string; status: ProductStatus } | null;
    reason: "counterfeit" | "misleading" | "prohibited" | "scam" | "offensive" | "other";
    reasonLabel: string;
    details: string;
    status: "open" | "resolved" | "dismissed";
    reportedAt: string;
    resolvedAt: string | null;
    resolvedByName: string | null;
    resolutionNote: string | null;
};

export const shopAdminService = {
    /** Every review on the shop, reported ones waiting for a decision first. */
    async listAllReviews(query: { page?: number; limit?: number; status?: "published" | "hidden"; reported?: boolean } = {}): Promise<ShopPageInfo & { reviews: ShopReviewRow[] }> {
        const { data } = await api.get<ShopPageInfo & { reviews: ShopReviewRow[] }>("/shop-admin/reviews", { params: { ...query, reported: query.reported ? "true" : undefined } });
        return data;
    },

    /** Hides it, with a reason its author sees; the product's or seller's rating no longer counts it. */
    async hideReview(id: string, reason: string): Promise<void> {
        await api.post(`/shop-admin/reviews/${encodeURIComponent(id)}/hide`, { reason });
    },

    async restoreReview(id: string): Promise<void> {
        await api.post(`/shop-admin/reviews/${encodeURIComponent(id)}/restore`);
    },

    /** Keeps a reported review showing, closing the seller's report. */
    async keepReview(id: string): Promise<void> {
        await api.post(`/shop-admin/reviews/${encodeURIComponent(id)}/keep`);
    },

    async listReports(query: { page?: number; limit?: number; status?: ProductReportRow["status"] } = {}): Promise<ShopPageInfo & { reports: ProductReportRow[] }> {
        const { data } = await api.get<ShopPageInfo & { reports: ProductReportRow[] }>("/shop-admin/reports", { params: query });
        return data;
    },

    /** Closes a report: "resolved" (acted on) or "dismissed" (nothing wrong), with a note. */
    async closeReport(id: string, outcome: "resolved" | "dismissed", note: string): Promise<void> {
        await api.post(`/shop-admin/reports/${encodeURIComponent(id)}/close`, { outcome, note });
    },

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

    /** `rating: "low"`: only sellers flagged for a low rating (filtered by the API). */
    async listSellers(
        query: { page?: number; limit?: number; access?: "allowed" | "revoked"; rating?: "low"; q?: string } = {},
    ): Promise<ShopPageInfo & { sellers: ShopSellerRow[] }> {
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

// ─── Refunds and disputes (super admins) ──────────────────────────────────────

/** Where a card refund stands: "failed" ones are still owed to the customer until a super admin retries them or gives them as credit ("credited"). */
export type CardRefundStatus = "pending" | "succeeded" | "failed" | "credited";

export type CardRefundRow = {
    /** One per card refund (its part and key). */
    id: string;
    orderId: string;
    orderCode: string;
    customerName: string;
    provider: "paystack" | "flutterwave" | null;
    partId: string;
    sellerKind: "manufacturer" | "mande";
    /** What it's for ("cancel:<partId>", "return:<returnId>"...): sent back to settle it. */
    key: string;
    amountKobo: number;
    reason: string;
    status: CardRefundStatus;
    at: string;
    refundId: string | null;
    failureReason: string | null;
    checkedAt: string | null;
    attempts: number;
    settledBy: string | null;
    settledAt: string | null;
};

export type ShopDisputeStatus = "open" | "won" | "lost";

export type ShopDisputeRow = {
    id: string;
    orderId: string;
    orderCode: string;
    customerName: string | null;
    orderTotalKobo: number | null;
    provider: "paystack" | "flutterwave";
    providerDisputeId: string;
    status: ShopDisputeStatus;
    providerStatus: string | null;
    resolution: string | null;
    /** Closed in a way the API didn't recognise: check it on the payment platform. */
    needsReview: boolean;
    category: string | null;
    reason: string | null;
    amountKobo: number;
    /** Of a lost dispute, what was counted against the order like a refund. */
    appliedKobo: number;
    dueAt: string | null;
    resolvedAt: string | null;
    openedAt: string | null;
};

export const shopPaymentsService = {
    /** Card refunds: failed and pending ones by default, failed first. */
    async listRefunds(query: { page?: number; limit?: number; status?: "failed" | "pending" | "credited" } = {}): Promise<ShopPageInfo & { refunds: CardRefundRow[] }> {
        const { data } = await api.get<ShopPageInfo & { refunds: CardRefundRow[] }>("/shop-admin/refunds", { params: query });
        return data;
    },

    /** Asks the payment platform for a failed card refund again. */
    async retryRefund(row: Pick<CardRefundRow, "orderId" | "partId" | "key">): Promise<CardRefundRow> {
        const { data } = await api.post<{ refund: CardRefundRow }>(`/shop-admin/orders/${row.orderId}/parts/${row.partId}/refunds/retry`, { key: row.key });
        return data.refund;
    },

    /** Gives a failed card refund to the customer as store credit instead. */
    async creditRefund(row: Pick<CardRefundRow, "orderId" | "partId" | "key">): Promise<CardRefundRow> {
        const { data } = await api.post<{ refund: CardRefundRow }>(`/shop-admin/orders/${row.orderId}/parts/${row.partId}/refunds/credit`, { key: row.key });
        return data.refund;
    },

    /** Chargebacks, open ones first by the date to answer by. */
    async listDisputes(query: { page?: number; limit?: number; status?: ShopDisputeStatus } = {}): Promise<ShopPageInfo & { disputes: ShopDisputeRow[] }> {
        const { data } = await api.get<ShopPageInfo & { disputes: ShopDisputeRow[] }>("/shop-admin/disputes", { params: query });
        return data;
    },
};
