"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import Notice from "@/components/manufacturerPlatform/notice";
import { getVerificationAfterSave } from "@/constant/manufacturer";
import { FormSubmitButton } from "./formButtons";

// Named apart from the About Company form's fields — MainForm uses field names
// as input ids, and that form can be mounted (in a hidden tab) under this one
type BusinessDocumentsFormValues = {
    taxNumber: string;
    licenseNumber: string;
};

// Trimmed so a value made of only spaces doesn't pass
const notBlank = (label: string) => (value: string) =>
    value.trim().length > 0 || `${label} is required`;

const TAX_NUMBER_FIELD: FormFieldConfig = {
    name: "taxNumber",
    type: "text",
    label: "Company tax number",
    placeholder: "e.g. TT-0444339",
    validation: {
        required: "Company tax number is required",
        validate: notBlank("Company tax number"),
    },
};

const LICENSE_NUMBER_FIELD: FormFieldConfig = {
    name: "licenseNumber",
    type: "text",
    label: "Business license number",
    placeholder: "e.g. 45599KT",
    validation: {
        required: "Business license number is required",
        validate: notBlank("Business license number"),
    },
};

/** Asks for whichever of the tax number and business license number is still missing. */
export default function BusinessDocumentsForm() {
    const { profile, updateProfile } = useManufacturerProfile();
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<BusinessDocumentsFormValues>({
        mode: "onTouched",
        defaultValues: {
            taxNumber: profile.companyTaxNumber,
            licenseNumber: profile.businessLicenseNumber,
        },
    });

    const fields = [
        ...(profile.companyTaxNumber.trim() ? [] : [TAX_NUMBER_FIELD]),
        ...(profile.businessLicenseNumber.trim() ? [] : [LICENSE_NUMBER_FIELD]),
    ];

    const handleSubmit = async (values: BusinessDocumentsFormValues) => {
        setIsLoading(true);
        try {
            const companyTaxNumber = values.taxNumber.trim();
            const businessLicenseNumber = values.licenseNumber.trim();
            await manufacturerService.submitBusinessDocuments({
                companyTaxNumber: companyTaxNumber || undefined,
                businessLicenseNumber: businessLicenseNumber || undefined,
            });
            updateProfile({
                companyTaxNumber,
                companyTaxNumberVerification: getVerificationAfterSave(
                    profile.companyTaxNumber,
                    companyTaxNumber,
                    profile.companyTaxNumberVerification,
                ),
                businessLicenseNumber,
                businessLicenseNumberVerification: getVerificationAfterSave(
                    profile.businessLicenseNumber,
                    businessLicenseNumber,
                    profile.businessLicenseNumberVerification,
                ),
            });
            toast.success("Business details submitted");
        } catch {
            toast.error("Couldn't submit your business details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<BusinessDocumentsFormValues>
            methods={methods}
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            footerSlot={
                <Notice tone="warning">
                    These can&apos;t be changed once submitted, so check them against your
                    company documents.
                </Notice>
            }
            renderFooter={({ isLoading, canSubmit }) => (
                <FormSubmitButton
                    label="Submit details"
                    loadingLabel="Submitting..."
                    isLoading={isLoading}
                    disabled={!canSubmit}
                    className="w-full"
                />
            )}
        />
    );
}
