import { Suspense } from "react";
import SuperAdminJobReviewPage from "@/components/superAdminPlatform/jobReviewPage";

export default function SuperAdminJobReviewRoute() {
    // The project lead table keeps its search, filter and page in the URL, read on the client
    return (
        <Suspense>
            <SuperAdminJobReviewPage />
        </Suspense>
    );
}
