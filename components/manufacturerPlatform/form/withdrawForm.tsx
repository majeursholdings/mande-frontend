"use client";

import { useForm, useWatch } from "react-hook-form";
import { Info, Landmark } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { formatBalance, formatPrice } from "@/lib/currency";
import { withdrawalFeeFor, type WithdrawalFee } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerWalletContext";
import type { ManufacturerBankAccount } from "@/constant/manufacturer";
import {
    WalletTile,
    bankAccountSubtitle,
} from "@/components/manufacturerPlatform/transactionsPage/walletTile";
import Notice from "@/components/manufacturerPlatform/notice";
import { FormSubmitButton } from "./formButtons";

/** The server's limits on one withdrawal, in naira (mande-backend src/constants/payments.ts). */
export const MIN_WITHDRAWAL = 100;
export const MAX_WITHDRAWAL = 5_000_000;

type WithdrawFormValues = {
    /** Whole naira, as a digit string — see MainForm's "amount" field. */
    amount: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// WithdrawForm — step one of a withdrawal: how much, to which account.
// Submitting doesn't move any money; it hands the amount on to the password
// confirmation step (ConfirmWithdrawalForm). Once the transfer fee has
// started (SHOP_IMPLEMENTATION.md 3.5), it shows the fee and what reaches
// the bank, before they confirm.
// ─────────────────────────────────────────────────────────────────────────────

export default function WithdrawForm({
    balance,
    bankAccount,
    defaultAmount,
    withdrawalFee,
    onContinue,
}: {
    balance: number;
    bankAccount: ManufacturerBankAccount;
    /** Refills the amount when coming back from the confirmation step. */
    defaultAmount?: number | null;
    withdrawalFee?: WithdrawalFee | null;
    onContinue: (amount: number) => void;
}) {
    // Validates as you type, so "Insufficient balance" shows straight away
    const methods = useForm<WithdrawFormValues>({
        mode: "onChange",
        defaultValues: { amount: defaultAmount ? String(defaultAmount) : "" },
    });
    const { isValid } = methods.formState;
    const amount = Number(useWatch({ control: methods.control, name: "amount" }) || 0);
    const feeKobo = withdrawalFeeFor(Math.round(amount * 100), withdrawalFee);
    const feeStarts = withdrawalFee?.startsAt && new Date(withdrawalFee.startsAt) > new Date() ? new Date(withdrawalFee.startsAt) : null;

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
                    atLeastMinimum: (value: string) =>
                        Number(value) >= MIN_WITHDRAWAL ||
                        `The smallest withdrawal is ${formatPrice(MIN_WITHDRAWAL)}`,
                    atMostMaximum: (value: string) =>
                        Number(value) <= MAX_WITHDRAWAL ||
                        `The largest single withdrawal is ${formatPrice(MAX_WITHDRAWAL)}`,
                    withinBalance: (value: string) =>
                        Number(value) <= balance || "Insufficient balance",
                    moreThanFee: (value: string) =>
                        Number(value) * 100 > withdrawalFeeFor(Number(value) * 100, withdrawalFee) ||
                        "Withdraw more than the transfer fee",
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
                        {feeKobo > 0 && amount > 0 ? (
                            <dl className="flex flex-col gap-1.5 rounded-xl bg-mist-50 px-4 py-3 text-sm font-text">
                                <div className="flex justify-between">
                                    <dt className="text-mist-600">You withdraw</dt>
                                    <dd className="text-mist-950">{formatPrice(amount)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-mist-600">Bank transfer fee</dt>
                                    <dd className="text-mist-950">-{formatPrice(feeKobo / 100)}</dd>
                                </div>
                                <div className="flex justify-between border-t border-border pt-1.5 font-medium">
                                    <dt className="text-mist-950">Reaches your bank</dt>
                                    <dd className="text-mist-950">{formatPrice(amount - feeKobo / 100)}</dd>
                                </div>
                            </dl>
                        ) : feeStarts ? (
                            <Notice>
                                From {feeStarts.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}, our payment
                                partner&apos;s transfer fee is taken from each withdrawal. It&apos;s free until then.
                            </Notice>
                        ) : feeKobo === 0 && !withdrawalFee?.startsAt ? (
                            <Notice>
                                MANDE doesn&apos;t charge a fee to withdraw. We cover our payment
                                partner&apos;s transfer fee.
                            </Notice>
                        ) : (
                            <Notice>Our payment partner&apos;s transfer fee is taken from the amount you withdraw. You&apos;ll see it here.</Notice>
                        )}
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
