"use client";

import { useForm } from "react-hook-form";
import { Info, Landmark } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { formatBalance } from "@/lib/currency";
import type { ManufacturerBankAccount } from "@/constant/manufacturer";
import {
    WalletTile,
    bankAccountSubtitle,
} from "@/components/manufacturerPlatform/profilePage/walletTile";
import Notice from "@/components/manufacturerPlatform/notice";
import { FormSubmitButton } from "./formButtons";

type WithdrawFormValues = {
    /** Whole naira, as a digit string — see MainForm's "amount" field. */
    amount: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// WithdrawForm — step one of a withdrawal: how much, to which account.
// Submitting doesn't move any money; it hands the amount on to the password
// confirmation step (ConfirmWithdrawalForm).
// ─────────────────────────────────────────────────────────────────────────────

export default function WithdrawForm({
    balance,
    bankAccount,
    defaultAmount,
    onContinue,
}: {
    balance: number;
    bankAccount: ManufacturerBankAccount;
    /** Refills the amount when coming back from the confirmation step. */
    defaultAmount?: number | null;
    onContinue: (amount: number) => void;
}) {
    // Validates as you type, so "Insufficient balance" shows straight away
    const methods = useForm<WithdrawFormValues>({
        mode: "onChange",
        defaultValues: { amount: defaultAmount ? String(defaultAmount) : "" },
    });
    const { isValid } = methods.formState;

    const fields: FormFieldConfig[] = [
        {
            name: "amount",
            type: "amount",
            label: "Withdrawal amount",
            placeholder: "Enter amount",
            validation: {
                required: "Enter an amount to withdraw",
                validate: {
                    positive: (value: string) =>
                        Number(value) > 0 || "Enter an amount to withdraw",
                    withinBalance: (value: string) =>
                        Number(value) <= balance || "Insufficient balance",
                },
            },
        },
    ];

    const handleSubmit = ({ amount }: WithdrawFormValues) => {
        try {
            onContinue(Number(amount));
        } catch {
            toast.error("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm font-text text-mist-500">Available balance</p>
                <p className="text-3xl font-semibold font-text text-secondary-600">
                    {formatBalance(balance)}
                </p>
            </div>

            <MainForm<WithdrawFormValues>
                methods={methods}
                fields={fields}
                onSubmit={handleSubmit}
                footerSlot={
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <h3 className="text-xs font-semibold font-text uppercase tracking-wide text-mist-700">
                                Withdraw to:
                            </h3>
                            <div className="rounded-xl border border-border px-4 py-4 sm:px-5">
                                <WalletTile
                                    icon={Landmark}
                                    title={bankAccount.bankName}
                                    subtitle={bankAccountSubtitle(bankAccount)}
                                />
                            </div>
                            <p className="flex items-center gap-1.5 text-xs font-text text-mist-500">
                                <Info className="size-3.5 shrink-0" />
                                Transfers may take a few minutes and vary by bank
                            </p>
                        </div>
                        <Notice tone="warning">
                            Bank charges and our processing partner&apos;s fee will be added to
                            this withdrawal. How much depends on the processing partner and your
                            bank.
                        </Notice>
                    </div>
                }
                renderFooter={({ isLoading, canSubmit }) => (
                    <FormSubmitButton
                        label="Withdraw"
                        isLoading={isLoading}
                        disabled={!canSubmit || !isValid}
                        className="mt-3 w-full"
                    />
                )}
            />
        </div>
    );
}
