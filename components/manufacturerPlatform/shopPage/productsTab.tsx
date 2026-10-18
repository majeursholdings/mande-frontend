"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageOff, Loader2, Upload } from "lucide-react";
import dayjs from "dayjs";
import { DataTable, ExportMenu, StatusBadge, TableToolbar, ToolbarActionButton, exportRows, type ColumnDef, type ExportFormat } from "@/components/customTable";
import ProductForm from "@/components/manufacturerPlatform/form/productForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
    PRODUCT_STATUS_FILTER_ITEMS,
    PRODUCT_STATUS_LABELS,
    PRODUCT_STATUS_TONES,
    SELLING_BLOCKER_MESSAGES,
    describeShopCategory,
    type ProductStatus,
} from "@/constant/shop";
import { SHOP_URL } from "@/constant/navigation";
import { getErrorMessage } from "@/lib/api";
import { formatPrice, fromKobo } from "@/lib/currency";
import type { SellerOverview, SellerProduct, SellerShopApi } from "@/lib/services/shopService";
import ProductImportDialog from "./productImportDialog";
import { exportFilename, productExportColumns } from "./shopTransfer";

const PAGE_SIZE = 10;

const PRIMARY_BUTTON_CLASS = "h-10 px-4 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer";
const SECONDARY_BUTTON_CLASS = "h-10 px-4 bg-mist-100 hover:bg-mist-200 text-mist-950 text-sm font-medium font-text rounded-button cursor-pointer";

function stockLabel(product: SellerProduct): string {
    if (product.stock === null) return product.leadTimeDays ? `Made to order (${product.leadTimeDays} days)` : "Made to order";
    return product.stock === 0 ? "Sold out" : `${product.stock} in stock`;
}

const COLUMNS: ColumnDef<SellerProduct>[] = [
    {
        key: "product",
        header: "Product",
        cell: (product) => {
            const cover = product.images[0]?.url;
            return (
                <span className="flex items-center gap-3">
                    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mist-100 text-mist-400">
                        {cover ? <Image src={cover} alt="" fill sizes="44px" className="object-cover" /> : <ImageOff className="size-4" aria-hidden />}
                    </span>
                    <span className="flex min-w-0 flex-col">
                        <span className="max-w-64 truncate font-medium text-mist-950">{product.title}</span>
                        <span className="max-w-64 truncate text-xs text-mist-500">{describeShopCategory(product.category, product.subcategory)}</span>
                    </span>
                </span>
            );
        },
    },
    { key: "price", header: "Price", cell: (product) => <span className="whitespace-nowrap font-medium text-mist-950">{formatPrice(fromKobo(product.priceKobo))}</span> },
    { key: "stock", header: "Stock", cell: (product) => <span className="whitespace-nowrap">{stockLabel(product)}</span> },
    {
        key: "status",
        header: "Status",
        cell: (product) => <StatusBadge label={PRODUCT_STATUS_LABELS[product.status]} tone={PRODUCT_STATUS_TONES[product.status]} variant="pill" />,
    },
    { key: "updated", header: "Last changed", cell: (product) => <span className="whitespace-nowrap">{dayjs(product.updatedAt).format("D MMM YYYY")}</span> },
];

