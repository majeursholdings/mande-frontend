import { Suspense } from "react";
import { StaffShopReviewsPage } from "@/components/superAdminPlatform/shopPage";

export default function AdminShopReviewsRoute() {
    // The table reads its page and filters from the URL
    return (
        <Suspense>
            <StaffShopReviewsPage />
        </Suspense>
    );
}
