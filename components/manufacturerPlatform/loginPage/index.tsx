"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import MainForm from "@/components/form";
import { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import AuthScreenLayout from "../authScreenLayout";
import {
    ARTISAN_FORGOT_PASSWORD_URL,
    ARTISAN_SIGNUP_URL,
} from "@/constant/navigation";
import { MANUFACTURER_DASHBOARD_URL } from "@/constant/manufacturer";
import {
    authService,
    type LoginMfaRequiredResponse,
    type LoginPayload,
    type LoginSuccessResponse,
} from "@/lib/services/authService";
import { MandeApiError, getErrorMessage } from "@/lib/api";
import { REGISTRATION_DEFAULT_VALUES } from "../registrationPage/types";
import {
    loadRegistrationProgress,
    saveRegistrationProgress,
} from "../registrationPage/registrationProgress";
import { queryKeys } from "@/lib/queryKeys";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthRedirect";
import { OtpCodeDialog } from "../otpVerificationDialog";

type LoginFormValues = {
    email: string;
    password: string;
    rememberMe: boolean;
};

const LOGIN_DEFAULT_VALUES: LoginFormValues = {
    email: "",
    password: "",
    rememberMe: false,
};

/** Where to land: `?next=` when it's a path on this platform, else the dashboard. */
function landingUrl(): string {
    if (typeof window === "undefined") return MANUFACTURER_DASHBOARD_URL;
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/manufacturer/") && !next.startsWith("//") && !next.includes("\\")
        ? next
        : MANUFACTURER_DASHBOARD_URL;
}

/** The sign-up step right after verifying the email: choosing a plan. */
const STEP_AFTER_EMAIL_VERIFIED = 2;

type ManufacturerCredentials = Required<Pick<LoginPayload, "email" | "password" | "rememberMe">>;

export default function ManufacLoginPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    // The credentials stay with the challenge, so "Resend code" can log in again for a new code
    const [challenge, setChallenge] = useState<
        (LoginMfaRequiredResponse & { credentials: ManufacturerCredentials }) | null
    >(null);
    // Set when the account's email isn't verified yet: the API has just emailed a code
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

    // Redirect to respective dashboard if already authenticated with a valid token
    useRedirectIfAuthenticated();

    const methods = useForm<LoginFormValues>({
        mode: "onTouched",
        defaultValues: LOGIN_DEFAULT_VALUES,
    });

    const fields: FormFieldConfig[] = [
        {
            name: "email",
            type: "email",
            label: "Email",
            placeholder: "Enter email",
            autoComplete: "email",
            validation: validators.email(),
        },
        {
            name: "password",
            type: "password",
            label: "Password",
            placeholder: "Enter password",
            autoComplete: "current-password",
            validation: { required: "Password is required" },
        },
        {
            name: "rememberMe",
            type: "checkbox",
            label: "Remember me",
            trailingSlot: (
                <Link
                    href={ARTISAN_FORGOT_PASSWORD_URL}
                    className="text-sm font-medium font-text text-secondary-700 hover:underline"
                >
                    Forgot Password?
                </Link>
            ),
        },
    ];

    const loginAsManufacturer = (credentials: ManufacturerCredentials) =>
        authService.login({ ...credentials, role: "manufacturer" });

    /** Signed in: only a manufacturer account carries on to the dashboard. */
    const completeLogin = async (result: LoginSuccessResponse) => {
        if (result.user.role !== "manufacturer") {
            await authService.logout().catch(() => undefined);
            setChallenge(null);
            toast.error("That email or password isn't right.");
            return;
        }
        queryClient.setQueryData(queryKeys.auth.profile(), result.user);
        toast.success("Logged in successfully");
        setChallenge(null);
        router.replace(landingUrl());
    };

    const handleSubmit = async ({ email, password, rememberMe }: LoginFormValues) => {
        setIsLoading(true);
        try {
            const credentials: ManufacturerCredentials = {
                email: email.trim().toLowerCase(),
                password,
                rememberMe,
            };
            const result = await loginAsManufacturer(credentials);

            if ("mfaRequired" in result && result.mfaRequired) {
                setChallenge({ ...result, credentials });
                return;
            }

            if ("user" in result) {
                await completeLogin(result);
            }
        } catch (error) {
            if (error instanceof MandeApiError && error.code === "EMAIL_NOT_VERIFIED") {
                // The API has emailed a fresh code: verify it here
                setUnverifiedEmail(email.trim().toLowerCase());
                toast.info(error.message || "Verify your email first. We've sent you a code.");
                return;
            }
            toast.error(getErrorMessage(error, "That email or password isn't right."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpVerified = async (code: string) => {
        if (!challenge) return;
        setIsLoading(true);
        try {
            const result = await authService.login2FA(challenge.mfaToken, code);
            await completeLogin(result);
        } catch (error) {
            toast.error(getErrorMessage(error, "That code isn't right or has expired."));
        } finally {
            setIsLoading(false);
        }
    };

    // Logging in again starts a new challenge, which emails a new code.
    // Errors reach the code form, which shows them.
    const handleResendLoginCode = async () => {
        if (!challenge) return;
        const result = await loginAsManufacturer(challenge.credentials);
        if ("mfaRequired" in result && result.mfaRequired) {
            setChallenge({ ...result, credentials: challenge.credentials });
            return;
        }
        if ("user" in result) await completeLogin(result);
    };

    // Verifying the email signs them in. An unverified account has only done
    // the first sign-up step, so they carry on with sign-up from choosing a plan.
    const handleEmailVerified = async (code: string) => {
        if (!unverifiedEmail) return;
        try {
            await authService.verifyEmail(unverifiedEmail, code);
            const saved = loadRegistrationProgress();
            saveRegistrationProgress(
                Math.max(saved?.stepIndex ?? 0, STEP_AFTER_EMAIL_VERIFIED),
                { ...REGISTRATION_DEFAULT_VALUES, ...saved?.values, email: unverifiedEmail },
                saved?.paymentReference ?? null,
            );
            toast.success("Email verified. Let's finish setting up your account.");
            setUnverifiedEmail(null);
            router.replace(ARTISAN_SIGNUP_URL);
        } catch (error) {
            toast.error(getErrorMessage(error, "That code isn't right or has expired."));
        }
    };

    const handleResendVerification = async () => {
        if (!unverifiedEmail) return;
        await authService.resendVerification(unverifiedEmail);
    };

    return (
        <AuthScreenLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold font-text uppercase tracking-wider text-secondary-700">
                        Manufacturer Platform
                    </span>
                    <h1 className="text-2xl font-bold font-text text-[#1F2937]">
                        Log in to <span className="text-secondary-700">Mande!</span>
                    </h1>
                    <p className="text-sm font-normal font-text text-[#6B7280]">
                        Welcome back, log into your manufacturer account.
                    </p>
                </div>

                <MainForm<LoginFormValues>
                    methods={methods}
                    fields={fields}
                    onSubmit={handleSubmit}
                    submitLabel="Login"
                    isLoading={isLoading}
                />

                <p className="text-center text-sm font-text text-[#6B7280]">
                    Don&apos;t have an account?{" "}
                    <Link
                        href={ARTISAN_SIGNUP_URL}
                        className="text-secondary-700 font-medium hover:underline"
                    >
                        Register
                    </Link>
                </p>
            </div>

            {challenge && (
                <OtpCodeDialog
                    open={Boolean(challenge)}
                    onOpenChange={(open) => !open && setChallenge(null)}
                    title="Enter your code"
                    email={challenge.credentials.email}
                    channel={challenge.method}
                    onVerified={handleOtpVerified}
                    onResend={challenge.method === "email" ? handleResendLoginCode : undefined}
                />
            )}

            {unverifiedEmail && (
                <OtpCodeDialog
                    open={Boolean(unverifiedEmail)}
                    onOpenChange={(open) => !open && setUnverifiedEmail(null)}
                    title="Verify your email"
                    intro="Your email isn't verified yet."
                    email={unverifiedEmail}
                    channel="email"
                    onVerified={handleEmailVerified}
                    onResend={handleResendVerification}
                />
            )}
        </AuthScreenLayout>
    );
}
