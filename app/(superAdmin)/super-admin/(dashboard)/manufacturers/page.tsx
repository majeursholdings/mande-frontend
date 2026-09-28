import { Suspense } from "react";
import AdminManufacturersPage from "@/components/adminPlatform/manufacturersPage";

// The admin's Manufacturers page — with Delete account in place of Request deletion
export default function SuperAdminManufacturersRoute() {
    // The table keeps its search, filter, sort and page in the URL — read on the client
    return (
        <Suspense>
            <AdminManufacturersPage />
        </Suspense>
    );
}
