import { Suspense } from "react";
import { StaffShopOrdersPage } from "@/components/superAdminPlatform/shopPage";

export default function StaffShopOrdersRoute() {
    // The orders table reads its page and filter from the URL
    return (
        <Suspense>
            <StaffShopOrdersPage />
        </Suspense>
    );
}
