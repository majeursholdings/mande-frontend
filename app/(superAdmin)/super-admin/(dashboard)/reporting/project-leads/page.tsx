import { redirect } from "next/navigation";
import { SUPER_ADMIN_JOB_REVIEW_URL } from "@/constant/superAdmin";

// The project lead report moved to Jobs › Jobs report
export default function SuperAdminProjectLeadReportRoute() {
    redirect(SUPER_ADMIN_JOB_REVIEW_URL);
}
