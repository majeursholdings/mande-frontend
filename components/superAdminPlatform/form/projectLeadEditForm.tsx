"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { isPhoneNumber } from "@/components/form/form.validators";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { ADMIN_POSITION_OPTIONS } from "@/constant/admin";

export type ProjectLeadEditValues = { firstName: string; lastName: string; phone: string; position: string };

/** Only the details that changed, as the API takes them. */
export type ProjectLeadChanges = Partial<ProjectLeadEditValues>;

const NAME_MAX_LENGTH = 80;
const PHONE_MAX_LENGTH = 20;

const nameRules = (label: string) => ({
    required: `${label} is required`,
    validate: (value: string) => value.trim().length > 0 || `${label} is required`,
    maxLength: { value: NAME_MAX_LENGTH, message: `Keep it under ${NAME_MAX_LENGTH} characters` },
});

/**
 * A project lead's name, phone number and position, as a super admin changes
 * them. Submitting hands over only what changed, and moves on to confirming
 * it's them (see ReauthSteps).
 */
export default function ProjectLeadEditForm({
    current,
    onSubmit,
    onCancel,
}: {
    current: ProjectLeadEditValues;
    onSubmit: (changes: ProjectLeadChanges) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<ProjectLeadEditValues>({ mode: "onTouched", defaultValues: current });
    const values = useWatch({ control: methods.control });

    const changesFrom = (next: Partial<ProjectLeadEditValues>): ProjectLeadChanges => {
        const changes: ProjectLeadChanges = {};
        (["firstName", "lastName", "phone", "position"] as const).forEach((key) => {
            const value = (next[key] ?? "").trim();
            if (value && value !== current[key].trim()) changes[key] = value;
        });
        return changes;
    };
    const hasChanges = Object.keys(changesFrom(values)).length > 0;

    const fields: FormFieldConfig[] = [
        { name: "firstName", type: "text", label: "First name", placeholder: "Enter first name", validation: nameRules("First name") },
        { name: "lastName", type: "text", label: "Last name", placeholder: "Enter last name", validation: nameRules("Last name") },
        {
            name: "phone",
            type: "tel",
            label: "Phone number",
            placeholder: "e.g. +234 801 234 5678",
            autoComplete: "off",
            validation: {
                validate: (value: string) => {
                    const phone = value.trim();
                    // A lead who never gave a number can be left without one
                    if (!phone) return !current.phone || "Phone number is required";
                    if (phone.length > PHONE_MAX_LENGTH) return `Keep it under ${PHONE_MAX_LENGTH} characters`;
                    return isPhoneNumber(phone) || "Enter a valid phone number, e.g. +234 801 234 5678";
                },
            },
        },
        {
            name: "position",
            type: "select",
            label: "Position",
            placeholder: "Choose their position",
            options: ADMIN_POSITION_OPTIONS,
            validation: { validate: (value: string) => !!value || !current.position || "Choose their position" },
        },
    ];

    const handleSubmit = async (submitted: ProjectLeadEditValues) => {
        setIsLoading(true);
        try {
            onSubmit(changesFrom(submitted));
        } catch {
            toast.error("Couldn't prepare the changes. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ProjectLeadEditValues>
            methods={methods}
            fields={fields}
            rowPairs={[["firstName", "lastName"]]}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            requireValidToSubmit={false}
            hideRequiredMarks
            renderFooter={({ isLoading }) => (
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <FormSubmitButton label="Continue" isLoading={isLoading} disabled={!hasChanges} className="w-auto px-6" />
                </div>
            )}
        />
    );
}
