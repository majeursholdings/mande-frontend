import { Suspense } from "react";
import AdminManufacturersPage from "@/components/adminPlatform/manufacturersPage";

export default function AdminManufacturersRoute() {
    // The table keeps its search, filter, sort and page in the URL — read on the client
    return (
        <Suspense>
            <AdminManufacturersPage />
        </Suspense>
    );
}
