"use client";

import Link from "next/link";
import AdminResetPasswordForm from "@/components/adminPlatform/form/resetPasswordForm";
import { ARTISAN_FORGOT_PASSWORD_URL, ARTISAN_LOGIN_URL } from "@/constant/navigation";
import AuthScreenLayout from "../authScreenLayout";

/**
 * Where the reset link in the password reset email lands
 * (/manufacturer/reset-password?token=...). Uses the shared reset password
 * form, inside the manufacturer platform's auth screen.
 */
export default function ManufacResetPasswordPage({ token = "" }: { token?: string }) {
    return (
        <AuthScreenLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold font-text uppercase tracking-wider text-secondary-700">
                        Manufacturer Platform
                    </span>
                    <h1 className="text-2xl font-bold font-text text-[#1F2937]">
                        Set New Password
                    </h1>
                    <p className="text-sm font-normal font-text text-[#6B7280]">
                        {token ? (
                            "Enter your new password below to secure your account."
                        ) : (
                            <>
                                This reset link is invalid or expired.{" "}
                                <Link
                                    href={ARTISAN_FORGOT_PASSWORD_URL}
                                    className="text-secondary-700 font-medium hover:underline"
                                >
                                    Request a new one
                                </Link>
                                .
                            </>
                        )}
                    </p>
                </div>

                <AdminResetPasswordForm token={token} loginUrl={ARTISAN_LOGIN_URL} />

                <p className="text-center text-sm font-text text-[#6B7280]">
                    Remember your password?{" "}
                    <Link
                        href={ARTISAN_LOGIN_URL}
                        className="text-secondary-700 font-medium hover:underline"
                    >
                        Login
                    </Link>
                </p>
            </div>
        </AuthScreenLayout>
    );
}
