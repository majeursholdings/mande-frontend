import dayjs from "dayjs";
import type { ExportColumn } from "@/components/customTable";
import { ORDER_PART_STATUS_LABELS, PRODUCT_STATUS_LABELS, SHOP_CATEGORIES } from "@/constant/shop";
import { SHOP_URL } from "@/constant/navigation";
import { fromKobo } from "@/lib/currency";
import type { SellerProduct, ShopAdminProduct, ShopOrderPart } from "@/lib/services/shopService";

// ─────────────────────────────────────────────────────────────────────────────
// The shop tables' columns when exported, and the product import template.
// A product export's headings are the import's own (the API reads them in
// shop.transfer.ts: keep the two in step), so a seller can export, edit
// prices or stock in a spreadsheet, save it as CSV and import it back. The
// columns after the template's (status, photos, rating, link, dates) are
// read-only: the import skips them.
// ─────────────────────────────────────────────────────────────────────────────

type Zone = { id: string; name: string };

const categoryName = (slug: string) => SHOP_CATEGORIES.find((category) => category.slug === slug)?.name ?? slug;
const subcategoryName = (categorySlug: string, slug: string) =>
    SHOP_CATEGORIES.find((category) => category.slug === categorySlug)?.subcategories.find((sub) => sub.slug === slug)?.name ?? slug;
const naira = (kobo: number) => fromKobo(kobo);
const feeFor = (product: SellerProduct, zoneId: string) => product.delivery.fees.find((fee) => fee.zoneId === zoneId);

/** The columns a product import reads, with each of the seller's zones. */
function templateColumns(zones: Zone[]): ExportColumn<SellerProduct>[] {
    return [
        { header: "ID", value: (product) => product.id, skipInPdf: true },
        { header: "Title", value: (product) => product.title },
        { header: "Description", value: (product) => product.description, skipInPdf: true },
        { header: "Category", value: (product) => categoryName(product.category) },
        { header: "Subcategory", value: (product) => subcategoryName(product.category, product.subcategory) },
        { header: "Price (₦)", value: (product) => naira(product.priceKobo), kind: "money" },
        { header: "Stock", value: (product) => product.stock, kind: "number" },
        { header: "Lead time (days)", value: (product) => product.leadTimeDays, kind: "number", skipInPdf: true },
        { header: "Pickup", value: (product) => (product.delivery.pickup.available ? "Yes" : "No"), skipInPdf: true },
        { header: "Pickup address", value: (product) => product.delivery.pickup.address, skipInPdf: true },
        ...zones.flatMap((zone): ExportColumn<SellerProduct>[] => [
            { header: `${zone.name} delivery fee (₦)`, value: (product) => { const fee = feeFor(product, zone.id); return fee ? naira(fee.feeKobo) : null; }, kind: "money", skipInPdf: true },
            { header: `${zone.name} extra item fee (₦)`, value: (product) => { const fee = feeFor(product, zone.id); return fee ? naira(fee.extraUnitKobo) : null; }, kind: "money", skipInPdf: true },
            { header: `${zone.name} delivery days`, value: (product) => feeFor(product, zone.id)?.etaDays, kind: "number", skipInPdf: true },
        ]),
    ];
}

/** A seller's products, exported: the template's columns, then the read-only ones. */
export function productExportColumns(zones: Zone[]): ExportColumn<SellerProduct>[] {
    return [
        ...templateColumns(zones),
        { header: "Status", value: (product) => PRODUCT_STATUS_LABELS[product.status] },
        { header: "Photos", value: (product) => product.images.length, kind: "number", skipInPdf: true },
        { header: "Rating", value: (product) => (product.rating.count ? product.rating.average : null), kind: "number", skipInPdf: true },
        { header: "Reviews", value: (product) => product.rating.count, kind: "number", skipInPdf: true },
        { header: "Link", value: (product) => (product.status === "listed" ? `${SHOP_URL}/p/${product.slug}` : null), skipInPdf: true },
        { header: "Created", value: (product) => new Date(product.createdAt), kind: "date" },
    ];
}

