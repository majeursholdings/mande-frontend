import { Suspense } from "react";
import { ManufacturerShopReviewsPage } from "@/components/manufacturerPlatform/shopPage";

export default function ManufacturerShopReviewsRoute() {
    // The table reads its page and filters from the URL
    return (
        <Suspense>
            <ManufacturerShopReviewsPage />
        </Suspense>
    );
}
