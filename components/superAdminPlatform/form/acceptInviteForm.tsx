"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { isPhoneNumber, validators } from "@/components/form/form.validators";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { AUTH_FORM_FIELD_GAP } from "@/components/adminPlatform/form/styles";
import { authService, type PublicUser } from "@/lib/services/authService";
import { MandeApiError } from "@/lib/types/api";

type AcceptInviteFormValues = {
    phone: string;
    password: string;
    confirmPassword: string;
};

const DEFAULT_VALUES: AcceptInviteFormValues = { phone: "", password: "", confirmPassword: "" };

// ─────────────────────────────────────────────────────────────────────────────
// AcceptInviteForm — joining as a super admin from an invite link. The invite
// already has their name, email and role, so this only asks for a phone
// number and a password. Accepting signs them straight in (the invite went to
// their email, so it's already verified).
// ─────────────────────────────────────────────────────────────────────────────

export default function AcceptInviteForm({
    token,
    onAccepted,
    onInvalid,
}: {
    /** From the invite link. */
    token: string;
    onAccepted: (user: PublicUser) => void;
    /** The invite has expired, was cancelled or was already used. */
    onInvalid: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AcceptInviteFormValues>({ mode: "onTouched", defaultValues: DEFAULT_VALUES });

    const fields: FormFieldConfig[] = [
        {
            name: "phone",
            type: "tel",
            label: "Phone number",
            placeholder: "e.g. +234 801 234 5678",
            autoComplete: "tel",
            validation: {
                required: "Phone number is required",
                validate: (value: string) => isPhoneNumber(value) || "Enter a valid phone number, e.g. +234 801 234 5678",
            },
        },
        {
            name: "password",
            type: "password",
            label: "Password",
            placeholder: "Enter password",
            autoComplete: "new-password",
            validation: {
                ...validators.password(),
                // Once the confirmation has been filled in, keep it in step with the password
                onChange: () => {
                    if (methods.getFieldState("confirmPassword").isTouched) void methods.trigger("confirmPassword");
                },
            },
        },
        {
            name: "confirmPassword",
            type: "password",
            label: "Confirm password",
            placeholder: "Re-enter password",
            autoComplete: "new-password",
            validation: validators.confirmPassword(methods.getValues),
        },
    ];

    const handleSubmit = async ({ phone, password }: AcceptInviteFormValues) => {
        setIsLoading(true);
        try {
            const result = await authService.acceptInvite(token, password, phone.trim());
            onAccepted(result.user);
        } catch (error) {
            const details = error instanceof MandeApiError && error.details && !Array.isArray(error.details) ? error.details : null;
            // Expired, cancelled or already used: the link itself is the problem, not what they typed
            if (details && Array.isArray(details.token)) {
                onInvalid();
                return;
            }
            if (error instanceof MandeApiError && error.status === 422 && details) {
                for (const name of ["phone", "password"] as const) {
                    const messages = details[name];
                    if (Array.isArray(messages) && messages[0]) methods.setError(name, { message: String(messages[0]) });
                }
                toast.error("Some fields need attention.");
                return;
            }
            toast.error(
                error instanceof MandeApiError && error.status === 429
                    ? "Too many tries. Please wait a few minutes and try again."
                    : error instanceof MandeApiError && error.status >= 400 && error.status < 500
                      ? error.message
                      : "Couldn't accept the invite. Please try again.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<AcceptInviteFormValues>
            methods={methods}
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            fieldGapClassName={AUTH_FORM_FIELD_GAP}
            hideRequiredMarks
            renderFooter={({ isLoading, canSubmit }) => (
                <FormSubmitButton
                    label="Accept invite"
                    loadingLabel="Setting up your account..."
                    icon={<ArrowRight className="size-4" />}
                    isLoading={isLoading}
                    disabled={!canSubmit}
                    className="mt-5"
                />
            )}
        />
    );
}
