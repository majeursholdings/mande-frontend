"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { isPhoneNumber } from "@/components/form/form.validators";
import { ADMIN_POSITION_OPTIONS } from "@/constant/admin";
import { getOptionLabel } from "@/constant/manufacturer";
import { staffService } from "@/lib/services/staffService";
import { useAdminProfile } from "../dashboardLayout/adminProfileContext";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import { FormSubmitButton } from "./formButtons";

type AdminBasicInfoFormValues = {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    phone: string;
};

const FIELDS: FormFieldConfig[] = [
    // Name, email and position are shown for reference — only a super admin can change them
    { name: "firstName", type: "text", label: "First name", disabled: true },
    { name: "lastName", type: "text", label: "Last name", disabled: true },
    { name: "email", type: "email", label: "Email", disabled: true },
    { name: "position", type: "text", label: "Position", disabled: true },
    {
        name: "phone",
        type: "tel",
        label: "Phone number",
        placeholder: "e.g. +234 801 234 5678",
        autoComplete: "tel",
        description: "So manufacturers and other admins can call you about a job.",
        validation: {
            required: "Phone number is required",
            validate: (value: string) =>
                isPhoneNumber(value) || "Enter a valid phone number, e.g. +234 801 234 5678",
        },
    },
];

/**
 * The admin's own details — all fixed except their phone number (given at
 * sign-up), which they can change. A super admin has no position, and can
 * change their name too.
 */
export default function AdminBasicInfoForm() {
    const { profile, updateProfile } = useAdminProfile();
    const { leadId, permissions } = useStaffPlatform();
    const hasPosition = !!leadId;
    const canChangeName = permissions.managesPlatform;
    const fields = FIELDS.filter((field) => hasPosition || field.name !== "position").map((field) =>
        canChangeName && (field.name === "firstName" || field.name === "lastName")
            ? {
                  ...field,
                  disabled: false,
                  validation: {
                      required: `${field.label} is required`,
                      validate: (value: string) => value.trim().length > 0 || `${field.label} is required`,
                  },
              }
            : field,
    );
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AdminBasicInfoFormValues>({
        mode: "onTouched",
        defaultValues: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            position: getOptionLabel(ADMIN_POSITION_OPTIONS, profile.position),
            phone: profile.phone,
        },
    });
    const { isDirty } = methods.formState;

    const handleSubmit = async (values: AdminBasicInfoFormValues) => {
        setIsLoading(true);
        try {
            const saved = {
                ...values,
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                phone: values.phone.trim(),
            };
            await staffService.updateBasicInfo(
                canChangeName
                    ? { firstName: saved.firstName, lastName: saved.lastName, phone: saved.phone }
                    : { phone: saved.phone },
            );
            updateProfile(
                canChangeName
                    ? { firstName: saved.firstName, lastName: saved.lastName, phone: saved.phone }
                    : { phone: saved.phone },
            );
            // The saved values become the new baseline, so Save greys out again
            methods.reset(saved);
            toast.success(canChangeName ? "Profile updated" : "Phone number updated");
        } catch {
            toast.error(
                canChangeName
                    ? "Couldn't save your profile. Please try again."
                    : "Couldn't save your phone number. Please try again.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<AdminBasicInfoFormValues>
            methods={methods}
            fields={fields}
            rowPairs={hasPosition ? [["firstName", "lastName"], ["email", "position"]] : [["firstName", "lastName"]]}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end">
                    <FormSubmitButton
                        label="Save"
                        loadingLabel="Saving..."
                        isLoading={isLoading}
                        disabled={!canSubmit || !isDirty}
                        className="w-auto px-8"
                    />
                </div>
            )}
        />
    );
}
