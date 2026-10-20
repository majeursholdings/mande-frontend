import { Suspense } from "react";
import { ManufacturerShopPayoutsPage } from "@/components/manufacturerPlatform/shopPage";

export default function ManufacturerShopPayoutsRoute() {
    // The table reads its page and filter from the URL
    return (
        <Suspense>
            <ManufacturerShopPayoutsPage />
        </Suspense>
    );
}