// ─────────────────────────────────────────────────────────────────────────────
// ProductsTab: a seller's products, a page at a time from the API (search,
// status filter and page in the URL), with adding, editing, listing,
// pausing, moving back to drafts and deleting a never-listed draft, and
// exporting every matching product or importing a CSV file of them. Used for
// a manufacturer's store and for MANDE's own stock: `api` and `queryKey` say
// which. A product MANDE took down opens its reason instead of the form.
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductsTab({
    tableId,
    api,
    queryKey,
    overview,
    onManageZones,
    onChanged,
    exportName = "products",
}: {
    tableId: string;
    api: SellerShopApi;
    /** The list's query key, by its filters; the parent's overview is refreshed through onChanged. */
    queryKey: (filters: Record<string, unknown>) => readonly unknown[];
    overview: SellerOverview | undefined;
    onManageZones: () => void;
    /** After any change: refresh the overview (standing, product count). */
    onChanged: () => Promise<unknown>;
    /** The start of an export's file name, e.g. "mande-stock-products". */
    exportName?: string;
}) {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const [isCreating, setIsCreating] = useState(false);
    const [editing, setEditing] = useState<SellerProduct | null>(null);
    const [viewingRemoved, setViewingRemoved] = useState<SellerProduct | null>(null);
    const [deleting, setDeleting] = useState<SellerProduct | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const page = Math.max(1, Number(searchParams.get(`${tableId}_page`) ?? 1) || 1);
    const q = (searchParams.get(`${tableId}_search`) ?? "").trim();
    const statusParam = searchParams.get(`${tableId}_status`) ?? "";
    const status = PRODUCT_STATUS_FILTER_ITEMS.some((item) => item.value === statusParam) ? (statusParam as ProductStatus) : undefined;

    const filters = { page, q, status: status ?? null };
    const query = useQuery({
        queryKey: queryKey(filters),
        queryFn: () => api.listProducts({ page, limit: PAGE_SIZE, q: q || undefined, status }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    const standing = query.data?.standing ?? overview?.standing;
    const zones = overview?.seller.deliveryZones ?? [];
    const firstBlocker = standing?.blockers[0];
    const cannotListReason = firstBlocker ? SELLING_BLOCKER_MESSAGES[firstBlocker] : null;
    const atLimit = !!standing && standing.maxProducts !== null && standing.productCount >= standing.maxProducts;
    const cannotCreateReason = !standing
        ? null
        : atLimit
          ? `You've reached your plan's limit of ${standing.maxProducts} products.`
          : !standing.canCreate && cannotListReason
            ? cannotListReason
            : null;

    const refresh = async () => {
        await Promise.all([queryClient.invalidateQueries({ queryKey: queryKey({}).slice(0, -1) }), onChanged()]);
    };

    const changeStatus = async (product: SellerProduct, next: "listed" | "paused_by_seller" | "draft") => {
        setBusyId(product.id);
        try {
            await api.setProductStatus(product.id, next);
            await refresh();
            toast.success(next === "listed" ? `${product.title} is on the shop` : next === "draft" ? `${product.title} is back in drafts` : `${product.title} is paused`);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't change the product. Please try again."));
        } finally {
            setBusyId(null);
        }
    };

    const deleteDraft = async (product: SellerProduct) => {
        setBusyId(product.id);
        try {
            await api.deleteProduct(product.id);
            await refresh();
            toast.success(`${product.title} is deleted`);
            setDeleting(null);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't delete the draft. Please try again."));
        } finally {
            setBusyId(null);
        }
    };

    // Every product matching the search and status, not just this page
    const exportProducts = async (format: ExportFormat) => {
        const data = await api.exportProducts({ q: q || undefined, status });
        if (data.products.length === 0) {
            toast.info("There are no products to export.");
            return;
        }
        await exportRows(data.products, productExportColumns(data.deliveryZones), {
            format,
            filename: exportFilename(exportName),
            title: status ? `Products (${PRODUCT_STATUS_LABELS[status]})` : "Products",
        });
        if (data.truncated) toast.info(`Exported the newest ${data.products.length.toLocaleString("en-NG")} of ${data.total.toLocaleString("en-NG")}. Filter the table to export the rest.`);
    };

    const busy = (product: SellerProduct) => (busyId === product.id ? "Saving..." : null);

    return (
        <div className="flex flex-col">
            <DataTable
                tableId={tableId}
                columns={COLUMNS}
                rows={query.data?.products ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the products. Please refresh the page." : undefined}
                emptyMessage={q || status ? "No products match your search." : "No products yet. Add your first one."}
                onRowClick={(product) => (product.status === "removed" ? setViewingRemoved(product) : setEditing(product))}
                rowActions={[
                    { label: "Edit", onSelect: setEditing, hidden: (product) => product.status === "removed" },
                    { label: "See why it was removed", onSelect: setViewingRemoved, hidden: (product) => product.status !== "removed" },
                    {
                        label: "View on the shop",
                        onSelect: (product) => window.open(`${SHOP_URL}/p/${product.slug}`, "_blank", "noopener"),
                        hidden: (product) => product.status !== "listed",
                    },
                    {
                        label: "List on the shop",
                        onSelect: (product) => void changeStatus(product, "listed"),
                        hidden: (product) => product.status !== "draft" && product.status !== "paused_by_seller",
                        disabledReason: (product) => busy(product) ?? cannotListReason,
                    },
                    {
                        label: "Pause",
                        onSelect: (product) => void changeStatus(product, "paused_by_seller"),
                        hidden: (product) => !["listed", "paused_by_plan", "hidden"].includes(product.status),
                        disabledReason: busy,
                    },
                    {
                        label: "Move to drafts",
                        onSelect: (product) => void changeStatus(product, "draft"),
                        hidden: (product) => product.status !== "listed" && product.status !== "paused_by_seller",
                        disabledReason: busy,
                    },
                    {
                        label: "Delete draft",
                        tone: "danger",
                        onSelect: setDeleting,
                        hidden: (product) => product.status !== "draft" || !!product.listedAt,
                    },
                ]}
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search your products" }}
                        filters={[{ title: "All statuses", paramKey: "status", items: PRODUCT_STATUS_FILTER_ITEMS }]}
                        actions={
                            <>
                                <ExportMenu onExport={exportProducts} />
                                <button
                                    type="button"
                                    onClick={() => setIsImporting(true)}
                                    disabled={!overview}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-button border border-gray-300 bg-white text-sm font-medium font-text text-mist-950 cursor-pointer whitespace-nowrap transition-colors hover:bg-mist-50 disabled:cursor-not-allowed disabled:text-mist-500"
                                >
                                    <Upload className="size-4" aria-hidden />
                                    Import
                                </button>
                                <span title={cannotCreateReason ?? undefined}>
                                    <ToolbarActionButton label="New product" onClick={() => setIsCreating(true)} disabled={!standing || !!cannotCreateReason} />
                                </span>
                            </>
                        }
                    />
                }
            />
            {cannotCreateReason && <p className="mt-3 text-xs font-text text-mist-500">{cannotCreateReason}</p>}

            <ProductImportDialog open={isImporting} onOpenChange={setIsImporting} api={api} zones={zones} onImported={refresh} />

            <Dialog open={isCreating} onOpenChange={(open) => !open && setIsCreating(false)}>
                <DialogContent className="max-w-160">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>New product</DialogTitle>
                        <DialogDescription>Save it as a draft to finish later, or list it to put it on the shop now.</DialogDescription>
                    </div>
                    {isCreating && (
                        <ProductForm
                            zones={zones}
                            defaultPickupAddress={overview?.seller.defaultPickupAddress ?? ""}
                            canList={!!standing?.canList}
                            cannotListReason={cannotListReason}
                            onCancel={() => setIsCreating(false)}
                            onManageZones={() => {
                                setIsCreating(false);
                                onManageZones();
                            }}
                            onCreate={async (payload) => {
                                const product = await api.createProduct(payload);
                                await refresh();
                                toast.success(product.status === "listed" ? `${product.title} is on the shop` : `${product.title} is saved as a draft`);
                                setIsCreating(false);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent className="max-w-160">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Edit {editing?.title}</DialogTitle>
                        <DialogDescription>
                            {editing?.status === "listed"
                                ? "It's on the shop: changes show there straight away. Orders already placed keep what was bought."
                                : "Changes are saved to the product. List it when it's ready."}
                        </DialogDescription>
                    </div>
                    {editing && (
                        <ProductForm
                            key={editing.id}
                            product={editing}
                            zones={zones}
                            defaultPickupAddress={overview?.seller.defaultPickupAddress ?? ""}
                            canList={!!standing?.canList}
                            onCancel={() => setEditing(null)}
                            onManageZones={() => {
                                setEditing(null);
                                onManageZones();
                            }}
                            onUpdate={async (payload) => {
                                const product = await api.updateProduct(editing.id, payload);
                                await refresh();
                                toast.success(`${product.title} is saved`);
                                setEditing(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingRemoved} onOpenChange={(open) => !open && setViewingRemoved(null)}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>{viewingRemoved?.title} was taken off the shop</DialogTitle>
                        <DialogDescription>MANDE removed it, so it can&apos;t be changed or listed. Contact support if you think this is a mistake.</DialogDescription>
                    </div>
                    <p className="rounded-lg bg-mist-100 px-3.5 py-3 text-sm font-text text-mist-900">{viewingRemoved?.removalReason ?? "No reason was given."}</p>
                    <div className="flex justify-end">
                        <Button type="button" onClick={() => setViewingRemoved(null)} className={SECONDARY_BUTTON_CLASS}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleting} onOpenChange={(open) => !open && !busyId && setDeleting(null)}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Delete {deleting?.title}?</DialogTitle>
                        <DialogDescription>The draft and its photos are deleted. This can&apos;t be undone.</DialogDescription>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button type="button" onClick={() => setDeleting(null)} disabled={!!busyId} className={SECONDARY_BUTTON_CLASS}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={() => deleting && void deleteDraft(deleting)} disabled={!!busyId} className={`${PRIMARY_BUTTON_CLASS} gap-2`}>
                            {busyId && <Loader2 className="size-4 animate-spin" />}
                            {busyId ? "Deleting..." : "Delete draft"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
