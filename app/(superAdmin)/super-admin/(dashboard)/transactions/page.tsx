import { Suspense } from "react";
import AdminTransactionsPage from "@/components/adminPlatform/transactionsPage";

export default function SuperAdminTransactionsRoute() {
    // The table keeps its search, filter, sort and page in the URL — read on the client
    return (
        <Suspense>
            <AdminTransactionsPage />
        </Suspense>
    );
}
