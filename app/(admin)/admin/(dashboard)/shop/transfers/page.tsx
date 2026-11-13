import { Suspense } from "react";
import { StaffShopTransfersPage } from "@/components/superAdminPlatform/shopPage";

export default function StaffShopTransfersRoute() {
    // The transfers table reads its page and filter from the URL
    return (
        <Suspense>
            <StaffShopTransfersPage />
        </Suspense>
    );
}
