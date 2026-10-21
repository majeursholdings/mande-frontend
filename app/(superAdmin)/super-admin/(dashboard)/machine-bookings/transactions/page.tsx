import { Suspense } from "react";
import SuperAdminBookingTransactionsPage from "@/components/superAdminPlatform/bookingTransactionsPage";

export default function SuperAdminBookingTransactionsRoute() {
    // The table keeps its search, filter, sort and page in the URL, read on the client
    return (
        <Suspense>
            <SuperAdminBookingTransactionsPage />
        </Suspense>
    );
}
