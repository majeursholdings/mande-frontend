import type { Metadata } from "next";
import AdminResetPasswordPage from "@/components/adminPlatform/resetPasswordPage";

export const metadata: Metadata = {
    title: "Reset Password | MANDE Admin",
    referrer: "no-referrer",
};

export default async function AdminResetPasswordRoute({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const token = typeof params.token === "string" ? params.token : "";
    return <AdminResetPasswordPage token={token} />;
}
