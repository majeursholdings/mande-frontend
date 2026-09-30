"use client";

import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import OtpInput from "@/components/form/otpInput";
import { useCountdown } from "@/hooks/useCountdown";
import { OTP_LENGTH, OTP_RESEND_SECONDS } from "@/constant/global";
import { authService, type PublicUser } from "@/lib/services/authService";
import { MandeApiError } from "@/lib/types/api";
import { FormSubmitButton } from "./formButtons";

type AdminVerifyEmailFormValues = {
    otp: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// AdminVerifyEmailForm — the second step of admin sign-up: the code emailed
// when the account was created. Checks it as soon as the last digit is in
// (Verify does the same), and can resend once the countdown runs out.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminVerifyEmailForm({
    email,
    onVerified,
}: {
    /** Where the code was sent. */
    email: string;
    onVerified: (user?: PublicUser) => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AdminVerifyEmailFormValues>({ defaultValues: { otp: "" } });
    const { field, fieldState } = useController({
        name: "otp",
        control: methods.control,
        rules: {
            required: "Enter the verification code",
            validate: (value: string) =>
                value.length === OTP_LENGTH || `Enter all ${OTP_LENGTH} digits`,
        },
    });
    const { secondsLeft, restart } = useCountdown(OTP_RESEND_SECONDS);
    const code = field.value ?? "";

    const handleResend = async () => {
        if (secondsLeft > 0) return;
        try {
            const res = await authService.resendVerification(email);
            restart();
            toast.success(res.message || `A new code was sent to ${email}`);
        } catch (error) {
            toast.error(
                error instanceof MandeApiError
                    ? error.message
                    : "Couldn't resend the code. Please try again."
            );
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const result = await authService.verifyEmail(email, code);
            toast.success("Email verified successfully!");
            onVerified(result.user);
        } catch (error) {
            methods.setValue("otp", "");
            toast.error(
                error instanceof MandeApiError && error.status === 429
                    ? "Too many tries. Please wait a few minutes, then try again."
                    : error instanceof MandeApiError && error.message
                      ? error.message
                      : "Couldn't verify the code. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<AdminVerifyEmailFormValues>
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
                    {fieldState.error && (
                        <span className="text-xs font-text text-error-500">
                            {fieldState.error.message}
                        </span>
                    )}
                    <p className="text-sm font-text text-mist-500">
                        Didn&apos;t receive the code?{" "}
                        {secondsLeft > 0 ? (
                            <span className="text-mist-400">
                                Resend in{" "}
                                <span className="font-medium text-secondary-700">
                                    0:{secondsLeft.toString().padStart(2, "0")}
                                </span>
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResend}
                                className="font-medium text-secondary-700 hover:underline cursor-pointer"
                            >
                                Resend code
                            </button>
                        )}
                    </p>
                </div>
            }
            renderFooter={({ isLoading }) => (
                <FormSubmitButton
                    label="Verify email"
                    loadingLabel="Verifying..."
                    isLoading={isLoading}
                    disabled={code.length !== OTP_LENGTH}
                    className="mt-5"
                />
            )}
        />
    );
}
