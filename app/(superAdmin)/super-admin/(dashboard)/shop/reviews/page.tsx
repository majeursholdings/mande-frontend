import { Suspense } from "react";
import { StaffAllReviewsPage } from "@/components/superAdminPlatform/shopPage";

export default function SuperAdminAllReviewsRoute() {
    // The table reads its page and filters from the URL
    return (
        <Suspense>
            <StaffAllReviewsPage />
        </Suspense>
    );
}
