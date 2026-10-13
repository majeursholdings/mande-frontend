"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import { useManufacturerSubscription } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerSubscriptionContext";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { getErrorMessage } from "@/lib/api";
import { getProfileOptionLabel, isLegacyOptionValue } from "@/lib/mappers/profileMappers";
import LoadError from "@/components/manufacturerPlatform/loadError";
import VerificationBadge from "@/components/manufacturerPlatform/verificationBadge";
import {
    COMPANY_SPECIALITY_OPTIONS,
    MATERIALS_INVENTORY_OPTIONS,
    MAX_COMPANY_SPECIALITIES,
    PRODUCTION_LEAD_TIME_OPTIONS,
    STAFF_RANGE_OPTIONS,
    type DocumentVerification,
    type ManufacturerProfile,
} from "@/constant/manufacturer";
import { requiresBusinessDocuments } from "@/constant/plans";
import { ADDRESS_ROW_PAIRS, getAddressFields, type AddressFormValues } from "./addressFields";
import { FormSubmitButton } from "./formButtons";
import FormFieldsSkeleton from "./formFieldsSkeleton";

type AboutCompanyFormValues = AddressFormValues & {
    // Set at registration — shown for reference only
    companyName: string;
    // Editable until submitted, then locked unless rejected
    companyTaxNumber: string;
    businessLicenseNumber: string;
    staffRange: string;
    productionLeadTime: string;
    materialsInventory: string;
    specialities: string[];
};

// The same checks as the API's /kyc/business (kyc.validation.ts)
const TAX_NUMBER_PATTERN = /^[A-Za-z0-9-]{5,40}$/;
const TAX_NUMBER_MESSAGE = "Enter the tax number as it's written (5 to 40 letters, numbers or dashes)";
const LICENSE_NUMBER_PATTERN = /^[A-Za-z0-9/-]{3,40}$/;
const LICENSE_NUMBER_MESSAGE = "Enter the registration number as it's written (3 to 40 letters, numbers, dashes or slashes)";

// Trimmed so a value made of only spaces doesn't pass
const notBlank = (label: string) => (value: string) =>
    value.trim().length > 0 || `${label} is required`;

/**
 * A saved value the select no longer offers (from an older sign-up): it's
 * kept, and named under the field, until they choose one of today's options.
 */
const legacyDescription = (value: string, options: FormFieldConfig["options"] = []) =>
    isLegacyOptionValue(value)
        ? `Currently ${getProfileOptionLabel(options, value)}. Choose an option to update it.`
        : undefined;

const getCompanyDetailFields = (profile: ManufacturerProfile): FormFieldConfig[] => [
    {
        name: "staffRange",
        type: "select",
        label: "How many staff members do you have?",
        placeholder: "e.g. 21 to 30",
        options: STAFF_RANGE_OPTIONS,
        description: legacyDescription(profile.staffRange, STAFF_RANGE_OPTIONS),
        validation: { required: "Please select a staff range" },
    },
    {
        name: "productionLeadTime",
        type: "select",
        label: "How long does a typical order take to produce?",
        placeholder: "e.g. 3 to 4 weeks",
        options: PRODUCTION_LEAD_TIME_OPTIONS,
        description: legacyDescription(profile.productionLeadTime, PRODUCTION_LEAD_TIME_OPTIONS),
        validation: { required: "Please select a production lead time" },
    },
    {
        name: "materialsInventory",
        type: "select",
        label: "Do you keep an inventory of materials?",
        placeholder: "Yes or no",
        options: MATERIALS_INVENTORY_OPTIONS,
        validation: { required: "Please choose yes or no" },
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
 * is Solo) until it's been submitted, then locked with its verification
 * status beside the label. A rejected number opens up again, so it can be
 * corrected and resubmitted.
 */
function businessDocumentField({
    name,
    label,
    placeholder,
    isRequired,
    verification,
    pattern,
}: {
    name: keyof AboutCompanyFormValues;
    label: string;
    placeholder: string;
    isRequired: boolean;
    /** The API's format check for the number, and what to say when it fails. */
    pattern: { value: RegExp; message: string };
    /** Null until the number has been submitted. */
    verification: DocumentVerification | null;
}): FormFieldConfig {
    // Blank passes unless it's required; anything typed must match the API's format
    const validate = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return isRequired ? notBlank(label)(value) : true;
        return pattern.value.test(trimmed) || pattern.message;
    };

    if (!verification) {
        return {
            name,
            type: "text",
            label: isRequired ? label : `${label} (optional)`,
            placeholder,
            validation: isRequired ? { required: `${label} is required`, validate } : { validate },
        };
    }

    const labelWithStatus = (
        <>
            {label}
            <VerificationBadge status={verification.status} />
        </>
    );
    if (verification.status !== "rejected") {
        return { name, type: "text", label: labelWithStatus, disabled: true };
    }
    return {
        name,
        type: "text",
        label: labelWithStatus,
        placeholder,
        description: `${verification.rejectionReason ?? `We couldn't verify this ${label.toLowerCase()}.`} Correct it and save to resubmit.`,
        // Not `required` — it already holds the rejected number, and an
        // asterisk after the badge would only add noise
        validation: { validate },
    };
}

