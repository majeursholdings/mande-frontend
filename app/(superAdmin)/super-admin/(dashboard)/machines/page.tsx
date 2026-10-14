import { Suspense } from "react";
import MachinesPage from "@/components/superAdminPlatform/machinesPage";

export default function SuperAdminMachinesRoute() {
    // The table keeps its search and status filter in the URL, read on the client
    return (
        <Suspense>
            <MachinesPage />
        </Suspense>
    );
}
