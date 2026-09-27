"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { isPhoneNumber, validators } from "@/components/form/form.validators";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import { FormSubmitButton } from "./formButtons";

type BasicInfoFormValues = {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    /** ISO date string, "" when not set. */
    dateOfBirth: string;
};

const FIELDS: FormFieldConfig[] = [
    {
        name: "firstName",
        type: "text",
        label: "First name",
        placeholder: "e.g. Demi",
        autoComplete: "given-name",
        validation: {
            ...validators.name("First name"),
            // Trimmed so a name made of only spaces doesn't pass
            validate: (value: string) =>
                value.trim().length >= 2 || "First name must be at least 2 characters",
        },
    },
    {
        name: "lastName",
        type: "text",
        label: "Last name",
        placeholder: "e.g. Semande",
        autoComplete: "family-name",
        validation: {
            ...validators.name("Last name"),
            validate: (value: string) =>
                value.trim().length >= 2 || "Last name must be at least 2 characters",
        },
    },
    {
        // The sign-in email — shown for reference, can't be changed here
        name: "email",
        type: "email",
        label: "Email",
        autoComplete: "email",
        disabled: true,
    },
    {
        name: "phoneNumber",
        type: "tel",
        label: "Phone number",
        placeholder: "e.g. +234 801 234 5678",
        autoComplete: "tel",
        validation: {
            required: "Phone number is required",
            validate: (value: string) =>
                isPhoneNumber(value) || "Enter a valid phone number, e.g. +234 801 234 5678",
        },
    },
    {
        name: "dateOfBirth",
        type: "date",
        label: "Date of birth",
        placeholder: "Select date of birth",
        isDateDisabled: (date: Date) => date > new Date(),
        validation: { required: "Date of birth is required" },
    },
];

export default function ProfileBasicInfoForm() {
    const { profile, updateProfile } = useManufacturerProfile();
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<BasicInfoFormValues>({
        mode: "onTouched",
        defaultValues: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phoneNumber: profile.phoneNumber,
            dateOfBirth: profile.dateOfBirth ?? "",
        },
    });
    const { isDirty } = methods.formState;

    const handleSubmit = async (values: BasicInfoFormValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate the request so the flow
            // is testable end-to-end.
            await new Promise((resolve) => setTimeout(resolve, 800));
            const changes = {
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                phoneNumber: values.phoneNumber.trim(),
                dateOfBirth: values.dateOfBirth,
            };
            updateProfile(changes);
            // The saved values become the new baseline, so Save greys out again
            methods.reset({ ...changes, email: profile.email });
            toast.success("Profile updated successfully");
        } catch {
            toast.error("Couldn't update your profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<BasicInfoFormValues>
            methods={methods}
            fields={FIELDS}
            rowPairs={[
                ["firstName", "lastName"],
                ["phoneNumber", "dateOfBirth"],
            ]}
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
