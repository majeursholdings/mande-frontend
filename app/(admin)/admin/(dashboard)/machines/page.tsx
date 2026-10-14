import { Suspense } from "react";
import MachinesPage from "@/components/superAdminPlatform/machinesPage";

export default function AdminMachinesRoute() {
    // The same page as the super admin's; the table keeps its search and status filter in the URL, read on the client
    return (
        <Suspense>
            <MachinesPage />
        </Suspense>
    );
}
