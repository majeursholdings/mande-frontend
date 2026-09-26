"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import AuthScreenLayout from "../authScreenLayout";
import { GoogleIcon, FacebookIcon } from "../socialIcons";
import { loadRegistrationProgress } from "../registrationPage/registrationProgress";
import {
    ARTISAN_FORGOT_PASSWORD_URL,
    ARTISAN_SIGNUP_URL,
} from "@/constant/navigation";

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

export default function ManufacLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
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

    const handleSubmit = async ({ email }: LoginFormValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate the request so the flow
            // is testable end-to-end.
            await new Promise((resolve) => setTimeout(resolve, 800));

            // Someone who dropped off mid sign-up goes back to finish it, at
            // the step they'd reached. (The API will say this on login; for
            // now it's the progress saved in this browser.)
            const unfinished = loadRegistrationProgress();
            if (unfinished?.values.email?.toLowerCase() === email.trim().toLowerCase()) {
                toast.info("Welcome back! Let's finish setting up your account.");
                router.push(ARTISAN_SIGNUP_URL);
                return;
            }

            toast.success("Logged in successfully");
        } catch {
            toast.error("Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthScreenLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold font-text text-[#1F2937]">
                        Log in to <span className="text-secondary-700">Mande!</span>
                    </h1>
                    <p className="text-sm font-normal font-text text-[#6B7280]">
                        Welcome back, log into your account.
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
        </AuthScreenLayout>
    );
}
