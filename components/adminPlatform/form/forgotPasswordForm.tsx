"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import { authService } from "@/lib/services/authService";
import { MandeApiError } from "@/lib/types/api";
import { FormSubmitButton } from "./formButtons";
import { AUTH_FORM_FIELD_GAP } from "./styles";

type AdminForgotPasswordFormValues = {
    email: string;
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
];

export default function AdminForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AdminForgotPasswordFormValues>({
        mode: "onTouched",
        defaultValues: { email: "" },
    });

    const handleSubmit = async ({ email }: AdminForgotPasswordFormValues) => {
        setIsLoading(true);
        try {
            const trimmedEmail = email.trim().toLowerCase();
            const res = await authService.forgotPassword(trimmedEmail);
            toast.success(res.message || "If that email has an account, a reset link is on its way.");
            methods.reset();
        } catch (error) {
            toast.error(
                error instanceof MandeApiError && error.status === 429
                    ? "Too many tries. Please wait a few minutes and try again."
                    : error instanceof MandeApiError && error.message
                      ? error.message
                      : "Couldn't send the reset link. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<AdminForgotPasswordFormValues>
            methods={methods}
            fields={FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            fieldGapClassName={AUTH_FORM_FIELD_GAP}
            hideRequiredMarks
            // Phones: fills the screen so the button sits at the bottom, as in the design
            className="flex-1 md:flex-none"
            renderFooter={({ isLoading, canSubmit }) => (
                <FormSubmitButton
                    label="Reset Password"
                    loadingLabel="Sending link..."
                    isLoading={isLoading}
                    disabled={!canSubmit}
                    className="mt-auto md:mt-5"
                />
            )}
        />
    );
}
