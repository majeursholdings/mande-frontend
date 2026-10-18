"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageOff, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef } from "@/components/customTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PRODUCT_STATUS_FILTER_ITEMS, PRODUCT_STATUS_LABELS, PRODUCT_STATUS_TONES, describeShopCategory, type ProductStatus } from "@/constant/shop";
import { SHOP_URL } from "@/constant/navigation";
import { getErrorMessage } from "@/lib/api";
import { formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { shopAdminService, type ShopAdminProduct } from "@/lib/services/shopService";
import ShopReasonForm from "../form/shopReasonForm";

const TABLE_ID = "all-products";
const PAGE_SIZE = 10;

const SELLER_KIND_ITEMS = [
    { value: "manufacturer", label: "Manufacturers" },
    { value: "mande", label: "MANDE stock" },
];

const COLUMNS: ColumnDef<ShopAdminProduct>[] = [
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
    {
        key: "seller",
        header: "Seller",
        cell: (product) => (
            <span className="flex flex-col">
                <span className="max-w-48 truncate text-mist-950">{product.seller?.name || "Unknown seller"}</span>
                <span className="text-xs text-mist-500">{product.seller?.kind === "mande" ? "MANDE stock" : "Manufacturer"}</span>
            </span>
        ),
    },
    { key: "price", header: "Price", cell: (product) => <span className="whitespace-nowrap font-medium text-mist-950">{formatPrice(fromKobo(product.priceKobo))}</span> },
    {
        key: "status",
        header: "Status",
        cell: (product) => <StatusBadge label={PRODUCT_STATUS_LABELS[product.status]} tone={PRODUCT_STATUS_TONES[product.status]} variant="pill" />,
    },
    { key: "updated", header: "Last changed", cell: (product) => <span className="whitespace-nowrap">{dayjs(product.updatedAt).format("D MMM YYYY")}</span> },
];

// ─────────────────────────────────────────────────────────────────────────────
// AllProductsTab: every product on the shop, any seller, a page at a time
// (search, status and seller filters in the URL). A super admin can take one
// off the shop with a reason (its seller is told and can't undo it) and put
// a removed one back, as paused for its seller to list again.
// ─────────────────────────────────────────────────────────────────────────────

export default function AllProductsTab() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const [removing, setRemoving] = useState<ShopAdminProduct | null>(null);
    const [restoring, setRestoring] = useState<ShopAdminProduct | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    const page = Math.max(1, Number(searchParams.get(`${TABLE_ID}_page`) ?? 1) || 1);
    const q = (searchParams.get(`${TABLE_ID}_search`) ?? "").trim();
    const statusParam = searchParams.get(`${TABLE_ID}_status`) ?? "";
    const status = PRODUCT_STATUS_FILTER_ITEMS.some((item) => item.value === statusParam) ? (statusParam as ProductStatus) : undefined;
    const kindParam = searchParams.get(`${TABLE_ID}_seller`) ?? "";
    const sellerKind = kindParam === "manufacturer" || kindParam === "mande" ? kindParam : undefined;

    const query = useQuery({
        queryKey: queryKeys.shop.allProducts({ page, q, status: status ?? null, sellerKind: sellerKind ?? null }),
        queryFn: () => shopAdminService.listProducts({ page, limit: PAGE_SIZE, q: q || undefined, status, sellerKind }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    // A change shows in this list, MANDE stock's, and the sellers' product counts
    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.shop.all });

    const restore = async (product: ShopAdminProduct) => {
        setIsRestoring(true);
        try {
            await shopAdminService.restoreProduct(product.id);
            await refresh();
            toast.success(`${product.title} is restored, paused for its seller to list`);
            setRestoring(null);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't restore the product. Please try again."));
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="flex flex-col">
            <DataTable
                tableId={TABLE_ID}
                columns={COLUMNS}
                rows={query.data?.products ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the products. Please refresh the page." : undefined}
                emptyMessage={q || status || sellerKind ? "No products match your search." : "No products on the shop yet."}
                rowActions={[
                    {
                        label: "View on the shop",
                        onSelect: (product) => window.open(`${SHOP_URL}/p/${product.slug}`, "_blank", "noopener"),
                        hidden: (product) => product.status !== "listed",
                    },
                    { label: "Take off the shop", tone: "danger", onSelect: setRemoving, hidden: (product) => product.status === "removed" },
                    { label: "Restore", onSelect: setRestoring, hidden: (product) => product.status !== "removed" },
                ]}
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search products" }}
                        filters={[
                            { title: "All statuses", paramKey: "status", items: PRODUCT_STATUS_FILTER_ITEMS },
                            { title: "All sellers", paramKey: "seller", items: SELLER_KIND_ITEMS },
                        ]}
                    />
                }
            />

            <Dialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
                <DialogContent className="max-w-120">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Take {removing?.title} off the shop?</DialogTitle>
                        <DialogDescription>
                            {removing?.seller?.kind === "mande"
                                ? "It comes off the shop until it's restored."
                                : "It comes off the shop until it's restored, and its seller can't list it again. They're told the reason."}
                        </DialogDescription>
                    </div>
                    {removing && (
                        <ShopReasonForm
                            key={removing.id}
                            label="Reason"
                            placeholder="e.g. The photos belong to another brand"
                            description="The seller sees this."
                            submitLabel="Take off the shop"
                            loadingLabel="Removing..."
                            onCancel={() => setRemoving(null)}
                            onSubmit={async (reason) => {
                                await shopAdminService.removeProduct(removing.id, reason);
                                await refresh();
                                toast.success(`${removing.title} is off the shop`);
                                setRemoving(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!restoring} onOpenChange={(open) => !open && !isRestoring && setRestoring(null)}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Restore {restoring?.title}?</DialogTitle>
                        <DialogDescription>It comes back paused: its seller decides when to list it again.</DialogDescription>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            onClick={() => setRestoring(null)}
                            disabled={isRestoring}
                            className="h-10 px-4 bg-mist-100 hover:bg-mist-200 text-mist-950 text-sm font-medium font-text rounded-button cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => restoring && void restore(restoring)}
                            disabled={isRestoring}
                            className="h-10 gap-2 px-4 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer"
                        >
                            {isRestoring && <Loader2 className="size-4 animate-spin" />}
                            {isRestoring ? "Restoring..." : "Restore"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
