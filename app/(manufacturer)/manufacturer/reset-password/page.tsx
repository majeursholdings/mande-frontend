import type { Metadata } from "next";
import ManufacResetPasswordPage from "@/components/manufacturerPlatform/resetPasswordPage";

export const metadata: Metadata = {
    title: "Reset Password | MANDE",
    // The reset token is in the address: never pass it on to other sites
    referrer: "no-referrer",
};

export default async function ManufacturerResetPasswordRoute({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const token = typeof params.token === "string" ? params.token : "";
    return <ManufacResetPasswordPage token={token} />;
}
