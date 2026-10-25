import { Suspense } from "react";
import { ManufacturerShopCouponsPage } from "@/components/manufacturerPlatform/shopPage";

export default function ManufacturerShopCouponsRoute() {
    // The table reads its page from the URL
    return (
        <Suspense>
            <ManufacturerShopCouponsPage />
        </Suspense>
    );
}
