"use client";

import { UseFormReturn } from "react-hook-form";
import MainForm from "@/components/form";
import { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import StepFooter from "../stepFooter";
import StepHeader from "../stepHeader";
import { RegistrationFormValues } from "../types";

export type AboutCompanyStepProps = {
    methods: UseFormReturn<RegistrationFormValues>;
    onContinue: (values: RegistrationFormValues) => void;
    onBack: () => void;
    isLoading: boolean;
};

export default function AboutCompanyStep({
    methods,
    onContinue,
    onBack,
    isLoading,
}: AboutCompanyStepProps) {
    const fields: FormFieldConfig[] = [
        {
            name: "companyName",
            type: "text",
            label: "Company name",
            placeholder: "Enter company name",
            validation: validators.required("Company name"),
        },
        {
            name: "companyAddress",
            type: "text",
            label: "Company address",
            placeholder: "Enter company address",
            validation: validators.required("Company address"),
        },
        {
            name: "companyTaxNumber",
            type: "text",
            label: "Company tax number",
            placeholder: "e.g. TT-0444339",
            validation: validators.required("Company tax number"),
        },
        {
            name: "chambersOfCommerceNumber",
            type: "text",
            label: "Chambers of commerce number",
            placeholder: "e.g. 45599KT",
            validation: validators.required("Chambers of commerce number"),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <StepHeader
                step={3}
                totalSteps={4}
                title="About your company"
                description="Tell us about your company"
            />

            <MainForm<RegistrationFormValues>
                methods={methods}
                fields={fields}
                onSubmit={onContinue}
                isLoading={isLoading}
                renderFooter={({ isLoading, canSubmit }) => (
                    <StepFooter
                        isLoading={isLoading}
                        canSubmit={canSubmit}
                        submitLabel="Continue"
                        onBack={onBack}
                    />
                )}
            />
        </div>
    );
}
