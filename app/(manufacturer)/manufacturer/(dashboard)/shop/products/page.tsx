import { Suspense } from "react";
import { ManufacturerShopProductsPage } from "@/components/manufacturerPlatform/shopPage";

export default function ManufacturerShopProductsRoute() {
    // The products table reads its page, search and filter from the URL
    return (
        <Suspense>
            <ManufacturerShopProductsPage />
        </Suspense>
    );
}
