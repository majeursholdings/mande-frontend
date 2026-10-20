import { Suspense } from "react";
import { ManufacturerShopReturnsPage } from "@/components/manufacturerPlatform/shopPage";

export default function ManufacturerShopReturnsRoute() {
    // The table reads its page and filters from the URL
    return (
        <Suspense>
            <ManufacturerShopReturnsPage />
        </Suspense>
    );
}
