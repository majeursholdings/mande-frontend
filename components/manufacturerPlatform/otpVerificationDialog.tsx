"use client";

import type { ReactNode } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { maskEmail } from "@/lib/utils";
import type { TwoFactorMethod } from "@/constant/manufacturer";
import OtpVerificationForm from "@/components/manufacturerPlatform/form/otpVerificationForm";
import { useManufacturerProfile } from "./dashboardLayout/manufacturerProfileContext";

type OtpDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    /** Leads the description, before where to find the code. */
    intro?: ReactNode;
    channel: TwoFactorMethod;
    confirmLabel?: string;
    onVerified: (code: string) => void | Promise<void>;
    /** Sends a new emailed code; without it, "Resend" only says one was sent. */
    onResend?: () => void | Promise<void>;
};

/**
 * "Enter the code" dialog in front of a sensitive action, for the signed-in
 * manufacturer. `channel` says where the code comes from — emailed to them,
 * or their authenticator app (see getOtpChannel).
 */
export default function OtpVerificationDialog(props: OtpDialogProps) {
    const { profile } = useManufacturerProfile();
    return <OtpCodeDialog {...props} email={profile.email} />;
}

/** OtpVerificationDialog for any account — `email` is where an emailed code goes (e.g. an admin's). */
export function OtpCodeDialog({
    open,
    onOpenChange,
    title,
    intro,
    channel,
    confirmLabel,
    onVerified,
    onResend,
    email,
}: OtpDialogProps & { email: string }) {
    const sentTo = maskEmail(email);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-100">
                <div className="flex flex-col gap-1">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {intro && <>{intro} </>}
                        {channel === "app"
                            ? "Enter the 6-digit code from your authenticator app."
                            : <>Enter the 6-digit code we sent to <span className="font-medium text-mist-950">{sentTo}</span>.</>}
                    </DialogDescription>
                </div>
                <OtpVerificationForm
                    resendTo={channel === "email" ? sentTo : undefined}
                    confirmLabel={confirmLabel}
                    onVerified={onVerified}
                    onResend={onResend}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
