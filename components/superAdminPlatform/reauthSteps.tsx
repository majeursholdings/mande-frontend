"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { maskEmail } from "@/lib/utils";
import OtpVerificationForm from "@/components/manufacturerPlatform/form/otpVerificationForm";
import { useAdminProfile } from "@/components/adminPlatform/dashboardLayout/adminProfileContext";
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
    onConfirmed,
    onCancel,
}: {
    /** The code step's button, e.g. "Add keys". */
    confirmLabel: string;
    /** Runs once both check out — make the change. */
    onConfirmed: () => void | Promise<void>;
    onCancel: () => void;
}) {
    const { profile } = useAdminProfile();
    const [step, setStep] = useState<"password" | "code">("password");
    const usesApp = profile.security.twoFactorMethod === "app";
    const sentTo = maskEmail(profile.email);

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
                <PasswordConfirmForm onConfirmed={() => setStep("code")} onCancel={onCancel} />
            ) : (
                <OtpVerificationForm
                    resendTo={usesApp ? undefined : sentTo}
                    confirmLabel={confirmLabel}
                    onVerified={onConfirmed}
                    onCancel={onCancel}
                />
            )}
        </div>
    );
}
