import { Suspense } from "react";
import { StaffReportsPage } from "@/components/superAdminPlatform/shopPage";

export default function SuperAdminShopReportsRoute() {
    // The table reads its page and status filter from the URL
    return (
        <Suspense>
            <StaffReportsPage />
        </Suspense>
    );
}