/** The import template: just the headings, for the seller's zones. */
export function productTemplateColumns(zones: Zone[]): ExportColumn<SellerProduct>[] {
    return templateColumns(zones);
}

/** Every product on the shop (super admins): who sells it, and its main details. */
export const ADMIN_PRODUCT_EXPORT_COLUMNS: ExportColumn<ShopAdminProduct>[] = [
    { header: "ID", value: (product) => product.id, skipInPdf: true },
    { header: "Title", value: (product) => product.title },
    { header: "Seller", value: (product) => product.seller?.name ?? "" },
    { header: "Seller type", value: (product) => (product.seller?.kind === "mande" ? "MANDE stock" : "Manufacturer"), skipInPdf: true },
    { header: "Category", value: (product) => categoryName(product.category) },
    { header: "Subcategory", value: (product) => subcategoryName(product.category, product.subcategory) },
    { header: "Price (₦)", value: (product) => naira(product.priceKobo), kind: "money" },
    { header: "Stock", value: (product) => product.stock, kind: "number" },
    { header: "Status", value: (product) => PRODUCT_STATUS_LABELS[product.status] },
    { header: "Removal reason", value: (product) => product.removalReason, skipInPdf: true },
    { header: "Rating", value: (product) => (product.rating.count ? product.rating.average : null), kind: "number", skipInPdf: true },
    { header: "Reviews", value: (product) => product.rating.count, kind: "number", skipInPdf: true },
    { header: "Link", value: (product) => (product.status === "listed" ? `${SHOP_URL}/p/${product.slug}` : null), skipInPdf: true },
    { header: "Created", value: (product) => new Date(product.createdAt), kind: "date" },
];

const itemCount = (order: ShopOrderPart) => order.lines.reduce((sum, line) => sum + line.quantity, 0);

/** A seller's part of each order. `payoutLabel` heads what they're paid ("Paid to you", "Paid to MANDE"). */
export function orderExportColumns(payoutLabel: string): ExportColumn<ShopOrderPart>[] {
    return [
        { header: "Order", value: (order) => order.code },
        { header: "Paid", value: (order) => (order.paidAt ? new Date(order.paidAt) : null), kind: "date" },
        { header: "Customer", value: (order) => order.customer.name },
        { header: "Phone", value: (order) => order.customer.phone, skipInPdf: true },
        { header: "Address", value: (order) => order.customer.street, skipInPdf: true },
        { header: "City", value: (order) => order.customer.city },
        { header: "State", value: (order) => order.customer.state },
        { header: "Items", value: (order) => order.lines.map((line) => `${line.quantity} × ${line.title}${line.pickup ? " (pickup)" : ""}`).join("; ") },
        { header: "Quantity", value: itemCount, kind: "number" },
        { header: "Items total (₦)", value: (order) => naira(order.itemsSubtotalKobo), kind: "money" },
        { header: "Delivery (₦)", value: (order) => naira(order.deliveryFeeKobo), kind: "money" },
        { header: "Platform charge (₦)", value: (order) => naira(order.platformChargeKobo), kind: "money" },
        { header: `${payoutLabel} (₦)`, value: (order) => naira(order.sellerShareKobo), kind: "money" },
        { header: "Status", value: (order) => ORDER_PART_STATUS_LABELS[order.status] },
        { header: "Shipped", value: (order) => (order.shippedAt ? new Date(order.shippedAt) : null), kind: "date", skipInPdf: true },
        { header: "Delivered", value: (order) => (order.deliveredAt ? new Date(order.deliveredAt) : null), kind: "date", skipInPdf: true },
    ];
}

/** A file name for an export: "<what>-<today>". */
export const exportFilename = (what: string) => `${what}-${dayjs().format("YYYY-MM-DD")}`;
