"use client";

import { useState } from "react";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import AdminLoginForm from "@/components/adminPlatform/form/loginForm";
import LoginCodeForm from "@/components/adminPlatform/form/loginCodeForm";
import AdminVerifyEmailForm from "@/components/adminPlatform/form/verifyEmailForm";
import { OTP_LENGTH } from "@/constant/global";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { queryKeys } from "@/lib/queryKeys";
import { authService, type LoginMfaRequiredResponse, type PublicUser } from "@/lib/services/authService";
import { ADMIN_AUTH, type AuthPlatform } from "../authPlatforms";
import AuthScreenLayout from "../authScreenLayout";
import { getDashboardUrlForRole } from "@/hooks/useAuthRedirect";

// ─────────────────────────────────────────────────────────────────────────────
// Log in — the admin's, or the super admin's with its `platform`. Two steps
// on one screen: email and password, then (when the API asks) a code from
// their email or authenticator app. An account whose email was never
// verified gets the sign-up's code step instead (the API has just emailed a
// code), and verifying signs them in. Only the platform's own role gets in:
// anyone else is logged straight back out and told where to go. Then it's
// the page they were sent here from (`?next=`, on this platform only), or
// the dashboard.
// ─────────────────────────────────────────────────────────────────────────────

const LINK_CLASS = "ml-1 font-medium text-secondary-700 hover:underline cursor-pointer";

/** Where to land: `?next=` when it's a page on this platform, else the dashboard. */
function landingUrl(platform: AuthPlatform): string {
    if (typeof window === "undefined") return platform.dashboardUrl;
    const next = new URLSearchParams(window.location.search).get("next");
    const platformRoot = `/${platform.dashboardUrl.split("/")[1]}/`;
    // Only a path on this platform: never another site ("//evil.example") or another platform
    return next && next.startsWith(platformRoot) && !next.startsWith("//") && !next.includes("\\") ? next : platform.dashboardUrl;
}

export default function AdminLoginPage({ platform = ADMIN_AUTH }: { platform?: AuthPlatform }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: currentUser, isPending: isCheckingAuth } = useCurrentUser();
    const [challenge, setChallenge] = useState<(LoginMfaRequiredResponse & { email: string }) | null>(null);
    // The address a verification code was sent to, when logging in found it unverified
    const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);

    if (!isCheckingAuth && currentUser && currentUser.status === "active") {
        if (currentUser.role === platform.role) {
            redirect(landingUrl(platform));
        } else {
            redirect(getDashboardUrlForRole(currentUser.role));
        }
    }

    const signedIn = async (user: PublicUser) => {
        if (user.role !== platform.role) {
            // The right password, but not this platform's account: return generic error
            await authService.logout().catch(() => undefined);
            setChallenge(null);
            toast.error("That email or password isn't right.");
            return;
        }
        queryClient.setQueryData(queryKeys.auth.profile(), user);
        toast.success("Logged in");
        router.replace(landingUrl(platform));
    };

    /** Verifying the email signs them in (the form has already said so), as after sign-up. */
    const verified = async (user?: PublicUser) => {
        if (user && user.role !== platform.role) {
            await authService.logout().catch(() => undefined);
            setVerifyingEmail(null);
            toast.error("That email or password isn't right.");
            return;
        }
        if (user) queryClient.setQueryData(queryKeys.auth.profile(), user);
        router.replace(landingUrl(platform));
    };

    const startAgain = () => {
        setChallenge(null);
        setVerifyingEmail(null);
    };

    const codeDescription = challenge
        ? challenge.method === "app"
            ? `Enter the ${OTP_LENGTH}-digit code from your authenticator app.`
            : challenge.reason === "step_up"
              ? `For your security, we've emailed a ${OTP_LENGTH}-digit code to ${challenge.email}. Enter it to finish logging in.`
              : `Enter the ${OTP_LENGTH}-digit code we emailed to ${challenge.email}.`
        : "";

    return (
        <AuthScreenLayout
            platformLabel={platform.label}
            title={
                verifyingEmail ? (
                    "Verify your email"
                ) : challenge ? (
                    "Enter your code"
                ) : (
                    <>
                        Log in to <span className="text-secondary-700">Mande!</span>
                    </>
                )
            }
            description={
                verifyingEmail
                    ? `Your email isn't verified yet. Enter the ${OTP_LENGTH}-digit code we sent to ${verifyingEmail}.`
                    : challenge
                      ? codeDescription
                      : "Welcome back, log into your account."
            }
            footer={
                challenge || verifyingEmail ? (
                    <>
                        {verifyingEmail ? "Wrong email?" : "No code, or it expired?"}{" "}
                        <button type="button" onClick={startAgain} className={LINK_CLASS}>
                            Start again
                        </button>
                    </>
                ) : platform.inviteOnly ? (
                    <>New super admins join from the invite link in their email.</>
                ) : (
                    <>
                        Don&apos;t have an account?{" "}
                        <Link href={platform.signupUrl} className={LINK_CLASS}>
                            Register
                        </Link>
                    </>
                )
            }
        >
            {verifyingEmail ? (
                <AdminVerifyEmailForm key={verifyingEmail} email={verifyingEmail} onVerified={verified} />
            ) : challenge ? (
                <LoginCodeForm key={challenge.mfaToken} mfaToken={challenge.mfaToken} onSignedIn={signedIn} />
            ) : (
                <AdminLoginForm
                    forgotPasswordUrl={platform.forgotPasswordUrl}
                    role={platform.role}
                    onSignedIn={signedIn}
                    onCodeRequired={(result, email) => setChallenge({ ...result, email })}
                    onEmailNotVerified={setVerifyingEmail}
                />
            )}
        </AuthScreenLayout>
    );
}
