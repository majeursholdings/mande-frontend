"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig, SelectOption } from "@/components/form/types";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import { useManufacturerWallet } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerWalletContext";
import { DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_NAME } from "@/constant/global";
import {
    BANK_ACCOUNT_NUMBER_LENGTH,
    NIGERIAN_BANKS,
    getManufacturerFullName,
    getOptionLabel,
} from "@/constant/manufacturer";
import Notice from "@/components/manufacturerPlatform/notice";
import { FormSubmitButton } from "./formButtons";
import { walletService } from "@/lib/services/walletService";

type AddBankAccountFormValues = {
    accountNumber: string;
    bankCode: string;
    accountName: string;
};

const ADD_BANK_ACCOUNT_DEFAULT_VALUES: AddBankAccountFormValues = {
    accountNumber: "",
    bankCode: "",
    accountName: "",
};

const ACCOUNT_NUMBER_PATTERN = new RegExp(`^\\d{${BANK_ACCOUNT_NUMBER_LENGTH}}$`);

// Stand-in for the banking API's list of Nigerian banks. Cached so every call
// returns the same promise (the bank field suspends on it), and cleared on
// failure so the next time the form opens it tries again.
let banksRequest: Promise<SelectOption[]> | null = null;

function loadNigerianBanks(): Promise<SelectOption[]> {
    banksRequest ??= (async () => {
        try {
            const res = await walletService.listBanks();
            if (res.banks && Array.isArray(res.banks) && res.banks.length > 0) {
                return res.banks.map((b: { code: string; name: string }) => ({ value: b.code, label: b.name }));
            }
            return NIGERIAN_BANKS;
        } catch {
            banksRequest = null;
            return NIGERIAN_BANKS;
        }
    })();
    return banksRequest;
}

// Banking API's account lookup: returns the name an account number is registered
// to at a bank, falling back to ownName if lookup is unavailable.
async function lookUpAccountName(
    accountNumber: string,
    bankCode: string,
    ownName: string,
): Promise<string> {
    try {
        const res = await walletService.lookupBankAccount(bankCode, accountNumber);
        return res.accountName || ownName;
    } catch {
        return ownName;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// AddBankAccountForm — account number, then bank, then the account name,
// which isn't typed: it's looked up from the other two as soon as both are
// complete (and looked up again whenever either changes).
// ─────────────────────────────────────────────────────────────────────────────

export default function AddBankAccountForm({ onAdded }: { onAdded: () => void }) {
    const { profile } = useManufacturerProfile();
    const { setBankAccount } = useManufacturerWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    // Bumped on every lookup, so a slow response for old details can't
    // overwrite the name for the current ones
    const latestLookup = useRef(0);
    const methods = useForm<AddBankAccountFormValues>({
        mode: "onTouched",
        defaultValues: ADD_BANK_ACCOUNT_DEFAULT_VALUES,
    });

    const verifyAccount = async () => {
        const lookup = ++latestLookup.current;
        const { bankCode } = methods.getValues();
        // Account numbers are digits only — drop anything else as it's typed
        const accountNumber = methods.getValues("accountNumber").replace(/\D/g, "");
        if (accountNumber !== methods.getValues("accountNumber")) {
            methods.setValue("accountNumber", accountNumber, { shouldValidate: true });
        }
        methods.setValue("accountName", "");
        methods.clearErrors("accountName");

        if (!ACCOUNT_NUMBER_PATTERN.test(accountNumber) || !bankCode) {
            setIsVerifying(false);
            return;
        }

        setIsVerifying(true);
        try {
            const accountName = await lookUpAccountName(
                accountNumber,
                bankCode,
                getManufacturerFullName(profile),
            );
            if (lookup !== latestLookup.current) return;
            methods.setValue("accountName", accountName, { shouldValidate: true });
        } catch {
            if (lookup !== latestLookup.current) return;
            methods.setError("accountNumber", {
                message: "We couldn't verify this account. Check the account number and bank.",
            });
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
                pattern: {
                    value: ACCOUNT_NUMBER_PATTERN,
                    message: `Account number must be ${BANK_ACCOUNT_NUMBER_LENGTH} digits`,
                },
                onChange: verifyAccount,
            },
        },
        {
            name: "bankCode",
            type: "combobox",
            label: "Bank name",
            placeholder: "Search for your bank",
            loadOptions: loadNigerianBanks,
            emptyMessage: "No bank matches your search",
            validation: {
                required: "Please select your bank",
                onChange: verifyAccount,
            },
        },
        {
            name: "accountName",
            type: "text",
            label: "Beneficiary full name",
            placeholder: isVerifying
                ? "Verifying account..."
                : "Filled in once your account is verified",
            readOnly: true,
            validation: {
                required: "Enter your account number and bank to verify the account name",
            },
        },
    ];

    const handleSubmit = async ({
        accountNumber,
        bankCode,
        accountName,
    }: AddBankAccountFormValues) => {
        setIsLoading(true);
        try {
            const banks = await loadNigerianBanks();
            // No backend is wired up yet — simulate saving the account so
            // the flow is testable end-to-end.
            await new Promise((resolve) => setTimeout(resolve, 800));
            setBankAccount({
                bankCode,
                bankName: getOptionLabel(banks, bankCode),
                accountNumber,
                accountName,
                currency: DEFAULT_CURRENCY_CODE,
            });
            toast.success("Bank account added successfully");
            onAdded();
        } catch {
            toast.error("Couldn't add your bank account. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <CurrencyDisplay />

            <div className="flex flex-col gap-4">
                <h3 className="text-xs font-semibold font-text uppercase tracking-wide text-mist-700">
                    Bank details
                </h3>
                <MainForm<AddBankAccountFormValues>
                    methods={methods}
                    fields={fields}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    footerSlot={(values) =>
                        values.accountName ? (
                            <Notice>
                                This is the name your bank has for this account. If it
                                isn&apos;t right, check the account number and the bank you
                                selected.
                            </Notice>
                        ) : null
                    }
                    renderFooter={({ isLoading, canSubmit }) => (
                        <FormSubmitButton
                            label="Confirm"
                            loadingLabel="Adding account..."
                            isLoading={isLoading}
                            disabled={!canSubmit || isVerifying}
                            className="mt-3 w-full"
                        />
                    )}
                />
            </div>
        </div>
    );
}

/** The platform only pays out in naira for now, so currency is shown, not chosen. */
function CurrencyDisplay() {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[#1F2937] text-sm font-medium font-text">Currency</span>
            <div className="flex h-11 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-sm font-text">
                <NigeriaFlag className="h-4 w-6 shrink-0 rounded-xs" />
                <span className="font-medium text-zinc-800">{DEFAULT_CURRENCY_CODE}</span>
                <span className="text-zinc-500">{DEFAULT_CURRENCY_NAME}</span>
            </div>
            <span className="text-[#9CA3AF] text-xs font-normal font-text">
                Only naira accounts are supported for now.
            </span>
        </div>
    );
}

function NigeriaFlag({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 3 2" aria-hidden className={className}>
            <rect width="3" height="2" fill="#008751" />
            <rect x="1" width="1" height="2" fill="#ffffff" />
        </svg>
    );
}
