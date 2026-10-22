// ─────────────────────────────────────────────────────────────────────────────
// The shop's shared values, mirrored from mande-backend/src/constants/shop.ts
// (and mande-shop/constant/shop.ts): categories, states, product statuses and
// what stops a seller selling. Change them together. Products store the
// category and subcategory slugs, so names can be renamed freely.
// ─────────────────────────────────────────────────────────────────────────────

import type { StatusTone } from "@/components/customTable";
import type { SelectOption } from "@/components/form/types";

export type ShopSubcategory = { slug: string; name: string };
export type ShopCategory = { slug: string; name: string; subcategories: ShopSubcategory[] };

/** Draft v1 list, to be confirmed. */
export const SHOP_CATEGORIES: ShopCategory[] = [
    {
        slug: "living-room",
        name: "Living room",
        subcategories: [
            { slug: "sofas", name: "Sofas" },
            { slug: "sectionals", name: "Sectionals" },
            { slug: "armchairs", name: "Armchairs" },
            { slug: "coffee-tables", name: "Coffee tables" },
            { slug: "side-tables", name: "Side tables" },
            { slug: "tv-stands", name: "TV stands" },
            { slug: "shelves", name: "Shelves" },
        ],
    },
    {
        slug: "bedroom",
        name: "Bedroom",
        subcategories: [
            { slug: "beds", name: "Beds" },
            { slug: "wardrobes", name: "Wardrobes" },
            { slug: "dressers", name: "Dressers" },
            { slug: "bedside-tables", name: "Bedside tables" },
            { slug: "headboards", name: "Headboards" },
        ],
    },
    {
        slug: "dining",
        name: "Dining",
        subcategories: [
            { slug: "dining-sets", name: "Dining sets" },
            { slug: "dining-tables", name: "Dining tables" },
            { slug: "dining-chairs", name: "Dining chairs" },
            { slug: "sideboards", name: "Sideboards" },
        ],
    },
    {
        slug: "office",
        name: "Office",
        subcategories: [
            { slug: "office-desks", name: "Office desks" },
            { slug: "office-chairs", name: "Office chairs" },
            { slug: "conference-tables", name: "Conference tables" },
            { slug: "filing-cabinets", name: "Filing cabinets" },
            { slug: "reception-desks", name: "Reception desks" },
        ],
    },
    {
        slug: "kitchen",
        name: "Kitchen",
        subcategories: [
            { slug: "kitchen-cabinets", name: "Kitchen cabinets" },
            { slug: "kitchen-islands", name: "Kitchen islands" },
            { slug: "bar-stools", name: "Bar stools" },
        ],
    },
    {
        slug: "outdoor",
        name: "Outdoor",
        subcategories: [
            { slug: "garden-sets", name: "Garden sets" },
            { slug: "loungers", name: "Loungers" },
            { slug: "outdoor-tables", name: "Outdoor tables" },
            { slug: "outdoor-chairs", name: "Outdoor chairs" },
        ],
    },
    {
        slug: "kids",
        name: "Kids",
        subcategories: [
            { slug: "kids-beds", name: "Kids beds" },
            { slug: "study-tables", name: "Study tables" },
            { slug: "kids-storage", name: "Kids storage" },
        ],
    },
    {
        slug: "storage",
        name: "Storage",
        subcategories: [
            { slug: "bookshelves", name: "Bookshelves" },
            { slug: "shoe-racks", name: "Shoe racks" },
            { slug: "cabinets", name: "Cabinets" },
            { slug: "chests", name: "Chests" },
        ],
    },
    {
        slug: "decor",
        name: "Décor",
        subcategories: [
            { slug: "mirrors", name: "Mirrors" },
            { slug: "wall-shelves", name: "Wall shelves" },
            { slug: "room-dividers", name: "Room dividers" },
        ],
    },
];

export const SHOP_CATEGORY_OPTIONS: SelectOption[] = SHOP_CATEGORIES.map((category) => ({ value: category.slug, label: category.name }));

export function subcategoryOptions(categorySlug: string): SelectOption[] {
    return (SHOP_CATEGORIES.find((category) => category.slug === categorySlug)?.subcategories ?? []).map((sub) => ({ value: sub.slug, label: sub.name }));
}

/** "Bedroom › Beds", for a product's category and subcategory slugs. */
export function describeShopCategory(categorySlug: string, subcategorySlug: string): string {
    const category = SHOP_CATEGORIES.find((entry) => entry.slug === categorySlug);
    const subcategory = category?.subcategories.find((sub) => sub.slug === subcategorySlug);
    return [category?.name ?? categorySlug, subcategory?.name ?? subcategorySlug].join(" › ");
}

