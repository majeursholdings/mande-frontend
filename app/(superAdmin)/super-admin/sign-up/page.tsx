import type { Metadata } from "next";
import AdminRegistrationPage from "@/components/adminPlatform/registrationPage";
import { SUPER_ADMIN_AUTH } from "@/components/adminPlatform/authPlatforms";

export const metadata: Metadata = { title: "Super admin sign up | MANDE" };

// The admin's sign-up (details, then the emailed code), without the position question
export default function SuperAdminSignUpRoute() {
    return <AdminRegistrationPage platform={SUPER_ADMIN_AUTH} />;
}
