import { Suspense } from "react";
import { StaffShopCouponsPage } from "@/components/superAdminPlatform/shopPage";

export default function StaffShopCouponsRoute() {
    // The table reads its page from the URL
    return (
        <Suspense>
            <StaffShopCouponsPage />
        </Suspense>
    );
}
