import { Suspense } from "react";
import { StaffAllReturnsPage } from "@/components/superAdminPlatform/shopPage";

export default function SuperAdminAllReturnsRoute() {
    // The table reads its page and filters from the URL
    return (
        <Suspense>
            <StaffAllReturnsPage />
        </Suspense>
    );
}
