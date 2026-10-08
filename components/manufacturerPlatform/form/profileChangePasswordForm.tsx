"use client";

import { useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import { authService } from "@/lib/services/authService";
import { getErrorMessage } from "@/lib/api";
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

// Saving doesn't change the password straight away: it sends a one-time code
// (by email, or they use their authenticator app), then the current password
// and that code confirm it's them (POST /auth/reauth) before the change goes
// through with the token that gives. For any account, e.g. an admin's.
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
    const [isSendingCode, setIsSendingCode] = useState(false);
    const methods = useForm<ChangePasswordFormValues>({
        mode: "onTouched",
        defaultValues: CHANGE_PASSWORD_DEFAULT_VALUES,
    });
    const { isDirty } = methods.formState;

    const sendCode = () => authService.sendReauthCode("change your password");

    const handleSubmit = async () => {
        setIsSendingCode(true);
        try {
            // An authenticator app makes its own codes; otherwise one is emailed
            if (codeChannel !== "app") await sendCode();
            setIsAwaitingCode(true);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't send a code. Please try again."));
        } finally {
            setIsSendingCode(false);
        }
    };

    // Throwing keeps the code dialog open, showing the message
    const handleVerified = async (code: string) => {
        const values = methods.getValues();
        try {
            const { reauthToken } = await authService.verifyReauth(values.oldPassword, code);
            await authService.changePassword({ currentPassword: values.oldPassword, newPassword: values.newPassword }, reauthToken);
        } catch (err) {
            throw new Error(getErrorMessage(err, "Couldn't change your password. Please try again."));
        }
        setIsAwaitingCode(false);
        // Clear all three fields so the passwords don't linger on screen
        methods.reset();
        toast.success("Password changed");
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
                            isLoading={isSendingCode}
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
                onResend={codeChannel === "app" ? undefined : async () => void (await sendCode())}
            />
        </>
    );
}
