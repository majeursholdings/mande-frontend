"use client";

import { useState } from "react";
import { ArrowRightLeft, Landmark } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import AddBankAccountForm from "@/components/manufacturerPlatform/form/addBankAccountForm";
import WithdrawForm from "@/components/manufacturerPlatform/form/withdrawForm";
import ConfirmWithdrawalForm from "@/components/manufacturerPlatform/form/confirmWithdrawalForm";
import { formatPrice } from "@/lib/currency";
import { getOtpChannel } from "@/constant/manufacturer";
import OtpVerificationDialog from "../otpVerificationDialog";
import { useManufacturerProfile } from "../dashboardLayout/manufacturerProfileContext";
import { useManufacturerWallet } from "../dashboardLayout/manufacturerWalletContext";
import BankAccountDetails from "./bankAccountDetails";
import DeleteBankAccountConfirm from "./deleteBankAccountConfirm";
import { WalletActionCard, bankAccountSubtitle } from "./walletTile";

type WalletDialog =
    | "add-bank"
    | "bank-details"
    | "delete-bank"
    | "withdraw"
    | "confirm-withdrawal"
    | "withdrawal-otp";

// ─────────────────────────────────────────────────────────────────────────────
// WalletActions — the profile's bank account and withdraw cards, and the
// dialogs they lead to:
//   add bank account  →  (the card then shows it)  →  details  →  delete
//   withdraw amount → password → one-time code → balance + transactions update
// One dialog is open at a time; moving to the next step swaps which one.
// ─────────────────────────────────────────────────────────────────────────────

export default function WalletActions() {
    const { profile } = useManufacturerProfile();
    const { wallet, withdraw } = useManufacturerWallet();
    const { balance, bankAccount } = wallet;
    const [dialog, setDialog] = useState<WalletDialog | null>(null);
    // Carried between the withdraw and confirm steps, so Cancel on the
    // confirm step goes back to the amount that was entered
    const [withdrawalAmount, setWithdrawalAmount] = useState<number | null>(null);

    const close = () => setDialog(null);
    const dialogProps = (kind: WalletDialog) => ({
        open: dialog === kind,
        onOpenChange: (open: boolean) => {
            if (!open) close();
        },
    });

    return (
        <>
            <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
                {bankAccount ? (
                    <WalletActionCard
                        size="sm"
                        icon={Landmark}
                        title={bankAccount.bankName}
                        subtitle={bankAccountSubtitle(bankAccount)}
                        onClick={() => setDialog("bank-details")}
                    />
                ) : (
                    <WalletActionCard
                        size="sm"
                        icon={Landmark}
                        title="Add your bank account"
                        onClick={() => setDialog("add-bank")}
                    />
                )}
                <WalletActionCard
                    size="sm"
                    icon={ArrowRightLeft}
                    title="Withdraw to your bank"
                    subtitle={bankAccount ? undefined : "Add a bank account first"}
                    disabled={!bankAccount}
                    onClick={() => {
                        setWithdrawalAmount(null);
                        setDialog("withdraw");
                    }}
                />
            </div>

            <Dialog {...dialogProps("add-bank")}>
                <DialogContent>
                    <DialogTitle>Add your bank account</DialogTitle>
                    <AddBankAccountForm onAdded={close} />
                </DialogContent>
            </Dialog>

            {/* Rendered even without an account, so it can close normally
                after the account it confirmed deleting is gone */}
            <Dialog {...dialogProps("delete-bank")}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Delete bank account?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this bank account?
                        </DialogDescription>
                    </div>
                    <DeleteBankAccountConfirm
                        onCancel={() => setDialog("bank-details")}
                        onDeleted={close}
                    />
                </DialogContent>
            </Dialog>

            {bankAccount && (
                <>
                    <Dialog {...dialogProps("bank-details")}>
                        <DialogContent>
                            <DialogTitle>Bank Account Details</DialogTitle>
                            <BankAccountDetails
                                bankAccount={bankAccount}
                                onDelete={() => setDialog("delete-bank")}
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog {...dialogProps("withdraw")}>
                        <DialogContent>
                            <DialogTitle>Withdraw to your bank</DialogTitle>
                            <WithdrawForm
                                balance={balance}
                                bankAccount={bankAccount}
                                defaultAmount={withdrawalAmount}
                                onContinue={(amount) => {
                                    setWithdrawalAmount(amount);
                                    setDialog("confirm-withdrawal");
                                }}
                            />
                        </DialogContent>
                    </Dialog>

                    <Dialog {...dialogProps("confirm-withdrawal")}>
                        <DialogContent showCloseButton={false} className="max-w-100">
                            <div className="flex flex-col gap-1">
                                <DialogTitle>Confirm transaction</DialogTitle>
                                <DialogDescription>
                                    You are about to withdraw{" "}
                                    <span className="font-medium text-mist-950">
                                        {formatPrice(withdrawalAmount ?? 0)}
                                    </span>{" "}
                                    from your balance, plus processing and bank charges. Enter
                                    your password to confirm this transaction.
                                </DialogDescription>
                            </div>
                            <ConfirmWithdrawalForm
                                onCancel={() => setDialog("withdraw")}
                                onPasswordConfirmed={() => setDialog("withdrawal-otp")}
                            />
                        </DialogContent>
                    </Dialog>

                    <OtpVerificationDialog
                        {...dialogProps("withdrawal-otp")}
                        title="Verify withdrawal"
                        intro={`One last step before ${formatPrice(withdrawalAmount ?? 0)} is sent to your bank.`}
                        channel={getOtpChannel(profile)}
                        confirmLabel="Withdraw"
                        onVerified={() => {
                            withdraw(withdrawalAmount ?? 0);
                            toast.success("Withdrawal processed successfully");
                            close();
                        }}
                    />
                </>
            )}
        </>
    );
}
