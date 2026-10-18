"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig, SelectOption } from "@/components/form/types";
import Notice from "@/components/manufacturerPlatform/notice";
import { BANK_ACCOUNT_NUMBER_LENGTH, getOptionLabel } from "@/constant/manufacturer";
import { myShopService } from "@/lib/services/shopService";
import { FormSubmitButton } from "./formButtons";

// ─────────────────────────────────────────────────────────────────────────────
// PayoutAccountForm: the bank account a manufacturer's share of each shop
// sale is paid to. Like the wallet's bank account form, the account name
// isn't typed: it's looked up from the number and bank as soon as both are
// complete. Banks and the lookup are Paystack's (the payout account is a
// Paystack subaccount). Continue hands the details to the parent, which
// confirms it's them (password, then a code) before connecting it.
// ─────────────────────────────────────────────────────────────────────────────

type PayoutAccountValues = { accountNumber: string; bankCode: string; accountName: string };

export type PayoutAccountDetails = { bankCode: string; bankName: string; accountNumber: string; accountName: string };

const ACCOUNT_NUMBER_PATTERN = new RegExp(`^\\d{${BANK_ACCOUNT_NUMBER_LENGTH}}$`);

// Cached so every call returns the same promise (the bank field suspends on
// it), and cleared on failure so opening the form again retries
let banksRequest: Promise<SelectOption[]> | null = null;

function loadPayoutBanks(): Promise<SelectOption[]> {
    banksRequest ??= (async () => {
        try {
            const banks = await myShopService.listBanks();
            if (banks.length === 0) throw new Error("No banks");
            return banks.map((bank) => ({ value: bank.code, label: bank.name }));
        } catch {
            banksRequest = null;
            toast.error("Couldn't load the list of banks. Close this and try again.");
            return [];
        }
    })();
    return banksRequest;
}

export default function PayoutAccountForm({ onContinue }: { onContinue: (details: PayoutAccountDetails) => void }) {
    const [isVerifying, setIsVerifying] = useState(false);
    // Bumped on every lookup, so a slow answer for old details can't overwrite the current name
    const latestLookup = useRef(0);
    const methods = useForm<PayoutAccountValues>({ mode: "onTouched", defaultValues: { accountNumber: "", bankCode: "", accountName: "" } });

    const verifyAccount = async () => {
        const lookup = ++latestLookup.current;
        const { bankCode } = methods.getValues();
        const accountNumber = methods.getValues("accountNumber").replace(/\D/g, "");
        if (accountNumber !== methods.getValues("accountNumber")) methods.setValue("accountNumber", accountNumber, { shouldValidate: true });
        methods.setValue("accountName", "");
        methods.clearErrors("accountName");
        if (!ACCOUNT_NUMBER_PATTERN.test(accountNumber) || !bankCode) {
            setIsVerifying(false);
            return;
        }
        setIsVerifying(true);
        try {
            const { accountName } = await myShopService.lookupPayoutAccount(bankCode, accountNumber);
            if (lookup !== latestLookup.current) return;
            methods.setValue("accountName", accountName, { shouldValidate: true });
        } catch {
            if (lookup !== latestLookup.current) return;
            methods.setError("accountNumber", { message: "We couldn't verify this account. Check the account number and bank." });
        } finally {
            if (lookup === latestLookup.current) setIsVerifying(false);
        }
    };

    const fields: FormFieldConfig[] = [
        {
            name: "accountNumber",
            type: "text",
            label: "Account number",
            placeholder: "Enter account number",
            inputMode: "numeric",
            maxLength: BANK_ACCOUNT_NUMBER_LENGTH,
            autoComplete: "off",
            validation: {
                required: "Account number is required",
                pattern: { value: ACCOUNT_NUMBER_PATTERN, message: `Account number must be ${BANK_ACCOUNT_NUMBER_LENGTH} digits` },
                onChange: verifyAccount,
            },
        },
        {
            name: "bankCode",
            type: "combobox",
            label: "Bank name",
            placeholder: "Search for your bank",
            loadOptions: loadPayoutBanks,
            emptyMessage: "No bank matches your search",
            validation: { required: "Please select your bank", onChange: verifyAccount },
        },
        {
            name: "accountName",
            type: "text",
            label: "Account name",
            placeholder: isVerifying ? "Verifying account..." : "Filled in once your account is verified",
            readOnly: true,
            validation: { required: "Enter your account number and bank to verify the account name" },
        },
    ];

    const handleSubmit = async (values: PayoutAccountValues) => {
        try {
            const banks = await loadPayoutBanks();
            onContinue({ ...values, bankName: getOptionLabel(banks, values.bankCode) });
        } catch {
            toast.error("Something went wrong. Please try again.");
        }
    };

    return (
        <MainForm<PayoutAccountValues>
            methods={methods}
            fields={fields}
            onSubmit={handleSubmit}
            footerSlot={(values) =>
                values.accountName ? (
                    <Notice>This is the name your bank has for this account. If it isn&apos;t right, check the account number and the bank.</Notice>
                ) : null
            }
            renderFooter={({ isLoading, canSubmit }) => (
                <FormSubmitButton label="Continue" isLoading={isLoading} disabled={!canSubmit || isVerifying} className="mt-3 w-full" />
            )}
        />
    );
}
