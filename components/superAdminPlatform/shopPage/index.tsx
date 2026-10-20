"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/adminPlatform/pageHeader";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";
import OrdersPanel from "@/components/manufacturerPlatform/shopPage/ordersPanel";
import ProductsTab from "@/components/manufacturerPlatform/shopPage/productsTab";
import ShopOverview from "@/components/manufacturerPlatform/shopPage/shopOverview";
import ShopSubNav from "@/components/manufacturerPlatform/shopPage/shopSubNav";
import ZonesTab from "@/components/manufacturerPlatform/shopPage/zonesTab";
import { ADMIN_SHOP_URL } from "@/constant/admin";
import { SUPER_ADMIN_SHOP_URL } from "@/constant/superAdmin";
import { useShopLiveUpdates } from "@/hooks/useShopLiveUpdates";
import { queryKeys } from "@/lib/queryKeys";
import { allReturnsService, mandeStockService } from "@/lib/services/shopService";
import AllProductsTab from "./allProductsTab";
import ReturnsPanel from "@/components/manufacturerPlatform/shopPage/returnsPanel";
import ReviewsPanel from "@/components/manufacturerPlatform/shopPage/reviewsPanel";
import AllReviewsTab from "./allReviewsTab";
import ReportsTab from "./reportsTab";
import SellersTab from "./sellersTab";

// ─────────────────────────────────────────────────────────────────────────────
// MANDE Shop for staff, as sub-pages under one layout, shared by both
// platforms. Admins and super admins run MANDE's own stock: its overview,
// products (the same table and form a manufacturer uses, on MANDE's seller
// record), orders and delivery zones. Super admins also see every product
// (taking one down or restoring it), the sellers (their shop access),
// every return (to step in on any seller's) and customers' reports of
// products.
// ─────────────────────────────────────────────────────────────────────────────

/** Where this platform's shop pages are: /admin/shop or /super-admin/shop. */
function useShopBase() {
    const platform = useStaffPlatform();
    const isSuperAdmin = platform.key === "super-admin";
    const base = isSuperAdmin ? SUPER_ADMIN_SHOP_URL : ADMIN_SHOP_URL;
    return { isSuperAdmin, base };
}

/** MANDE's seller record (zones, standing), shared by the pages. */
function useMandeShop() {
    const queryClient = useQueryClient();
    const query = useQuery({ queryKey: queryKeys.shop.mande(), queryFn: () => mandeStockService.getOverview(), staleTime: 30_000 });
    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.shop.mande() });
    return { query, overview: query.data, refresh, queryClient };
}

export function StaffShopLayout({ children }: { children: ReactNode }) {
    // MANDE stock's new orders, cancellations and returns show without a reload
    useShopLiveUpdates();
    const { isSuperAdmin, base } = useShopBase();
    const links = [
        { href: base, label: "Overview", exact: true },
        { href: `${base}/products`, label: "MANDE stock" },
        { href: `${base}/orders`, label: "Orders" },
        // Admins look after returns of MANDE stock; super admins can also step in on any seller's
        { href: isSuperAdmin ? `${base}/mande-returns` : `${base}/returns`, label: isSuperAdmin ? "MANDE returns" : "Returns" },
        // Admins reply to reviews of MANDE stock; super admins also look after every review
        { href: isSuperAdmin ? `${base}/mande-reviews` : `${base}/reviews`, label: isSuperAdmin ? "MANDE reviews" : "Reviews" },
        { href: `${base}/delivery-zones`, label: "Delivery zones" },
        ...(isSuperAdmin
            ? [
                  { href: `${base}/all-products`, label: "All products" },
                  { href: `${base}/sellers`, label: "Sellers" },
                  { href: `${base}/returns`, label: "All returns" },
                  { href: `${base}/reviews`, label: "All reviews" },
                  { href: `${base}/reports`, label: "Reports" },
              ]
            : []),
    ];
    return (
        <div className="flex flex-col gap-6">
            <AdminPageHeader
                title="Shop"
                description={
                    isSuperAdmin
                        ? "MANDE Shop: MANDE's own stock, its orders and delivery zones, every product on the shop, and the manufacturers selling there. The shop's rules are in Settings › Shop."
                        : "MANDE's own stock on MANDE Shop: its products, orders and delivery zones. Its sales are paid to MANDE in full."
                }
            />
            <ShopSubNav links={links} label="Shop pages" />
            {children}
        </div>
    );
}

export function StaffShopOverviewPage() {
    const { base } = useShopBase();
    return (
        <ShopOverview
            api={mandeStockService}
            queryKey={(period) => queryKeys.shop.mandeSummary(period)}
            links={{ orders: `${base}/orders`, products: `${base}/products` }}
        />
    );
}

export function StaffShopProductsPage() {
    const router = useRouter();
    const { base } = useShopBase();
    const { overview, refresh, queryClient } = useMandeShop();
    return (
        <ProductsTab
            tableId="mande-products"
            api={mandeStockService}
            exportName="mande-stock-products"
            queryKey={(filters) => queryKeys.shop.mandeProducts(filters)}
            overview={overview}
            onManageZones={() => router.push(`${base}/delivery-zones`)}
            onChanged={() =>
                Promise.all([
                    refresh(),
                    queryClient.invalidateQueries({ queryKey: queryKeys.shop.mandeSummary("").slice(0, -1) }),
                    queryClient.invalidateQueries({ queryKey: queryKeys.shop.allProducts({}).slice(0, -1) }),
                ])
            }
        />
    );
}

export function StaffShopOrdersPage() {
    return <OrdersPanel tableId="mande-orders" api={mandeStockService} queryKey={(filters) => queryKeys.shop.mandeOrders(filters)} payoutLabel="Paid to MANDE" exportName="mande-stock-orders" />;
}

export function StaffShopReviewsPage() {
    return <ReviewsPanel tableId="mande-reviews" api={mandeStockService} queryKey={(filters) => queryKeys.shop.mandeReviews(filters)} />;
}

export function StaffShopReturnsPage() {
    return <ReturnsPanel tableId="mande-returns" api={mandeStockService} queryKey={(filters) => queryKeys.shop.mandeReturns(filters)} />;
}

export function StaffAllReturnsPage() {
    return <ReturnsPanel tableId="all-returns" api={allReturnsService} queryKey={(filters) => queryKeys.shop.allReturns(filters)} showSeller />;
}

export function StaffShopZonesPage() {
    const { query, overview, refresh, queryClient } = useMandeShop();
    return (
        <ZonesTab
            api={mandeStockService}
            zones={overview?.seller.deliveryZones}
            isLoading={query.isPending}
            onChanged={() => Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: queryKeys.shop.mandeProducts({}).slice(0, -1) })])}
        />
    );
}

export { AllProductsTab as StaffAllProductsPage, AllReviewsTab as StaffAllReviewsPage, ReportsTab as StaffReportsPage, SellersTab as StaffSellersPage };
