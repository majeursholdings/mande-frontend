import { Suspense } from "react";
import { StaffShopReturnsPage } from "@/components/superAdminPlatform/shopPage";

export default function SuperAdminMandeReturnsRoute() {
    // The table reads its page and filters from the URL
    return (
        <Suspense>
            <StaffShopReturnsPage />
        </Suspense>
    );
}
