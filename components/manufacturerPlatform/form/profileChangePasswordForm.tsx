"use client";

import { useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import { authService } from "@/lib/services/authService";
import { OtpCodeDialog } from "@/components/manufacturerPlatform/otpVerificationDialog";
import { getOtpChannel, type TwoFactorMethod } from "@/constant/manufacturer";
import { FormSubmitButton } from "./formButtons";

type ChangePasswordFormValues = {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
};

const CHANGE_PASSWORD_DEFAULT_VALUES: ChangePasswordFormValues = {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
};

const FIELDS: FormFieldConfig[] = [
    {
        name: "oldPassword",
        type: "password",
        label: "Old Password",
        placeholder: "Enter old password",
        autoComplete: "current-password",
        validation: { required: "Old password is required" },
    },
    {
        name: "newPassword",
        type: "password",
        label: "New Password",
        placeholder: "Enter new password",
        autoComplete: "new-password",
        validation: {
            ...validators.password(),
            validate: (value: string, values: FieldValues) =>
                value !== values.oldPassword ||
                "New password must be different from your old password",
        },
    },
    {
        name: "confirmPassword",
        type: "password",
        label: "Confirm New Password",
        placeholder: "Re-enter new password",
        autoComplete: "new-password",
        validation: {
            required: "Please confirm your new password",
            validate: (value: string, values: FieldValues) =>
                value === values.newPassword || "Passwords do not match",
        },
    },
];

/** The signed-in manufacturer's password change. */
export default function ProfileChangePasswordForm() {
    const { profile } = useManufacturerProfile();
    return <ChangePasswordForm email={profile.email} codeChannel={getOtpChannel(profile)} />;
}

// Saving doesn't change the password straight away — it asks for a one-time
// code first, and the change happens once that's verified. For any account,
// e.g. an admin's.
export function ChangePasswordForm({
    email,
    codeChannel,
}: {
    /** Where an emailed code goes. */
    email: string;
    /** Where the code comes from — their authenticator app if that's their two-factor method, else email. */
    codeChannel: TwoFactorMethod;
}) {
    const [isAwaitingCode, setIsAwaitingCode] = useState(false);
    const methods = useForm<ChangePasswordFormValues>({
        mode: "onTouched",
        defaultValues: CHANGE_PASSWORD_DEFAULT_VALUES,
    });
    const { isDirty } = methods.formState;

    const handleSubmit = () => {
        try {
            setIsAwaitingCode(true);
        } catch {
            toast.error("Couldn't change your password. Please try again.");
        }
    };

    const handleVerified = async () => {
        setIsAwaitingCode(false);
        try {
            const values = methods.getValues();
            await authService.changePassword({
                currentPassword: values.oldPassword,
                newPassword: values.newPassword,
            });
            // Clear all three fields so the passwords don't linger on screen
            methods.reset();
            toast.success("Password changed successfully");
        } catch {
            toast.error("Couldn't change your password. Please check your current password and try again.");
        }
    };

    return (
        <>
            <MainForm<ChangePasswordFormValues>
                methods={methods}
                fields={FIELDS}
                onSubmit={handleSubmit}
                renderFooter={({ canSubmit }) => (
                    <div className="flex justify-end">
                        <FormSubmitButton
                            label="Save"
                            isLoading={false}
                            disabled={!canSubmit || !isDirty}
                        />
                    </div>
                )}
            />
            <OtpCodeDialog
                email={email}
                open={isAwaitingCode}
                onOpenChange={setIsAwaitingCode}
                title="Confirm password change"
                intro="To keep your account safe, confirm it's you before changing your password."
                channel={codeChannel}
                confirmLabel="Change password"
                onVerified={handleVerified}
            />
        </>
    );
}
