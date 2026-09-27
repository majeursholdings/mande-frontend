"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminRegistrationForm from "@/components/adminPlatform/form/registrationForm";
import AdminVerifyEmailForm from "@/components/adminPlatform/form/verifyEmailForm";
import { OTP_LENGTH } from "@/constant/global";
import { ADMIN_LOGIN_URL } from "@/constant/navigation";
import AuthScreenLayout from "../authScreenLayout";

// ─────────────────────────────────────────────────────────────────────────────
// Admin sign-up — two steps on one screen: the account details, then the
// code emailed to verify them. The details form stays mounted (hidden) during
// the code step, so "Change it" goes back to it with everything still
// filled in.
// ─────────────────────────────────────────────────────────────────────────────

const LOGIN_LINK_CLASS = "ml-1 font-medium text-secondary-700 hover:underline cursor-pointer";

export default function AdminRegistrationPage() {
    const router = useRouter();
    // The address a code was sent to — null while still on the details step
    const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);

    const changeStep = (email: string | null) => {
        setVerifyingEmail(email);
        window.scrollTo({ top: 0 });
    };

    return (
        <AuthScreenLayout
            title={
                verifyingEmail ? (
                    "Verify your email"
                ) : (
                    <>
                        Welcome to <span className="text-secondary-700">Mande!</span>
                    </>
                )
            }
            description={
                verifyingEmail
                    ? `Enter the ${OTP_LENGTH}-digit code we sent to ${verifyingEmail}.`
                    : "Create your account to get started as an admin."
            }
            footer={
                verifyingEmail ? (
                    <>
                        Wrong email?{" "}
                        <button
                            type="button"
                            onClick={() => changeStep(null)}
                            className={LOGIN_LINK_CLASS}
                        >
                            Change it
                        </button>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <Link href={ADMIN_LOGIN_URL} className={LOGIN_LINK_CLASS}>
                            Login
                        </Link>
                    </>
                )
            }
        >
            <div hidden={!!verifyingEmail}>
                <AdminRegistrationForm onCodeSent={changeStep} />
            </div>
            {verifyingEmail && (
                <AdminVerifyEmailForm
                    email={verifyingEmail}
                    onVerified={() => router.push(ADMIN_LOGIN_URL)}
                />
            )}
        </AuthScreenLayout>
    );
}
