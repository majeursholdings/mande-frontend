"use client";

import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import OtpInput from "@/components/form/otpInput";
import { OTP_LENGTH } from "@/constant/global";
import { authService, type PublicUser } from "@/lib/services/authService";
import { MandeApiError } from "@/lib/types/api";
import { FormSubmitButton } from "./formButtons";

type LoginCodeFormValues = {
    otp: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// LoginCodeForm — a staff log in's second step: the code from their email
// or authenticator app, sent with the challenge the password step got back.
// Checks it as soon as the last digit is in. A new code means logging in
// again (the page's "Start again"), which also starts a fresh challenge.
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginCodeForm({
    mfaToken,
    onSignedIn,
}: {
    /** From the password step: ties this code to that log in. */
    mfaToken: string;
    onSignedIn: (user: PublicUser) => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<LoginCodeFormValues>({ defaultValues: { otp: "" } });
    const { field, fieldState } = useController({
        name: "otp",
        control: methods.control,
        rules: {
            required: "Enter the code",
            validate: (value: string) => value.length === OTP_LENGTH || `Enter all ${OTP_LENGTH} digits`,
        },
    });
    const code = field.value ?? "";

    const handleSubmit = async ({ otp }: LoginCodeFormValues) => {
        setIsLoading(true);
        try {
            const result = await authService.login2FA(mfaToken, otp);
            onSignedIn(result.user);
        } catch (error) {
            methods.setValue("otp", "");
            toast.error(
                error instanceof MandeApiError && error.status === 429
                    ? "Too many tries. Please wait a few minutes, then log in again."
                    : error instanceof MandeApiError && error.status < 500
                      ? "That code isn't right, or it has expired. Try again, or start again for a new one."
                      : "Couldn't check the code. Please try again.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<LoginCodeFormValues>
            methods={methods}
            fields={[]}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            footerSlot={
                <div className="flex flex-col gap-4">
                    <OtpInput
                        length={OTP_LENGTH}
                        value={code}
                        onChange={(value) => {
                            field.onChange(value);
                            // Checks the code as soon as the last digit is in
                            if (value.length === OTP_LENGTH && !isLoading) {
                                void methods.handleSubmit(handleSubmit)();
                            }
                        }}
                        disabled={isLoading}
                        error={!!fieldState.error}
                        name={field.name}
                        autoFocus
                    />
                    {fieldState.error && <span className="text-xs font-text text-error-500">{fieldState.error.message}</span>}
                </div>
            }
            renderFooter={({ isLoading }) => (
                <FormSubmitButton
                    label="Log in"
                    loadingLabel="Checking..."
                    isLoading={isLoading}
                    disabled={code.length !== OTP_LENGTH}
                    className="mt-5"
                />
            )}
        />
    );
}
