"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LoadError from "@/components/manufacturerPlatform/loadError";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MANUFACTURER_SHOP_ORDERS_URL,
    MANUFACTURER_SHOP_PAYOUTS_URL,
    MANUFACTURER_SHOP_RETURNS_URL,
    MANUFACTURER_SHOP_REVIEWS_URL,
    MANUFACTURER_SHOP_PRODUCTS_URL,
    MANUFACTURER_SHOP_URL,
    MANUFACTURER_SHOP_ZONES_URL,
} from "@/constant/manufacturer";
import { queryKeys } from "@/lib/queryKeys";
import { myShopService } from "@/lib/services/shopService";
import PageHeader from "../pageHeader";
import OrdersPanel from "./ordersPanel";
import PayoutsTab from "./payoutsTab";
import ProductsTab from "./productsTab";
import ReturnsPanel from "./returnsPanel";
import ReviewsPanel from "./reviewsPanel";
import ShopOverview from "./shopOverview";
import ShopSubNav from "./shopSubNav";
import StandingBanner from "./standingBanner";
import ZonesTab from "./zonesTab";

// ─────────────────────────────────────────────────────────────────────────────
// The manufacturer's store on MANDE Shop, as sub-pages under one layout: the
// header, what's stopping them selling (with the fix for each), and the
// sub-page links; then the overview, products, orders, delivery zones or
// payouts. Their store is set up the first time they open any of them. Every
// page shares the one store query (useMyShop), so moving between them
// doesn't load it again.
// ─────────────────────────────────────────────────────────────────────────────

const SHOP_LINKS = [
    { href: MANUFACTURER_SHOP_URL, label: "Overview", exact: true },
    { href: MANUFACTURER_SHOP_PRODUCTS_URL, label: "Products" },
    { href: MANUFACTURER_SHOP_ORDERS_URL, label: "Orders" },
    { href: MANUFACTURER_SHOP_RETURNS_URL, label: "Returns" },
    { href: MANUFACTURER_SHOP_REVIEWS_URL, label: "Reviews" },
    { href: MANUFACTURER_SHOP_ZONES_URL, label: "Delivery zones" },
    { href: MANUFACTURER_SHOP_PAYOUTS_URL, label: "Payouts" },
];

/** The signed-in manufacturer's store, and refreshing it after a change. */
function useMyShop() {
    const queryClient = useQueryClient();
    const query = useQuery({ queryKey: queryKeys.shop.myShop(), queryFn: () => myShopService.getOverview(), staleTime: 30_000 });
    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.shop.myShop() });
    return { query, overview: query.data, refresh, queryClient };
}

export function ManufacturerShopLayout({ children }: { children: ReactNode }) {
    const { query, overview } = useMyShop();
    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Shop"
                description="Sell your furniture on MANDE Shop. Customers pay MANDE securely, and your share of each sale reaches your MANDE wallet 24 hours after delivery."
            />
            {query.isPending ? (
                <Skeleton className="h-20 w-full rounded-xl" />
            ) : query.isError ? (
                <LoadError>We couldn&apos;t load your shop. Please refresh the page.</LoadError>
            ) : (
                overview && <StandingBanner overview={overview} />
            )}
            <ShopSubNav links={SHOP_LINKS} label="Shop pages" />
            {children}
        </div>
    );
}

export function ManufacturerShopOverviewPage() {
    return (
        <ShopOverview
            api={myShopService}
            queryKey={(period) => queryKeys.shop.mySummary(period)}
            links={{ orders: MANUFACTURER_SHOP_ORDERS_URL, products: MANUFACTURER_SHOP_PRODUCTS_URL }}
        />
    );
}

export function ManufacturerShopProductsPage() {
    const router = useRouter();
    const { overview, refresh, queryClient } = useMyShop();
    return (
        <ProductsTab
            tableId="shop-products"
            api={myShopService}
            queryKey={(filters) => queryKeys.shop.myProducts(filters)}
            overview={overview}
            onManageZones={() => router.push(MANUFACTURER_SHOP_ZONES_URL)}
            // A product change shows on the overview too
            onChanged={() => Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: queryKeys.shop.mySummary("").slice(0, -1) })])}
        />
    );
}

export function ManufacturerShopOrdersPage() {
    return <OrdersPanel tableId="shop-orders" api={myShopService} queryKey={(filters) => queryKeys.shop.myOrders(filters)} />;
}

export function ManufacturerShopReviewsPage() {
    return (
        <ReviewsPanel
            tableId="shop-reviews"
            api={myShopService}
            queryKey={(filters) => queryKeys.shop.myReviews(filters)}
            onReport={(id, reason) => myShopService.reportReview(id, reason)}
        />
    );
}

export function ManufacturerShopReturnsPage() {
    return <ReturnsPanel tableId="shop-returns" api={myShopService} queryKey={(filters) => queryKeys.shop.myReturns(filters)} />;
}

export function ManufacturerShopZonesPage() {
    const { query, overview, refresh, queryClient } = useMyShop();
    return (
        <ZonesTab
            api={myShopService}
            zones={overview?.seller.deliveryZones}
            isLoading={query.isPending}
            // A removed zone takes its fees off the products too
            onChanged={() => Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: queryKeys.shop.myProducts({}).slice(0, -1) })])}
        />
    );
}

export function ManufacturerShopPayoutsPage() {
    const { query, overview } = useMyShop();
    return <PayoutsTab payout={overview?.seller.payout} isLoading={query.isPending} />;
}
