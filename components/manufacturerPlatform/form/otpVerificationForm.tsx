"use client";

import { useState, type ReactNode } from "react";
import { useController, useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import OtpInput from "@/components/manufacturerPlatform/otpInput";
import { useCountdown } from "@/components/manufacturerPlatform/useCountdown";
import { OTP_LENGTH, OTP_RESEND_SECONDS } from "@/constant/manufacturer";
import { FormCancelButton, FormSubmitButton } from "./formButtons";

type OtpFormValues = {
    otp: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// OtpVerificationForm — a one-time code entry that gates a sensitive action
// (changing the password, withdrawing, turning two-factor authentication on
// or off). Built like the registration VerifyEmailStep: a MainForm with the
// OTP boxes in its footer slot.
// ─────────────────────────────────────────────────────────────────────────────

export default function OtpVerificationForm({
    resendTo,
    confirmLabel = "Verify",
    onVerified,
    onCancel,
    children,
}: {
    /** Where the code was sent (e.g. a masked email) — shows the resend link. Omit for authenticator codes. */
    resendTo?: string;
    confirmLabel?: string;
    /** Runs once the code checks out — perform the action it was guarding. */
    onVerified: (code: string) => void | Promise<void>;
    onCancel: () => void;
    /** Shown above the code boxes, e.g. authenticator setup steps. */
    children?: ReactNode;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<OtpFormValues>({ defaultValues: { otp: "" } });
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

    const handleResend = () => {
        if (secondsLeft > 0) return;
        restart();
        toast.success(`A new code was sent to ${resendTo}`);
    };

    const handleSubmit = async ({ otp }: OtpFormValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate checking the code (any
            // complete code passes) so the flow is testable end-to-end.
            await new Promise((resolve) => setTimeout(resolve, 800));
            await onVerified(otp);
        } catch {
            toast.error("Couldn't verify the code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<OtpFormValues>
            methods={methods}
            fields={[]}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            footerSlot={
                <div className="flex flex-col gap-5">
                    {children}
                    <div className="flex flex-col items-center gap-3">
                        <OtpInput
                            length={OTP_LENGTH}
                            value={code}
                            onChange={field.onChange}
                            error={!!fieldState.error}
                            name={field.name}
                        />
                        {fieldState.error && (
                            <span className="text-xs font-text text-error-500">
                                {fieldState.error.message}
                            </span>
                        )}
                        {resendTo && (
                            <p className="text-sm font-text text-mist-500">
                                Didn&apos;t get it?{" "}
                                {secondsLeft > 0 ? (
                                    <span className="text-mist-400">
                                        Resend in 0:{secondsLeft.toString().padStart(2, "0")}
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
                        )}
                    </div>
                </div>
            }
            renderFooter={({ isLoading }) => (
                <div className="flex justify-end gap-3 pt-1">
                    <FormCancelButton onClick={onCancel} disabled={isLoading} />
                    <FormSubmitButton
                        label={confirmLabel}
                        loadingLabel="Verifying..."
                        isLoading={isLoading}
                        disabled={code.length !== OTP_LENGTH}
                    />
                </div>
            )}
        />
    );
}
