import { Suspense } from "react";
import SuperAdminActivityLogPage from "@/components/superAdminPlatform/activityLogPage";

export default function SuperAdminActivityLogRoute() {
    // The table keeps its search, filters, sort and page in the URL — read on the client
    return (
        <Suspense>
            <SuperAdminActivityLogPage />
        </Suspense>
    );
}
