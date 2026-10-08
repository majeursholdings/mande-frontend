"use client";

import { useState } from "react";
import Link from "next/link";
import { useController, useForm, type Control } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ADMIN_FORGOT_PASSWORD_URL } from "@/constant/navigation";
import { authService, type LoginMfaRequiredResponse, type PublicUser } from "@/lib/services/authService";
import { MandeApiError } from "@/lib/types/api";
import { FormSubmitButton } from "./formButtons";
import { AUTH_FORM_FIELD_GAP } from "./styles";

type AdminLoginFormValues = {
    email: string;
    password: string;
    rememberMe: boolean;
};

const ADMIN_LOGIN_DEFAULT_VALUES: AdminLoginFormValues = {
    email: "",
    password: "",
    rememberMe: false,
};

const FIELDS: FormFieldConfig[] = [
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
];

/** What a failed log in says, by the API's error code. */
function loginErrorMessage(error: unknown): string {
    if (!(error instanceof MandeApiError)) return "Couldn't log you in. Please try again.";
    if (error.status === 429) return "Too many tries. Please wait a few minutes and try again.";
    if (error.status >= 400 && error.status < 500 && error.message) {
        return error.message;
    }
    return "Couldn't log you in. Please try again.";
}

/**
 * Logging in to a staff platform (the admin's, or the super admin's): the
 * email and password go to the API. It either signs them in (`onSignedIn`)
 * or asks for a code first (`onCodeRequired`: two-factor, or extra checks
 * after wrong passwords). An account whose email isn't verified yet gets a
 * fresh code from the API (`onEmailNotVerified`), so the page can ask for it.
 * The page decides where each leads.
 */
export default function AdminLoginForm({
    forgotPasswordUrl = ADMIN_FORGOT_PASSWORD_URL,
    role,
    onSignedIn,
    onCodeRequired,
    onEmailNotVerified,
}: {
    forgotPasswordUrl?: string;
    role?: "admin" | "super_admin";
    onSignedIn: (user: PublicUser) => void;
    onCodeRequired: (challenge: LoginMfaRequiredResponse, email: string) => void;
    /** The right password, but the email isn't verified: the API has emailed a code to `email`. */
    onEmailNotVerified: (email: string) => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AdminLoginFormValues>({
        mode: "onTouched",
        defaultValues: ADMIN_LOGIN_DEFAULT_VALUES,
    });

    const handleSubmit = async ({ email, password, rememberMe }: AdminLoginFormValues) => {
        setIsLoading(true);
        const trimmedEmail = email.trim().toLowerCase();
        try {
            const result = await authService.login({ email: trimmedEmail, password, rememberMe, role });
            if ("mfaRequired" in result) {
                onCodeRequired(result, trimmedEmail);
                return;
            }
            onSignedIn(result.user);
        } catch (error) {
            if (error instanceof MandeApiError && error.code === "EMAIL_NOT_VERIFIED") {
                toast.info(error.message || "Verify your email first. We've sent you a code.");
                onEmailNotVerified(trimmedEmail);
                return;
            }
            toast.error(loginErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<AdminLoginFormValues>
            methods={methods}
            fields={FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            fieldGapClassName={AUTH_FORM_FIELD_GAP}
            hideRequiredMarks
            footerSlot={<RememberMeRow control={methods.control} forgotPasswordUrl={forgotPasswordUrl} />}
            renderFooter={({ isLoading, canSubmit }) => (
                <FormSubmitButton
                    label="Login"
                    loadingLabel="Logging in..."
                    isLoading={isLoading}
                    disabled={!canSubmit}
                    className="mt-5"
                />
            )}
        />
    );
}

/**
 * "Remember me" beside the "Forgot Password?" link — a checkbox from md up
 * and a switch on phones, as in the design. Both edit the same value.
 */
function RememberMeRow({
    control,
    forgotPasswordUrl,
}: {
    control: Control<AdminLoginFormValues>;
    forgotPasswordUrl: string;
}) {
    const { field } = useController({ control, name: "rememberMe" });
    const labelClass =
        "items-center gap-2 text-sm font-text text-mist-600 cursor-pointer select-none";

    return (
        <div className="flex items-center justify-between gap-3">
            <label className={`hidden md:flex ${labelClass}`}>
                <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-mist-300 data-checked:border-secondary-700 data-checked:bg-white data-checked:text-secondary-700"
                />
                Remember me
            </label>
            <label className={`flex md:hidden ${labelClass}`}>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Remember me
            </label>
            <Link
                href={forgotPasswordUrl}
                className="text-sm font-medium font-text text-secondary-700 hover:underline"
            >
                Forgot Password?
            </Link>
        </div>
    );
}
