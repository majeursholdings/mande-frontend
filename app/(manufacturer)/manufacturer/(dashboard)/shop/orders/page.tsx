import { Suspense } from "react";
import { ManufacturerShopOrdersPage } from "@/components/manufacturerPlatform/shopPage";

export default function ManufacturerShopOrdersRoute() {
    // The orders table reads its page and filter from the URL
    return (
        <Suspense>
            <ManufacturerShopOrdersPage />
        </Suspense>
    );
}
