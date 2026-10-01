"use client";

import { useController, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import OtpInput from "@/components/form/otpInput";
import { useCountdown } from "@/hooks/useCountdown";
import { getErrorMessage } from "@/lib/api";
import { authService } from "@/lib/services/authService";
import StepFooter from "../stepFooter";
import StepHeader from "../stepHeader";
import { RegistrationFormValues } from "../types";
import { OTP_LENGTH, OTP_RESEND_SECONDS } from "@/constant/global";

export type VerifyEmailStepProps = {
    methods: UseFormReturn<RegistrationFormValues>;
    email: string;
    onContinue: (values: RegistrationFormValues) => void;
    onBack: () => void;
    isLoading: boolean;
};

export default function VerifyEmailStep({
    methods,
    email,
    onContinue,
    onBack,
    isLoading,
}: VerifyEmailStepProps) {
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

    const handleResend = async () => {
        if (secondsLeft > 0) return;
        restart();
        try {
            await authService.resendVerification(email);
            toast.success(`A new verification code was sent to ${email}`);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't send a new code. Please try again."));
        }
    };

    const code = field.value ?? "";

    return (
        <div className="flex flex-col gap-6">
            <StepHeader
                step={2}
                title="Verify your email"
                description="Enter the code sent to your email address."
            />

            <MainForm<RegistrationFormValues>
                methods={methods}
                fields={[]}
                onSubmit={onContinue}
                isLoading={isLoading}
                footerSlot={
                    <div className="flex flex-col items-center gap-6 py-4">
                        <OtpInput
                            length={OTP_LENGTH}
                            value={code}
                            onChange={(value) => {
                                field.onChange(value);
                                // Moves on as soon as the last digit is in —
                                // no need to press Continue
                                if (value.length === OTP_LENGTH && !isLoading) {
                                    void methods.handleSubmit(onContinue)();
                                }
                            }}
                            disabled={isLoading}
                            error={!!fieldState.error}
                            name={field.name}
                        />
                        <div className="text-sm font-text text-center">
                            <span className="text-[#6B7280]">
                                Didn&apos;t receive code?{" "}
                            </span>
                            {secondsLeft > 0 ? (
                                <span className="block text-[#9CA3AF]">
                                    Resend in{" "}
                                    <span className="text-[#EF4444] font-medium">
                                        0:{secondsLeft.toString().padStart(2, "0")}
                                    </span>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="block w-full text-secondary-700 font-medium hover:underline cursor-pointer"
                                >
                                    Click to resend
                                </button>
                            )}
                        </div>
                    </div>
                }
                renderFooter={({ isLoading }) => (
                    <StepFooter
                        isLoading={isLoading}
                        canSubmit={code.length === OTP_LENGTH}
                        submitLabel="Continue"
                        onBack={onBack}
                    />
                )}
            />
        </div>
    );
}
