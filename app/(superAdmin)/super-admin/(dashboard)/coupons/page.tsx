import { Suspense } from "react";
import CouponsPage from "@/components/superAdminPlatform/couponsPage";

export default function SuperAdminCouponsRoute() {
    // The table keeps its search and status filter in the URL, read on the client
    return (
        <Suspense>
            <CouponsPage />
        </Suspense>
    );
}