/** The 36 states and the FCT, for delivery zones. */
export const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
    "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
    "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
    "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;
export type NigerianState = (typeof NIGERIAN_STATES)[number];

export const SHOP_LIMITS = {
    titleMin: 3,
    titleMax: 120,
    descriptionMax: 5000,
    maxImages: 8,
    maxZones: 20,
    zoneNameMax: 60,
    pickupAddressMax: 300,
    maxStock: 100_000,
    maxLeadTimeDays: 365,
    maxEtaDays: 90,
    /** ₦10m, the most a delivery fee can be. */
    maxFeeNaira: 10_000_000,
} as const;

/** Where a product stands. Only "listed" ones are on the shop. */
export type ProductStatus = "draft" | "listed" | "paused_by_plan" | "paused_by_seller" | "hidden" | "removed";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
    draft: "Draft",
    listed: "Listed",
    paused_by_seller: "Paused",
    paused_by_plan: "Paused: plan limit",
    hidden: "Off the shop",
    removed: "Removed by MANDE",
};

export const PRODUCT_STATUS_TONES: Record<ProductStatus, StatusTone> = {
    draft: "gray",
    listed: "green",
    paused_by_seller: "amber",
    paused_by_plan: "amber",
    hidden: "red",
    removed: "red",
};

export const PRODUCT_STATUS_FILTER_ITEMS = (Object.keys(PRODUCT_STATUS_LABELS) as ProductStatus[]).map((status) => ({
    value: status,
    label: PRODUCT_STATUS_LABELS[status],
}));

/** One seller's part of an order, as they fulfil it. */
export type OrderPartStatus = "awaiting_fulfilment" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export const ORDER_PART_STATUS_LABELS: Record<OrderPartStatus, string> = {
    awaiting_fulfilment: "To fulfil",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
};

export const ORDER_PART_STATUS_TONES: Record<OrderPartStatus, StatusTone> = {
    awaiting_fulfilment: "amber",
    processing: "blue",
    shipped: "indigo",
    delivered: "green",
    cancelled: "gray",
    refunded: "red",
};

export const ORDER_PART_STATUS_FILTER_ITEMS = (Object.keys(ORDER_PART_STATUS_LABELS) as OrderPartStatus[]).map((status) => ({
    value: status,
    label: ORDER_PART_STATUS_LABELS[status],
}));

// ─── Returns (mirrors RETURN_STATUSES and RETURN_REASONS in mande-backend/src/constants/shop.ts) ───

export type ReturnStatus = "requested" | "approved" | "sent" | "refunded" | "rejected" | "cancelled" | "lapsed";
export type ReturnReason = "changed_mind" | "faulty" | "damaged" | "wrong_item" | "not_as_described";

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
    requested: "Waiting for you",
    approved: "Approved",
    sent: "On its way back",
    refunded: "Refunded",
    rejected: "Not accepted",
    cancelled: "Withdrawn",
    lapsed: "Lapsed",
};

export const RETURN_STATUS_TONES: Record<ReturnStatus, StatusTone> = {
    requested: "amber",
    approved: "blue",
    sent: "indigo",
    refunded: "green",
    rejected: "red",
    cancelled: "gray",
    lapsed: "gray",
};

export const RETURN_STATUS_FILTER_ITEMS = [
    { value: "open", label: "Open" },
    ...(Object.keys(RETURN_STATUS_LABELS) as ReturnStatus[]).map((status) => ({ value: status, label: RETURN_STATUS_LABELS[status] })),
];

export const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
    changed_mind: "Changed their mind",
    faulty: "Faulty",
    damaged: "Arrived damaged",
    wrong_item: "Wrong item sent",
    not_as_described: "Not as described",
};

/** Why a manufacturer can't sell right now (the API's standing.blockers). */
export type SellingBlocker =
    | "not_verified"
    | "account_not_active"
    | "no_active_plan"
    | "plan_cannot_sell"
    | "selling_off"
    | "access_revoked"
    | "no_payout_account"
    | "debt_overdue";

export const SELLING_BLOCKER_MESSAGES: Record<SellingBlocker, string> = {
    not_verified: "Verify your identity (your NIN) before you sell on the shop.",
    account_not_active: "Your account isn't active, so you can't sell on the shop right now.",
    no_active_plan: "You need an active plan to sell on the shop.",
    plan_cannot_sell: "Your plan doesn't include selling on the shop.",
    selling_off: "Selling on the shop is paused for everyone for now.",
    access_revoked: "Your shop access is paused.",
    no_payout_account: "Add a bank account to your wallet, so you can list products: your sales go to your wallet and you withdraw them there.",
    debt_overdue: "You've owed money on your wallet for too long, so your products are hidden. They come back once it's paid.",
};
