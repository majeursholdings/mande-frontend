import type { Metadata } from "next";
import AdminResetPasswordPage from "@/components/adminPlatform/resetPasswordPage";
import { SUPER_ADMIN_AUTH } from "@/components/adminPlatform/authPlatforms";

export const metadata: Metadata = {
    title: "Reset Password | MANDE Super Admin",
    referrer: "no-referrer",
};

export default async function SuperAdminResetPasswordRoute({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const token = typeof params.token === "string" ? params.token : "";
    return <AdminResetPasswordPage token={token} platform={SUPER_ADMIN_AUTH} />;
}
