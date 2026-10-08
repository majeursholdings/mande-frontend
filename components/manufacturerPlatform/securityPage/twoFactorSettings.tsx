"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Copy, Mail, Smartphone, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn, maskEmail } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import OtpVerificationForm from "@/components/manufacturerPlatform/form/otpVerificationForm";
import ReauthSteps from "@/components/superAdminPlatform/reauthSteps";
import { authService } from "@/lib/services/authService";
import type { TwoFactorMethod } from "@/constant/manufacturer";
import { useManufacturerProfile } from "../dashboardLayout/manufacturerProfileContext";
import { QRCodeSVG } from "qrcode.react";

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

type SetupPhase = "reauth" | "verify";

/** The signed-in manufacturer's two-factor settings. */
export default function TwoFactorSettings() {
    const { profile, updateSecurity, isLoading } = useManufacturerProfile();
    return (
        <TwoFactorMethods
            loading={isLoading}
            email={profile.email}
            activeMethod={profile.security.twoFactorMethod}
            onChange={(method) => updateSecurity((security) => ({ ...security, twoFactorMethod: method }))}
        />
    );
}

/** TwoFactorSettings for any account (admin, super admin, manufacturer). */
export function TwoFactorMethods({
    email,
    activeMethod,
    onChange,
    loading = false,
}: {
    /** Where emailed codes go. */
    email: string;
    /** Null while two-factor authentication is off. */
    activeMethod: TwoFactorMethod | null;
    onChange: (method: TwoFactorMethod | null) => void;
    /** Skeletons in place of each method's state (and the email in it) while the account loads. */
    loading?: boolean;
}) {
    const [pending, setPending] = useState<PendingChange>(null);
    const [phase, setPhase] = useState<SetupPhase>("reauth");
    const [reauthToken, setReauthToken] = useState("");
    const [appSecret, setAppSecret] = useState("");
    const [otpauthUrl, setOtpauthUrl] = useState("");

    const closeDialog = (open: boolean) => {
        if (!open) {
            setPending(null);
            setPhase("reauth");
            setReauthToken("");
            setAppSecret("");
            setOtpauthUrl("");
        }
    };

    const applyMethod = (method: TwoFactorMethod | null) => {
        onChange(method);
        closeDialog(false);
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
                                    {!loading && isActive && (
                                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                                            On
                                        </span>
                                    )}
                                </p>
                                {loading ? (
                                    <Skeleton className="mt-1 h-3 w-48 max-w-full" />
                                ) : (
                                    <p className="text-xs font-text text-mist-500">
                                        {description(email)}
                                    </p>
                                )}
                            </div>
                            {loading ? (
                                <Skeleton className="h-9 w-20 shrink-0 rounded-button" />
                            ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setPhase("reauth");
                                    setPending({ action: isActive ? "disable" : "enable", method });
                                }}
                                className={cn(
                                    "h-9 shrink-0 rounded-button border px-4 text-sm font-medium font-text transition-colors duration-200 cursor-pointer",
                                    isActive
                                        ? "border-border text-mist-700 hover:bg-mist-50"
                                        : "border-secondary-700 text-secondary-700 hover:bg-secondary-50",
                                )}
                            >
                                {isActive ? "Turn off" : activeMethod ? "Switch" : "Set up"}
                            </button>
                            )}
                        </li>
                    );
                })}
            </ul>

            {/* Turn off 2FA Dialog */}
            <Dialog open={pending?.action === "disable"} onOpenChange={closeDialog}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Turn off two-factor authentication</DialogTitle>
                        <DialogDescription>
                            Confirm your password and verification code to disable two-factor authentication.
                        </DialogDescription>
                    </div>
                    <ReauthSteps
                        confirmLabel="Turn off"
                        action="change_2fa"
                        email={email}
                        twoFactorMethod={activeMethod}
                        onConfirmed={async (token) => {
                            try {
                                await authService.disable2FA(token);
                                applyMethod(null);
                            } catch (err) {
                                const message = err instanceof Error ? err.message : "Couldn't turn off two-factor authentication.";
                                toast.error(message);
                            }
                        }}
                        onCancel={() => closeDialog(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Turn on Email 2FA Dialog */}
            <Dialog
                open={pending?.action === "enable" && pending.method === "email"}
                onOpenChange={closeDialog}
            >
                <DialogContent showCloseButton={false} className="max-w-100">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Turn on email verification</DialogTitle>
                        <DialogDescription>
                            {phase === "reauth"
                                ? "Confirm your password and current authentication code first."
                                : `Enter the 6-digit code we sent to ${maskEmail(email)}.`}
                        </DialogDescription>
                    </div>

                    {phase === "reauth" ? (
                        <ReauthSteps
                            confirmLabel="Continue"
                            action="enable_2fa"
                            email={email}
                            twoFactorMethod={activeMethod}
                            onConfirmed={async (token) => {
                                setReauthToken(token);
                                try {
                                    await authService.sendEmailTwoFactorCode(token);
                                    toast.success(`Verification code sent to ${maskEmail(email)}`);
                                    setPhase("verify");
                                } catch {
                                    toast.error("Couldn't send the verification code. Please try again.");
                                }
                            }}
                            onCancel={() => closeDialog(false)}
                        />
                    ) : (
                        <OtpVerificationForm
                            resendTo={maskEmail(email)}
                            confirmLabel="Turn on"
                            onVerified={async (code) => {
                                try {
                                    await authService.enable2FA("email", code, reauthToken);
                                    applyMethod("email");
                                } catch (err) {
                                    const message = err instanceof Error ? err.message : "Couldn't verify the code. Please try again.";
                                    toast.error(message);
                                }
                            }}
                            onResend={async () => {
                                await authService.sendEmailTwoFactorCode(reauthToken);
                            }}
                            onCancel={() => closeDialog(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Turn on Authenticator App 2FA Dialog */}
            <Dialog
                open={pending?.action === "enable" && pending.method === "app"}
                onOpenChange={closeDialog}
            >
                <DialogContent showCloseButton={false} className="max-w-100">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Set up authenticator app</DialogTitle>
                        <DialogDescription>
                            {phase === "reauth"
                                ? "Confirm your password and current authentication code first."
                                : "Use an app like Google Authenticator or Microsoft Authenticator."}
                        </DialogDescription>
                    </div>

                    {phase === "reauth" ? (
                        <ReauthSteps
                            confirmLabel="Continue"
                            action="enable_2fa"
                            email={email}
                            twoFactorMethod={activeMethod}
                            onConfirmed={async (token) => {
                                setReauthToken(token);
                                try {
                                    const setup = await authService.setup2FAApp(token);
                                    setAppSecret(setup.secret);
                                    setOtpauthUrl(setup.otpauthUrl);
                                    setPhase("verify");
                                } catch {
                                    toast.error("Couldn't start authenticator setup. Please try again.");
                                }
                            }}
                            onCancel={() => closeDialog(false)}
                        />
                    ) : (
                        <AuthenticatorSetupBody
                            secret={appSecret}
                            otpauthUrl={otpauthUrl}
                            reauthToken={reauthToken}
                            onVerified={() => applyMethod("app")}
                            onCancel={() => closeDialog(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function AuthenticatorSetupBody({
    secret,
    otpauthUrl,
    reauthToken,
    onVerified,
    onCancel,
}: {
    secret: string;
    otpauthUrl: string;
    reauthToken: string;
    onVerified: () => void;
    onCancel: () => void;
}) {
    const groupedKey = secret.match(/.{1,4}/g)?.join(" ") ?? secret;

    const copyKey = async () => {
        try {
            await navigator.clipboard.writeText(secret);
            toast.success("Setup key copied");
        } catch {
            toast.error("Couldn't copy the key. Please copy it manually.");
        }
    };

    return (
        <OtpVerificationForm
            confirmLabel="Turn on"
            onVerified={async (code) => {
                try {
                    await authService.enable2FA("app", code, reauthToken);
                    onVerified();
                } catch (err) {
                    const message = err instanceof Error ? err.message : "That code isn't right. Check the app and try again.";
                    toast.error(message);
                }
            }}
            onCancel={onCancel}
        >
            <ol className="flex flex-col gap-4 text-sm font-text text-mist-700">
                <li className="flex flex-col gap-3">
                    <span>1. Scan this QR code or enter the key into your authenticator app.</span>
                    {otpauthUrl ? (
                        <div className="mx-auto flex size-40 items-center justify-center rounded-lg border border-mist-200 bg-white p-2 shadow-xs">
                            {/* Drawn here: the link holds their secret, so it never goes to another site */}
                            <QRCodeSVG value={otpauthUrl} size={144} title="Authenticator QR code" className="size-36" />
                        </div>
                    ) : null}
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
    );
}
