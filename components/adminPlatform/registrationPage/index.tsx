"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import AdminRegistrationForm from "@/components/adminPlatform/form/registrationForm";
import AdminVerifyEmailForm from "@/components/adminPlatform/form/verifyEmailForm";
import { OTP_LENGTH } from "@/constant/global";
import { queryKeys } from "@/lib/queryKeys";
import type { PublicUser } from "@/lib/services/authService";
import { ADMIN_AUTH, type AuthPlatform } from "../authPlatforms";
import AuthScreenLayout from "../authScreenLayout";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthRedirect";

// ─────────────────────────────────────────────────────────────────────────────
// Staff sign-up (admin, or super admin with its `platform`) — two steps on
// one screen: the account details, then the code emailed to verify them. The details form stays mounted (hidden) during
// the code step, so "Change it" goes back to it with everything still
// filled in.
// ─────────────────────────────────────────────────────────────────────────────

const LOGIN_LINK_CLASS = "ml-1 font-medium text-secondary-700 hover:underline cursor-pointer";

export default function AdminRegistrationPage({ platform = ADMIN_AUTH }: { platform?: AuthPlatform }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    useRedirectIfAuthenticated();
    // The address a code was sent to — null while still on the details step
    const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);

    const changeStep = (email: string | null) => {
        setVerifyingEmail(email);
        window.scrollTo({ top: 0 });
    };

    const handleVerified = (user?: PublicUser) => {
        if (user) {
            queryClient.setQueryData(queryKeys.auth.profile(), user);
        }
        router.push(platform.dashboardUrl);
    };

    return (
        <AuthScreenLayout
            platformLabel={platform.label}
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
                    : platform.signupDescription
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
                        <Link href={platform.loginUrl} className={LOGIN_LINK_CLASS}>
                            Login
                        </Link>
                    </>
                )
            }
        >
            <div hidden={!!verifyingEmail}>
                <AdminRegistrationForm onCodeSent={changeStep} asksForPosition={platform.asksForPosition} />
            </div>
            {verifyingEmail && (
                <AdminVerifyEmailForm
                    email={verifyingEmail}
                    onVerified={handleVerified}
                />
            )}
        </AuthScreenLayout>
    );
}
