"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import { useManufacturerSubscription } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerSubscriptionContext";
import {
    COMPANY_SPECIALITY_OPTIONS,
    MAX_COMPANY_SPECIALITIES,
    STAFF_RANGE_OPTIONS,
} from "@/constant/manufacturer";
import { requiresBusinessDocuments } from "@/constant/sampleData";
import { ADDRESS_ROW_PAIRS, getAddressFields, type AddressFormValues } from "./addressFields";
import { FormSubmitButton } from "./formButtons";

type AboutCompanyFormValues = AddressFormValues & {
    // Set at registration — shown for reference only
    companyName: string;
    // Editable until submitted, then locked
    companyTaxNumber: string;
    businessLicenseNumber: string;
    staffRange: string;
    specialities: string[];
};

// Trimmed so a value made of only spaces doesn't pass
const notBlank = (label: string) => (value: string) =>
    value.trim().length > 0 || `${label} is required`;

const COMPANY_DETAIL_FIELDS: FormFieldConfig[] = [
    {
        name: "staffRange",
        type: "select",
        label: "How many staff members do you have?",
        placeholder: "e.g. 21 to 30",
        options: STAFF_RANGE_OPTIONS,
        validation: { required: "Please select a staff range" },
    },
    {
        name: "specialities",
        type: "multiselect",
        label: `Specialities (select up to ${MAX_COMPANY_SPECIALITIES})`,
        placeholder: "e.g. Beds, Desks",
        options: COMPANY_SPECIALITY_OPTIONS,
        maxSelections: MAX_COMPANY_SPECIALITIES,
        validation: {
            validate: (value: string[]) =>
                (Array.isArray(value) && value.length > 0) || "Select at least one speciality",
        },
    },
];

/**
 * A tax number / business license field — editable (required unless the plan
 * is Solo) until it's been submitted, then locked.
 */
function businessDocumentField({
    name,
    label,
    placeholder,
    isSubmitted,
    isRequired,
}: {
    name: keyof AboutCompanyFormValues;
    label: string;
    placeholder: string;
    isSubmitted: boolean;
    isRequired: boolean;
}): FormFieldConfig {
    if (isSubmitted) return { name, type: "text", label, disabled: true };
    return {
        name,
        type: "text",
        label: isRequired ? label : `${label} (optional)`,
        placeholder,
        validation: isRequired
            ? { required: `${label} is required`, validate: notBlank(label) }
            : undefined,
    };
}

// Remounts the form when the saved tax number or license changes (e.g. they
// were just submitted from the business details prompt), so a now-locked
// field shows its saved value instead of a stale, empty, editable one.
export default function ProfileAboutCompanyForm() {
    const { profile } = useManufacturerProfile();
    return (
        <AboutCompanyForm
            key={`${profile.companyTaxNumber}|${profile.businessLicenseNumber}`}
        />
    );
}

function AboutCompanyForm() {
    const { profile, updateProfile } = useManufacturerProfile();
    const { subscription } = useManufacturerSubscription();
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AboutCompanyFormValues>({
        mode: "onTouched",
        defaultValues: {
            companyName: profile.companyName,
            companyTaxNumber: profile.companyTaxNumber,
            businessLicenseNumber: profile.businessLicenseNumber,
            ...profile.companyAddress,
            staffRange: profile.staffRange,
            specialities: profile.specialities,
        },
    });
    const { isDirty } = methods.formState;
    const country = useWatch({ control: methods.control, name: "country" });

    const isTaxNumberSubmitted = !!profile.companyTaxNumber.trim();
    const isLicenseSubmitted = !!profile.businessLicenseNumber.trim();
    const documentsRequired = requiresBusinessDocuments(subscription.planId);

    const fields: FormFieldConfig[] = [
        { name: "companyName", type: "text", label: "Company name", disabled: true },
        businessDocumentField({
            name: "companyTaxNumber",
            label: "Company tax number",
            placeholder: "e.g. TT-0444339",
            isSubmitted: isTaxNumberSubmitted,
            isRequired: documentsRequired,
        }),
        businessDocumentField({
            name: "businessLicenseNumber",
            label: "Business license number",
            placeholder: "e.g. 45599KT",
            isSubmitted: isLicenseSubmitted,
            isRequired: documentsRequired,
        }),
        ...getAddressFields({
            country,
            onCountryChange: () => methods.setValue("state", "", { shouldDirty: true }),
        }),
        ...COMPANY_DETAIL_FIELDS,
    ];

    const description =
        isTaxNumberSubmitted && isLicenseSubmitted
            ? "Your company name, tax number and business license number can't be changed. Contact support if any of them need updating."
            : "Your company name can't be changed. Your tax number and business license number can't be changed once submitted, so check them before you save.";

    const handleSubmit = async (values: AboutCompanyFormValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate the request so the flow
            // is testable end-to-end. Locked fields are sent unchanged.
            await new Promise((resolve) => setTimeout(resolve, 800));
            const companyAddress = {
                streetAddress: values.streetAddress.trim(),
                city: values.city.trim(),
                state: values.state,
                country: values.country,
            };
            const changes = {
                companyTaxNumber: values.companyTaxNumber.trim(),
                businessLicenseNumber: values.businessLicenseNumber.trim(),
                companyAddress,
                staffRange: values.staffRange,
                specialities: values.specialities,
            };
            updateProfile(changes);
            // The saved values become the new baseline, so Save greys out again
            methods.reset({
                companyName: profile.companyName,
                companyTaxNumber: changes.companyTaxNumber,
                businessLicenseNumber: changes.businessLicenseNumber,
                ...companyAddress,
                staffRange: changes.staffRange,
                specialities: changes.specialities,
            });
            toast.success("Company details updated successfully");
        } catch {
            toast.error("Couldn't update your company details. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<AboutCompanyFormValues>
            methods={methods}
            fields={fields}
            description={description}
            rowPairs={[["companyTaxNumber", "businessLicenseNumber"], ...ADDRESS_ROW_PAIRS]}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end">
                    <FormSubmitButton
                        label="Save"
                        loadingLabel="Saving..."
                        isLoading={isLoading}
                        disabled={!canSubmit || !isDirty}
                    />
                </div>
            )}
        />
    );
}
