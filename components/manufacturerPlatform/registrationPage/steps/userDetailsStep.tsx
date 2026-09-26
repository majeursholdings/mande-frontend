"use client";

import Link from "next/link";
import { UseFormReturn } from "react-hook-form";
import MainForm from "@/components/form";
import { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import StepFooter from "../stepFooter";
import StepHeader from "../stepHeader";
import { RegistrationFormValues } from "../types";

export type UserDetailsStepProps = {
    methods: UseFormReturn<RegistrationFormValues>;
    onContinue: (values: RegistrationFormValues) => void;
    isLoading: boolean;
};

export default function UserDetailsStep({
    methods,
    onContinue,
    isLoading,
}: UserDetailsStepProps) {
    const fields: FormFieldConfig[] = [
        {
            name: "firstName",
            type: "text",
            label: "First name",
            placeholder: "e.g. Demi",
            autoComplete: "given-name",
            validation: validators.name("First name"),
        },
        {
            name: "lastName",
            type: "text",
            label: "Last name",
            placeholder: "e.g. Semande",
            autoComplete: "family-name",
            validation: validators.name("Last name"),
        },
        {
            name: "email",
            type: "email",
            label: "Email",
            placeholder: "e.g. demi@example.com",
            autoComplete: "email",
            validation: validators.email(),
        },
        {
            name: "password",
            type: "password",
            label: "Password",
            placeholder: "At least 8 characters",
            autoComplete: "new-password",
            validation: validators.password(),
        },
        {
            name: "agreeToTerms",
            type: "checkbox",
            label: (
                <span>
                    I agree to all{" "}
                    <Link
                        href="/terms-and-conditions"
                        className="text-secondary-700 hover:underline"
                    >
                        Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/privacy-policy"
                        className="text-secondary-700 hover:underline"
                    >
                        Privacy Policy
                    </Link>
                </span>
            ),
            validation: validators.checkbox(
                "You must agree to the Terms and Privacy Policy",
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <StepHeader
                step={1}
                title={
                    <>
                        Welcome to{" "}
                        <span className="text-secondary-700">Mande!</span>
                    </>
                }
                description="Create your account to get started."
            />

            <MainForm<RegistrationFormValues>
                methods={methods}
                fields={fields}
                rowPairs={[["firstName", "lastName"]]}
                onSubmit={onContinue}
                isLoading={isLoading}
                renderFooter={({ isLoading, canSubmit }) => (
                    <StepFooter
                        isLoading={isLoading}
                        canSubmit={canSubmit}
                        submitLabel="Continue"
                    />
                )}
            />
        </div>
    );
}
