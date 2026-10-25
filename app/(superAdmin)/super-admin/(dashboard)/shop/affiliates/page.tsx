import { Suspense } from "react";
import { StaffAffiliatesPage } from "@/components/superAdminPlatform/shopPage";

export default function SuperAdminShopAffiliatesRoute() {
    // The table reads its page and sort from the URL
    return (
        <Suspense>
            <StaffAffiliatesPage />
        </Suspense>
    );
}
