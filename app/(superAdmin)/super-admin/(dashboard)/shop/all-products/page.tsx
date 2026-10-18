import { Suspense } from "react";
import { StaffAllProductsPage } from "@/components/superAdminPlatform/shopPage";

export default function SuperAdminAllProductsRoute() {
    // The table reads its page, search and filters from the URL
    return (
        <Suspense>
            <StaffAllProductsPage />
        </Suspense>
    );
}