// Remounts the form when the saved tax number or license changes (e.g. they
// were just submitted from the business details prompt), so a now-locked
// field shows its saved value instead of a stale, empty, editable one.
export default function ProfileAboutCompanyForm() {
    const { profile } = useManufacturerProfile();
    return (
        <AboutCompanyForm
            key={`${profile.companyName}|${profile.companyTaxNumber}|${profile.businessLicenseNumber}|${profile.companyAddress.streetAddress}|${profile.companyAddress.city}|${profile.staffRange}|${profile.productionLeadTime}|${profile.materialsInventory ?? ""}|${profile.specialities.join(",")}`}
        />
    );
}

function AboutCompanyForm() {
    const {
        profile,
        applyProfileResponse,
        applyKycResponse,
        isLoading: isProfileLoading,
        isError: isProfileError,
    } = useManufacturerProfile();
    const { subscription, isLoading: isSubscriptionLoading } = useManufacturerSubscription();
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AboutCompanyFormValues>({
        mode: "onTouched",
        defaultValues: {
            companyName: profile.companyName,
            companyTaxNumber: profile.companyTaxNumber,
            businessLicenseNumber: profile.businessLicenseNumber,
            ...profile.companyAddress,
            staffRange: profile.staffRange,
            productionLeadTime: profile.productionLeadTime,
            materialsInventory: profile.materialsInventory ?? "",
            specialities: profile.specialities,
        },
    });
    const { isDirty } = methods.formState;
    const country = useWatch({ control: methods.control, name: "country" });

    const taxNumberVerification = profile.companyTaxNumber.trim()
        ? profile.companyTaxNumberVerification
        : null;
    const licenseVerification = profile.businessLicenseNumber.trim()
        ? profile.businessLicenseNumberVerification
        : null;
    const documentsRequired = !!subscription && requiresBusinessDocuments(subscription.planId);

    const fields: FormFieldConfig[] = [
        { name: "companyName", type: "text", label: "Company name", disabled: true },
        businessDocumentField({
            name: "companyTaxNumber",
            label: "Company tax number",
            placeholder: "e.g. TT-0444339",
            isRequired: documentsRequired,
            verification: taxNumberVerification,
            pattern: { value: TAX_NUMBER_PATTERN, message: TAX_NUMBER_MESSAGE },
        }),
        businessDocumentField({
            name: "businessLicenseNumber",
            label: "Business license number",
            placeholder: "e.g. 45599KT",
            isRequired: documentsRequired,
            verification: licenseVerification,
            pattern: { value: LICENSE_NUMBER_PATTERN, message: LICENSE_NUMBER_MESSAGE },
        }),
        ...getAddressFields({
            country,
            onCountryChange: () => methods.setValue("state", "", { shouldDirty: true }),
        }),
        ...getCompanyDetailFields(profile),
    ];

    const isLocked = (verification: DocumentVerification | null) =>
        !!verification && verification.status !== "rejected";
    const description =
        isLocked(taxNumberVerification) && isLocked(licenseVerification)
            ? "Your company name, tax number and business license number can't be changed. Contact support if any of them need updating."
            : "Your company name can't be changed. Your tax number and business license number can't be changed once submitted, so check them before you save.";

    const handleSubmit = async (values: AboutCompanyFormValues) => {
        setIsLoading(true);
        const companyTaxNumber = values.companyTaxNumber.trim();
        const businessLicenseNumber = values.businessLicenseNumber.trim();
        const documentsChanged =
            (!!companyTaxNumber && companyTaxNumber !== profile.companyTaxNumber) ||
            (!!businessLicenseNumber && businessLicenseNumber !== profile.businessLicenseNumber);
        // Two saves: the numbers go to /kyc/business (checked there) first, then
        // the company details. Each is reported on its own if it fails.
        let documentsSaved = false;
        try {
            if (documentsChanged) {
                applyKycResponse(
                    await manufacturerService.submitBusinessDocuments({
                        companyTaxNumber: companyTaxNumber || undefined,
                        businessLicenseNumber: businessLicenseNumber || undefined,
                    }),
                );
                documentsSaved = true;
            }

            // The API's answer (with the documents' new status) replaces what's shown,
            // and the form remounts on it, so Save greys out again
            applyProfileResponse(
                await manufacturerService.updateCompanyInfo({
                    streetAddress: values.streetAddress.trim(),
                    city: values.city.trim(),
                    state: values.state,
                    country: values.country,
                    specialities: values.specialities,
                    staffRange: values.staffRange,
                    productionLeadTime: values.productionLeadTime,
                    materialsInventory: values.materialsInventory,
                }),
            );
            toast.success("Company details updated successfully");
        } catch (err) {
            if (documentsSaved) {
                toast.error(
                    `Your tax and license numbers were submitted, but the other company details weren't saved. ${getErrorMessage(err, "Please try again.")}`,
                );
            } else if (documentsChanged) {
                toast.error(getErrorMessage(err, "Couldn't submit your tax and license numbers, so nothing was saved. Please try again."));
            } else {
                toast.error(getErrorMessage(err, "Couldn't update your company details. Please try again."));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const rowPairs: [string, string][] = [["companyTaxNumber", "businessLicenseNumber"], ...ADDRESS_ROW_PAIRS];

    if (isProfileLoading || isSubscriptionLoading) {
        return <FormFieldsSkeleton fields={fields} rowPairs={rowPairs} />;
    }

    if (isProfileError) {
        return <LoadError>Couldn&apos;t load your company details. Please refresh the page to try again.</LoadError>;
    }

    return (
        <MainForm<AboutCompanyFormValues>
            methods={methods}
            fields={fields}
            description={description}
            rowPairs={rowPairs}
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
