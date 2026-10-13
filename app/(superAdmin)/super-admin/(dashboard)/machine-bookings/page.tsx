import { Suspense } from "react";
import MachineBookingsPage from "@/components/adminPlatform/machineBookingsPage";

export default function SuperAdminMachineBookingsRoute() {
    // The table keeps its search and status filter in the URL, read on the client
    return (
        <Suspense>
            <MachineBookingsPage />
        </Suspense>
    );
}
