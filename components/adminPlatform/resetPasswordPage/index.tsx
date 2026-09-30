"use client";

import Link from "next/link";
import AdminResetPasswordForm from "@/components/adminPlatform/form/resetPasswordForm";
import { ADMIN_AUTH, type AuthPlatform } from "../authPlatforms";
import AuthScreenLayout from "../authScreenLayout";

export default function AdminResetPasswordPage({
    token = "",
    platform = ADMIN_AUTH,
}: {
    token?: string;
    platform?: AuthPlatform;
}) {
    return (
        <AuthScreenLayout
            platformLabel={platform.label}
            title="Set New Password"
            description={
                token
                    ? "Enter your new password below to secure your account."
                    : "This reset link is invalid or expired. Please request a new password reset."
            }
            fillScreen
            footer={
                <>
                    Remember your password?{" "}
                    <Link
                        href={platform.loginUrl}
                        className="ml-1 font-medium text-secondary-700 hover:underline"
                    >
                        Login
                    </Link>
                </>
            }
        >
            <AdminResetPasswordForm token={token} loginUrl={platform.loginUrl} />
        </AuthScreenLayout>
    );
}
