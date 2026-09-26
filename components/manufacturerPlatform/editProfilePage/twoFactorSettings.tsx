"use client";

import { useState } from "react";
import { Copy, Mail, QrCode, Smartphone, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn, maskEmail } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import OtpVerificationForm from "@/components/manufacturerPlatform/form/otpVerificationForm";
import type { TwoFactorMethod } from "@/constant/manufacturer";
import OtpVerificationDialog from "../otpVerificationDialog";
import { useManufacturerProfile } from "../dashboardLayout/manufacturerProfileContext";

// Sample secret until the API issues one per manufacturer (along with the
// QR code for its otpauth:// URI) when they start authenticator setup
const SAMPLE_AUTHENTICATOR_KEY = "JBSWY3DPEHPK3PXP";

const METHODS: {
    method: TwoFactorMethod;
    icon: LucideIcon;
    title: string;
    description: (email: string) => string;
}[] = [
    {
        method: "email",
        icon: Mail,
        title: "Email",
        description: (email) => `Get a code by email at ${maskEmail(email)}.`,
    },
    {
        method: "app",
        icon: Smartphone,
        title: "Authenticator app",
        description: () =>
            "Get a code from an app like Google Authenticator or Microsoft Authenticator.",
    },
];

type PendingChange =
    | { action: "enable"; method: TwoFactorMethod }
    | { action: "disable"; method: TwoFactorMethod }
    | null;

// ─────────────────────────────────────────────────────────────────────────────
// TwoFactorSettings — one method at a time, email or authenticator app.
// Turning a method on (or switching to it) verifies a code from it first;
// turning it off verifies a code from the current method.
// ─────────────────────────────────────────────────────────────────────────────

export default function TwoFactorSettings() {
    const { profile, updateSecurity } = useManufacturerProfile();
    const activeMethod = profile.security.twoFactorMethod;
    const [pending, setPending] = useState<PendingChange>(null);

    const closeDialog = (open: boolean) => {
        if (!open) setPending(null);
    };

    const applyMethod = (method: TwoFactorMethod | null) => {
        updateSecurity((security) => ({ ...security, twoFactorMethod: method }));
        setPending(null);
        toast.success(
            method ? "Two-factor authentication is on" : "Two-factor authentication is off",
        );
    };

    return (
        <>
            <ul className="flex flex-col gap-3">
                {METHODS.map(({ method, icon: Icon, title, description }) => {
                    const isActive = activeMethod === method;

                    return (
                        <li
                            key={method}
                            className={cn(
                                "flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5",
                                isActive ? "border-primary-300" : "border-border",
                            )}
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
                                <Icon className="size-5" strokeWidth={1.75} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-2 text-sm font-medium font-text text-mist-950">
                                    {title}
                                    {isActive && (
                                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                                            On
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs font-text text-mist-500">
                                    {description(profile.email)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setPending({ action: isActive ? "disable" : "enable", method })
                                }
                                className={cn(
                                    "h-9 shrink-0 rounded-button border px-4 text-sm font-medium font-text transition-colors duration-200 cursor-pointer",
                                    isActive
                                        ? "border-border text-mist-700 hover:bg-mist-50"
                                        : "border-secondary-700 text-secondary-700 hover:bg-secondary-50",
                                )}
                            >
                                {isActive ? "Turn off" : activeMethod ? "Switch" : "Set up"}
                            </button>
                        </li>
                    );
                })}
            </ul>

            <OtpVerificationDialog
                open={pending?.action === "enable" && pending.method === "email"}
                onOpenChange={closeDialog}
                title="Turn on email verification"
                intro="We'll ask for a code from your email when you log in and before sensitive actions."
                channel="email"
                confirmLabel="Turn on"
                onVerified={() => applyMethod("email")}
            />

            <AuthenticatorSetupDialog
                open={pending?.action === "enable" && pending.method === "app"}
                onOpenChange={closeDialog}
                onVerified={() => applyMethod("app")}
            />

            <OtpVerificationDialog
                open={pending?.action === "disable"}
                onOpenChange={closeDialog}
                title="Turn off two-factor authentication"
                intro="Your account will only be protected by your password."
                channel={pending?.method ?? activeMethod ?? "email"}
                confirmLabel="Turn off"
                onVerified={() => applyMethod(null)}
            />
        </>
    );
}

function AuthenticatorSetupDialog({
    open,
    onOpenChange,
    onVerified,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVerified: () => void;
}) {
    const groupedKey = SAMPLE_AUTHENTICATOR_KEY.match(/.{1,4}/g)?.join(" ") ?? "";

    const copyKey = async () => {
        try {
            await navigator.clipboard.writeText(SAMPLE_AUTHENTICATOR_KEY);
            toast.success("Setup key copied");
        } catch {
            toast.error("Couldn't copy the key. Please copy it manually.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-100">
                <div className="flex flex-col gap-1">
                    <DialogTitle>Set up authenticator app</DialogTitle>
                    <DialogDescription>
                        Use an app like Google Authenticator or Microsoft Authenticator.
                    </DialogDescription>
                </div>
                <OtpVerificationForm
                    confirmLabel="Turn on"
                    onVerified={onVerified}
                    onCancel={() => onOpenChange(false)}
                >
                    <ol className="flex flex-col gap-4 text-sm font-text text-mist-700">
                        <li className="flex flex-col gap-3">
                            <span>1. Scan this QR code with your authenticator app.</span>
                            {/* The API's QR code image goes here */}
                            <span className="mx-auto flex size-36 items-center justify-center rounded-lg border border-dashed border-mist-300 bg-mist-50">
                                <QrCode className="size-16 text-mist-400" strokeWidth={1.25} />
                            </span>
                            <span className="text-xs text-mist-500">
                                Can&apos;t scan it? Enter this key in the app instead:
                            </span>
                            <span className="flex items-center justify-between gap-3 rounded-lg bg-mist-50 px-3.5 py-2.5">
                                <code className="font-mono text-sm tracking-wider text-mist-950">
                                    {groupedKey}
                                </code>
                                <button
                                    type="button"
                                    onClick={copyKey}
                                    aria-label="Copy setup key"
                                    className="flex size-8 items-center justify-center rounded-md text-mist-600 hover:bg-mist-100 cursor-pointer"
                                >
                                    <Copy className="size-4" />
                                </button>
                            </span>
                        </li>
                        <li>2. Enter the 6-digit code the app shows.</li>
                    </ol>
                </OtpVerificationForm>
            </DialogContent>
        </Dialog>
    );
}
