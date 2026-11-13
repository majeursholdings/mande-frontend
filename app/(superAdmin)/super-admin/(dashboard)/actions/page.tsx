import { Suspense } from "react";
import SuperAdminActionsPage from "@/components/superAdminPlatform/actionsPage";

export default function SuperAdminActionsRoute() {
    // The page reads ?item= (the item a notification points at)
    return (
        <Suspense>
            <SuperAdminActionsPage />
        </Suspense>
    );
}
