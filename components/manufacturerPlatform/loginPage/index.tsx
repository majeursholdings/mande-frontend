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
import { GoogleIcon, FacebookIcon } from "../socialIcons";
import {
    ARTISAN_FORGOT_PASSWORD_URL,
    ARTISAN_SIGNUP_URL,
} from "@/constant/navigation";
import { MANUFACTURER_DASHBOARD_URL } from "@/constant/manufacturer";
import { authService, type LoginMfaRequiredResponse } from "@/lib/services/authService";
import { MandeApiError } from "@/lib/types/api";
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

export default function ManufacLoginPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [challenge, setChallenge] = useState<(LoginMfaRequiredResponse & { email: string }) | null>(null);

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

    const handleSocialSignIn = (provider: "Google" | "Facebook") => {
        toast.info(`Sign in with ${provider} isn't available yet.`);
    };

    const handleSubmit = async ({ email, password, rememberMe }: LoginFormValues) => {
        setIsLoading(true);
        try {
            const trimmedEmail = email.trim().toLowerCase();
            const result = await authService.login({
                email: trimmedEmail,
                password,
                rememberMe,
                role: "manufacturer",
            });

            if ("mfaRequired" in result && result.mfaRequired) {
                setChallenge({ ...result, email: trimmedEmail });
                return;
            }

            if ("user" in result) {
                if (result.user.role !== "manufacturer") {
                    await authService.logout().catch(() => undefined);
                    toast.error("That email or password isn't right.");
                    return;
                }

                queryClient.setQueryData(queryKeys.auth.profile(), result.user);
                toast.success("Logged in successfully");
                router.replace(landingUrl());
            }
        } catch (error) {
            if (error instanceof MandeApiError) {
                toast.error(error.message || "That email or password isn't right.");
            } else {
                toast.error("That email or password isn't right.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpVerified = async (code: string) => {
        if (!challenge) return;
        setIsLoading(true);
        try {
            const result = await authService.login2FA(challenge.mfaToken, code);
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
        } catch (error) {
            if (error instanceof MandeApiError) {
                toast.error(error.message || "That code isn't right or has expired.");
            } else {
                toast.error("That code isn't right or has expired.");
            }
        } finally {
            setIsLoading(false);
        }
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

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={() => handleSocialSignIn("Google")}
                        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-button border border-gray-200 text-sm font-medium font-text text-[#1F2937] hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                        <GoogleIcon className="size-4" />
                        Sign in with Google
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSocialSignIn("Facebook")}
                        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-button border border-gray-200 text-sm font-medium font-text text-[#1F2937] hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                        <FacebookIcon className="size-4" />
                        Sign in with Facebook
                    </button>
                </div>

                <div className="flex items-center gap-3" aria-hidden>
                    <span className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs font-medium font-text text-[#9CA3AF]">
                        OR
                    </span>
                    <span className="h-px flex-1 bg-gray-200" />
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
                    email={challenge.email}
                    channel={challenge.method}
                    onVerified={handleOtpVerified}
                />
            )}
        </AuthScreenLayout>
    );
}
