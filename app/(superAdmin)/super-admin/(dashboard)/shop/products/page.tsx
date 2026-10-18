import { Suspense } from "react";
import { StaffShopProductsPage } from "@/components/superAdminPlatform/shopPage";

export default function StaffShopProductsRoute() {
    // The products table reads its page, search and filter from the URL
    return (
        <Suspense>
            <StaffShopProductsPage />
        </Suspense>
    );
}
