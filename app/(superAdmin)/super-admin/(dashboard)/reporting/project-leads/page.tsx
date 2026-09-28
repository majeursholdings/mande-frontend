import { Suspense } from "react";
import SuperAdminProjectLeadReportPage from "@/components/superAdminPlatform/projectLeadReportPage";

export default function SuperAdminProjectLeadReportRoute() {
    // The table keeps its search, filter and page in the URL — read on the client
    return (
        <Suspense>
            <SuperAdminProjectLeadReportPage />
        </Suspense>
    );
}
