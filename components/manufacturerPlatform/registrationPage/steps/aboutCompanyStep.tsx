"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import MainForm from "@/components/form";
import { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import {
    ADDRESS_ROW_PAIRS,
    getAddressFields,
} from "@/components/manufacturerPlatform/form/addressFields";
import StepFooter from "../stepFooter";
import StepHeader from "../stepHeader";
import { isSoloPlan, RegistrationFormValues } from "../types";

export type AboutCompanyStepProps = {
    methods: UseFormReturn<RegistrationFormValues>;
    onContinue: (values: RegistrationFormValues) => void;
    onBack: () => void;
    isLoading: boolean;
};

// Step 4 — company details and documents. Tax number and business license
// are optional on the Solo plan; everyone adds a photo of their NIN card.
export default function AboutCompanyStep({
    methods,
    onContinue,
    onBack,
    isLoading,
}: AboutCompanyStepProps) {
    const [plan, country] = useWatch({ control: methods.control, name: ["plan", "country"] });
    const isOptional = isSoloPlan(plan);

    const fields: FormFieldConfig[] = [
        {
            name: "companyName",
            type: "text",
            label: "Company name",
            placeholder: "e.g. Majeurs Chesterfield",
            autoComplete: "organization",
            validation: {
                ...validators.required("Company name"),
                // Trimmed so a name made of only spaces doesn't pass
                validate: (value: string) => value.trim().length > 0 || "Company name is required",
            },
        },
        ...getAddressFields({
            country,
            onCountryChange: () => methods.setValue("state", ""),
        }),
        {
            name: "companyTaxNumber",
            type: "text",
            label: isOptional ? "Company tax number (optional)" : "Company tax number",
            placeholder: "e.g. TT-0444339",
            validation: isOptional ? undefined : validators.required("Company tax number"),
        },
        {
            name: "businessLicenseNumber",
            type: "text",
            label: isOptional ? "Business license number (optional)" : "Business license number",
            placeholder: "e.g. 45599KT",
            validation: isOptional ? undefined : validators.required("Business license number"),
        },
        {
            name: "ninNumber",
            type: "text",
            label: "NIN",
            placeholder: "11-digit National Identification Number",
            inputMode: "numeric",
            autoComplete: "off",
            description: "We check it against the national records, with your name. Only its last 4 digits are shown again.",
            validation: {
                required: "Enter your NIN",
                validate: (value: string) => /^\d{11}$/.test(value.trim()) || "Enter your 11-digit NIN",
            },
        },
        {
            name: "ninCard",
            type: "image",
            label: "NIN card",
            description:
                "Snap the front of your National Identification Number card, with all four corners in view. JPG or PNG, up to 5MB.",
            accept: "image/*",
            // Opens the back camera on phones, so the card can be snapped there and then
            capture: "environment",
            maxFiles: 1,
            maxSizeMB: 5,
            // Signed by the API, which only takes its own uploads with the NIN
            uploadPurpose: "nin-card",
            validation: { required: "Add a photo of your NIN card" },
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <StepHeader
                step={4}
                title="About your company"
                description="Tell us where your business is, and add your documents."
            />

            <MainForm<RegistrationFormValues>
                methods={methods}
                fields={fields}
                rowPairs={[...ADDRESS_ROW_PAIRS, ["companyTaxNumber", "businessLicenseNumber"]]}
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
