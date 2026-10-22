import { Suspense } from "react";
import { StaffShopPaymentsPage } from "@/components/superAdminPlatform/shopPage";

export default function SuperAdminShopPaymentsRoute() {
    // The tables read their tab, page and filters from the URL
    return (
        <Suspense>
            <StaffShopPaymentsPage />
        </Suspense>
    );
}
