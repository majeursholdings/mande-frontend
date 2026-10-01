"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { maskEmail } from "@/lib/utils";
import { authService } from "@/lib/services/authService";
import OtpVerificationForm from "@/components/manufacturerPlatform/form/otpVerificationForm";
import { useOptionalAdminProfile } from "@/components/adminPlatform/dashboardLayout/adminProfileContext";
import PasswordConfirmForm from "./form/passwordConfirmForm";

// ─────────────────────────────────────────────────────────────────────────────
// ReauthSteps — "confirm it's you" before a sensitive change (inviting a
// super admin, changing their role, adding or removing a platform's API
// keys): their password,
// then a one-time code from their authenticator app, or emailed to them when
// they don't use one. Goes inside the dialog the change was made in, under
// its title.
// ─────────────────────────────────────────────────────────────────────────────

export default function ReauthSteps({
    confirmLabel,
    action,
    email: emailProp,
    twoFactorMethod: twoFactorMethodProp,
    onConfirmed,
    onCancel,
}: {
    /** The code step's button, e.g. "Add keys". */
    confirmLabel: string;
    /** Optional specific action identifier (e.g. "add_super_admin") */
    action?: string;
    /** Optional email override when used outside admin context */
    email?: string;
    /** Optional two-factor method override */
    twoFactorMethod?: "email" | "app" | null;
    /** Runs once both check out — make the change with X-Reauth-Token. */
    onConfirmed: (reauthToken: string) => void | Promise<void>;
    onCancel: () => void;
}) {
    const adminContext = useOptionalAdminProfile();
    const effectiveEmail = emailProp ?? adminContext?.profile.email ?? "";
    const effectiveMethod =
        twoFactorMethodProp !== undefined
            ? twoFactorMethodProp
            : (adminContext?.profile.security.twoFactorMethod ?? null);
    const [step, setStep] = useState<"password" | "code">("password");
    const [password, setPassword] = useState("");
    const usesApp = effectiveMethod === "app";
    const sentTo = maskEmail(effectiveEmail);
    const targetAction =
        action ??
        (confirmLabel.toLowerCase().includes("super admin") || confirmLabel.toLowerCase().includes("invite")
            ? "add_super_admin"
            : undefined);

    const handlePasswordConfirmed = async (enteredPassword: string) => {
        setPassword(enteredPassword);
        if (!usesApp) {
            try {
                await authService.sendReauthCode(targetAction);
                toast.success(`Verification code sent to ${sentTo}`);
            } catch {
                toast.error("Couldn't send the verification code. Please try again.");
            }
        }
        setStep("code");
    };

    const handleCodeVerified = async (code: string) => {
        const { reauthToken } = await authService.verifyReauth(password, code);
        await onConfirmed(reauthToken);
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex gap-3 rounded-lg bg-mist-50 px-4 py-3">
                {step === "password" ? (
                    <KeyRound className="mt-0.5 size-4 shrink-0 text-mist-500" strokeWidth={1.75} aria-hidden />
                ) : (
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mist-500" strokeWidth={1.75} aria-hidden />
                )}
                <p className="text-sm font-text text-mist-700">
                    <span className="font-medium text-mist-950">
                        Confirm it&apos;s you, step {step === "password" ? 1 : 2} of 2.
                    </span>{" "}
                    {step === "password" ? (
                        "Enter the password you log in with."
                    ) : usesApp ? (
                        "Enter the 6-digit code from your authenticator app."
                    ) : (
                        <>
                            Enter the 6-digit code we sent to <span className="font-medium text-mist-950">{sentTo}</span>.
                        </>
                    )}
                </p>
            </div>

            {step === "password" ? (
                <PasswordConfirmForm onConfirmed={handlePasswordConfirmed} onCancel={onCancel} />
            ) : (
                <OtpVerificationForm
                    resendTo={usesApp ? undefined : sentTo}
                    confirmLabel={confirmLabel}
                    onVerified={handleCodeVerified}
                    onResend={async () => {
                        await authService.sendReauthCode(targetAction);
                    }}
                    onCancel={onCancel}
                />
            )}
        </div>
    );
}
