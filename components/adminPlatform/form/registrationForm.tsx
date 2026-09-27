"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import { ADMIN_EMAIL_DOMAIN, ADMIN_POSITION_OPTIONS } from "@/constant/admin";
import { FormSubmitButton } from "./formButtons";
import { AUTH_FORM_FIELD_GAP } from "./styles";

type AdminRegistrationFormValues = {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    password: string;
    confirmPassword: string;
};

const ADMIN_REGISTRATION_DEFAULT_VALUES: AdminRegistrationFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    position: "",
    password: "",
    confirmPassword: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// AdminRegistrationForm — the first step of admin sign-up. Staff only, so the
// email has to be on the Mande domain. Submitting creates the account and
// sends a verification code to that email; the sign-up page then shows the
// code step (AdminVerifyEmailForm).
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminRegistrationForm({
    onCodeSent,
}: {
    /** The account was created and a code sent — move on to verifying `email`. */
    onCodeSent: (email: string) => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AdminRegistrationFormValues>({
        mode: "onTouched",
        defaultValues: ADMIN_REGISTRATION_DEFAULT_VALUES,
    });

    const fields: FormFieldConfig[] = [
        {
            name: "firstName",
            type: "text",
            label: "First name",
            placeholder: "Enter first name",
            autoComplete: "given-name",
            validation: validators.name("First name"),
        },
        {
            name: "lastName",
            type: "text",
            label: "Last name",
            placeholder: "Enter last name",
            autoComplete: "family-name",
            validation: validators.name("Last name"),
        },
        {
            name: "email",
            type: "email",
            label: "Email",
            placeholder: `you@${ADMIN_EMAIL_DOMAIN}`,
            autoComplete: "email",
            validation: validators.companyEmail(ADMIN_EMAIL_DOMAIN),
        },
        {
            name: "position",
            type: "select",
            label: "Position",
            placeholder: "Select your position",
            options: ADMIN_POSITION_OPTIONS,
            validation: { required: "Please select your position" },
        },
        {
            name: "password",
            type: "password",
            label: "Password",
            placeholder: "Enter password",
            autoComplete: "new-password",
            validation: {
                ...validators.password(),
                // Once the confirmation has been filled in, keep it in step
                // with the password as that changes
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
            label: "Confirm password",
            placeholder: "Re-enter password",
            autoComplete: "new-password",
            validation: validators.confirmPassword(methods.getValues),
        },
    ];

    const handleSubmit = async ({ email }: AdminRegistrationFormValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate creating the account and
            // sending the code so the flow is testable end-to-end.
            await new Promise((resolve) => setTimeout(resolve, 800));
            const trimmedEmail = email.trim();
            toast.success(`We sent a verification code to ${trimmedEmail}`);
            onCodeSent(trimmedEmail);
        } catch {
            toast.error("Couldn't create your account. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<AdminRegistrationFormValues>
            methods={methods}
            fields={fields}
            rowPairs={[["firstName", "lastName"]]}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            fieldGapClassName={AUTH_FORM_FIELD_GAP}
            hideRequiredMarks
            renderFooter={({ isLoading, canSubmit }) => (
                <FormSubmitButton
                    label="Create account"
                    loadingLabel="Creating account..."
                    icon={<ArrowRight className="size-4" />}
                    isLoading={isLoading}
                    disabled={!canSubmit}
                    className="mt-5"
                />
            )}
        />
    );
}
