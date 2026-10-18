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
import { queryKeys } from "@/lib/queryKeys";
import { mandeStockService } from "@/lib/services/shopService";
import AllProductsTab from "./allProductsTab";
import SellersTab from "./sellersTab";

// ─────────────────────────────────────────────────────────────────────────────
// MANDE Shop for staff, as sub-pages under one layout, shared by both
// platforms. Admins and super admins run MANDE's own stock: its overview,
// products (the same table and form a manufacturer uses, on MANDE's seller
// record), orders and delivery zones. Super admins also see every product
// (taking one down or restoring it) and the sellers (their shop access).
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
    const { isSuperAdmin, base } = useShopBase();
    const links = [
        { href: base, label: "Overview", exact: true },
        { href: `${base}/products`, label: "MANDE stock" },
        { href: `${base}/orders`, label: "Orders" },
        { href: `${base}/delivery-zones`, label: "Delivery zones" },
        ...(isSuperAdmin
            ? [
                  { href: `${base}/all-products`, label: "All products" },
                  { href: `${base}/sellers`, label: "Sellers" },
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

export { AllProductsTab as StaffAllProductsPage, SellersTab as StaffSellersPage };
