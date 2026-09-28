import type { Metadata } from "next";
import AdminForgotPasswordPage from "@/components/adminPlatform/forgotPasswordPage";
import { SUPER_ADMIN_AUTH } from "@/components/adminPlatform/authPlatforms";

export const metadata: Metadata = { title: "Reset your super admin password | MANDE" };

export default function SuperAdminForgotPasswordRoute() {
    return <AdminForgotPasswordPage platform={SUPER_ADMIN_AUTH} />;
}
