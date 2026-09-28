import type { Metadata } from "next";
import AdminLoginPage from "@/components/adminPlatform/loginPage";
import { SUPER_ADMIN_AUTH } from "@/components/adminPlatform/authPlatforms";

export const metadata: Metadata = { title: "Super admin log in | MANDE" };

// The admin's log in screen, with the super admin's label and links
export default function SuperAdminLoginRoute() {
    return <AdminLoginPage platform={SUPER_ADMIN_AUTH} />;
}
