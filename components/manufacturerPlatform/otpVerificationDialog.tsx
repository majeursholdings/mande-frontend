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

/**
 * "Enter the code" dialog in front of a sensitive action. `channel` says where
 * the code comes from — emailed to the manufacturer, or their authenticator
 * app (see getOtpChannel).
 */
export default function OtpVerificationDialog({
    open,
    onOpenChange,
    title,
    intro,
    channel,
    confirmLabel,
    onVerified,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    /** Leads the description, before where to find the code. */
    intro?: ReactNode;
    channel: TwoFactorMethod;
    confirmLabel?: string;
    onVerified: (code: string) => void | Promise<void>;
}) {
    const { profile } = useManufacturerProfile();
    const sentTo = maskEmail(profile.email);

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
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
