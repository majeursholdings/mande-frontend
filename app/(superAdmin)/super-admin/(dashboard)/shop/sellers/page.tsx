import { Suspense } from "react";
import { StaffSellersPage } from "@/components/superAdminPlatform/shopPage";

export default function SuperAdminSellersRoute() {
    // The table reads its page, search and filter from the URL
    return (
        <Suspense>
            <StaffSellersPage />
        </Suspense>
    );
}
