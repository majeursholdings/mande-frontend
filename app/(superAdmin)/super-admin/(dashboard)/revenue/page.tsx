import { Suspense } from "react";
import SuperAdminRevenuePage from "@/components/superAdminPlatform/revenuePage";

export default function SuperAdminRevenueRoute() {
    // The table keeps its search, filter, sort and page in the URL — read on the client
    return (
        <Suspense>
            <SuperAdminRevenuePage />
        </Suspense>
    );
}
