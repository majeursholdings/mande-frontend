"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Landmark } from "lucide-react";
import dayjs from "dayjs";
import ConfirmWithdrawalForm from "@/components/manufacturerPlatform/form/confirmWithdrawalForm";
import PayoutAccountForm, { type PayoutAccountDetails } from "@/components/manufacturerPlatform/form/payoutAccountForm";
import OtpVerificationDialog from "@/components/manufacturerPlatform/otpVerificationDialog";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import Notice from "@/components/manufacturerPlatform/notice";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getOtpChannel } from "@/constant/manufacturer";
import { getErrorMessage } from "@/lib/api";
import { authService } from "@/lib/services/authService";
import { myShopService, type PayoutAccount } from "@/lib/services/shopService";

/** What the emailed code's message says it's for. */
const REAUTH_ACTION = "a change to your shop payout account";

type PayoutDialog = "account" | "password" | "otp";

// ─────────────────────────────────────────────────────────────────────────────
// PayoutsTab: the bank account a manufacturer's share of each shop sale is
// paid to. Paystack pays it straight to the bank, usually the next business
// day: it never goes through their MANDE wallet. Connecting or changing it:
//   bank details (checked with the bank) → password → one-time code
// ─────────────────────────────────────────────────────────────────────────────

export default function PayoutsTab({
    payout,
    accessRevoked,
    isLoading,
    onChanged,
}: {
    payout: PayoutAccount | null | undefined;
    accessRevoked: boolean;
    isLoading: boolean;
    onChanged: () => Promise<unknown>;
}) {
    const { profile } = useManufacturerProfile();
    const otpChannel = getOtpChannel(profile);
    const [dialog, setDialog] = useState<PayoutDialog | null>(null);
    const [details, setDetails] = useState<PayoutAccountDetails | null>(null);
    const [password, setPassword] = useState("");

    const close = () => setDialog(null);
    const dialogProps = (kind: PayoutDialog) => ({ open: dialog === kind, onOpenChange: (open: boolean) => !open && close() });

    return (
        <section className="flex flex-col gap-5 rounded-xl border border-border bg-white p-5 lg:p-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold font-text text-mist-950">Payouts</h2>
                <p className="max-w-2xl text-sm font-text text-mist-500">
                    Customers pay through Paystack, which pays you for each sale (the price and delivery, less the platform charge) straight to
                    this bank account, usually the next business day. It doesn&apos;t go through your MANDE wallet.
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center gap-3 rounded-lg border border-border p-4" aria-hidden>
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                    </div>
                </div>
            ) : payout ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-full bg-mist-100 text-primary-700">
                            <Landmark className="size-5" aria-hidden />
                        </span>
                        <span className="flex flex-col">
                            <span className="text-sm font-medium font-text text-mist-950">
                                {payout.bankName} ending {payout.accountNumberLast4}
                            </span>
                            <span className="text-xs font-text text-mist-500">
                                {payout.accountName}, connected {dayjs(payout.connectedAt).format("D MMM YYYY")}
                                {payout.mode === "test" ? " (test mode)" : ""}
                            </span>
                        </span>
                    </div>
                    <Button
                        type="button"
                        onClick={() => setDialog("account")}
                        disabled={accessRevoked}
                        className="h-10 px-4 bg-mist-100 hover:bg-mist-200 text-mist-950 text-sm font-medium font-text rounded-button cursor-pointer"
                    >
                        Change account
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border p-5">
                    <p className="text-sm font-text text-mist-700">You haven&apos;t connected a payout account yet. You need one to list products.</p>
                    <Button
                        type="button"
                        onClick={() => setDialog("account")}
                        disabled={accessRevoked}
                        className="h-10 px-4 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer"
                    >
                        Connect a bank account
                    </Button>
                </div>
            )}

            {accessRevoked && <Notice tone="warning">Your shop access is paused, so the payout account can&apos;t be changed.</Notice>}

            <Dialog {...dialogProps("account")}>
                <DialogContent>
                    <div className="flex flex-col gap-1">
                        <DialogTitle>{payout ? "Change payout account" : "Connect a payout account"}</DialogTitle>
                        <DialogDescription>Only naira accounts in your or your business&apos;s name.</DialogDescription>
                    </div>
                    {dialog === "account" && (
                        <PayoutAccountForm
                            onContinue={(next) => {
                                setDetails(next);
                                setDialog("password");
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog {...dialogProps("password")}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Confirm it&apos;s you</DialogTitle>
                        <DialogDescription>
                            Your shop sales will be paid to{" "}
                            <span className="font-medium text-mist-950">
                                {details?.bankName} ({details?.accountName})
                            </span>
                            . Enter your password, then a one-time code, to confirm.
                        </DialogDescription>
                    </div>
                    <ConfirmWithdrawalForm
                        onCancel={() => setDialog("account")}
                        onPasswordEntered={(entered) => {
                            setPassword(entered);
                            setDialog("otp");
                            // Authenticator-app users read their code from the app: nothing to send
                            if (otpChannel === "email") {
                                authService.sendReauthCode(REAUTH_ACTION).catch((err: unknown) => {
                                    toast.error(getErrorMessage(err, "Couldn't send your code. Use Resend to try again."));
                                });
                            }
                        }}
                    />
                </DialogContent>
            </Dialog>

            <OtpVerificationDialog
                {...dialogProps("otp")}
                title="Verify payout account"
                intro="One last step before your shop payouts go to this account."
                channel={otpChannel}
                confirmLabel={payout ? "Change account" : "Connect account"}
                onResend={
                    otpChannel === "email"
                        ? async () => {
                              await authService.sendReauthCode(REAUTH_ACTION);
                          }
                        : undefined
                }
                onVerified={async (code: string) => {
                    if (!details) return;
                    try {
                        const { reauthToken } = await authService.verifyReauth(password, code);
                        await myShopService.connectPayoutAccount({ bankCode: details.bankCode, accountNumber: details.accountNumber }, reauthToken);
                        await onChanged();
                        toast.success("Payout account connected");
                        setPassword("");
                        close();
                    } catch (err) {
                        toast.error(getErrorMessage(err, "Couldn't connect the payout account. Please try again."));
                    }
                }}
            />
        </section>
    );
}
