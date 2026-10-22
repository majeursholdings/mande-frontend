import { Suspense } from "react";
import CustomersPage from "@/components/superAdminPlatform/customersPage";

export default function SuperAdminCustomersRoute() {
    // The table reads its page, search and filter from the URL
    return (
        <Suspense>
            <CustomersPage />
        </Suspense>
    );
}
