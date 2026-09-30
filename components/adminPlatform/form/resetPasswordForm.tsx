"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import { authService } from "@/lib/services/authService";
import { MandeApiError } from "@/lib/types/api";
import { ADMIN_LOGIN_URL } from "@/constant/navigation";
import { FormSubmitButton } from "./formButtons";
import { AUTH_FORM_FIELD_GAP } from "./styles";

type AdminResetPasswordFormValues = {
    password: string;
    confirmPassword: string;
};

export default function AdminResetPasswordForm({
    token,
    loginUrl = ADMIN_LOGIN_URL,
}: {
    token: string;
    loginUrl?: string;
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AdminResetPasswordFormValues>({
        mode: "onTouched",
        defaultValues: { password: "", confirmPassword: "" },
    });

    const fields: FormFieldConfig[] = [
        {
            name: "password",
            type: "password",
            label: "New password",
            placeholder: "Enter new password",
            autoComplete: "new-password",
            validation: {
                ...validators.password(),
                onChange: () => {
                    if (methods.getFieldState("confirmPassword").isTouched) {
                        void methods.trigger("confirmPassword");
                    }
                },
            },
        },
        {
            name: "confirmPassword",
            type: "password",
            label: "Confirm new password",
            placeholder: "Re-enter new password",
            autoComplete: "new-password",
            validation: validators.confirmPassword(methods.getValues),
        },
    ];

    const handleSubmit = async ({ password }: AdminResetPasswordFormValues) => {
        if (!token) {
            toast.error("This reset link is missing or invalid. Please request a new one.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await authService.resetPassword(token, password);
            toast.success(res.message || "Your password has been reset. Please log in.");
            router.push(loginUrl);
        } catch (error) {
            const details =
                error instanceof MandeApiError && error.details && !Array.isArray(error.details)
                    ? (error.details as Record<string, string[]>)
                    : null;
            if (error instanceof MandeApiError && error.status === 422 && details) {
                if (Array.isArray(details.password) && details.password[0]) {
                    methods.setError("password", { message: String(details.password[0]) });
                }
                toast.error("Some fields need attention.");
                return;
            }
            toast.error(
                error instanceof MandeApiError && error.status === 429
                    ? "Too many tries. Please wait a few minutes and try again."
                    : error instanceof MandeApiError && error.message
                      ? error.message
                      : "Couldn't reset your password. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<AdminResetPasswordFormValues>
            methods={methods}
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            fieldGapClassName={AUTH_FORM_FIELD_GAP}
            hideRequiredMarks
            className="flex-1 md:flex-none"
            renderFooter={({ isLoading, canSubmit }) => (
                <FormSubmitButton
                    label="Reset Password"
                    loadingLabel="Resetting password..."
                    icon={<ArrowRight className="size-4" />}
                    isLoading={isLoading}
                    disabled={!canSubmit || !token}
                    className="mt-auto md:mt-5"
                />
            )}
        />
    );
}
