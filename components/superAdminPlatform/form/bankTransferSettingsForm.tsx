"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ShopBankTransferSettings } from "@/constant/superAdmin";
import { getErrorMessage } from "@/lib/api";
import ReauthSteps from "../reauthSteps";
import FormFieldsSkeleton from "./formFieldsSkeleton";

type Values = { enabled: boolean; bankName: string; accountNumber: string; accountName: string; sendWithinHours: string };

/** Mirrors BANK_ACCOUNT_NUMBER_LENGTH and MAX_BANK_TRANSFER_HOURS in mande-backend. */
const ACCOUNT_NUMBER_LENGTH = 10;
const MAX_HOURS = 168;

// ─────────────────────────────────────────────────────────────────────────────
// BankTransferSettingsForm: paying for shop orders by bank transfer. The
// account customers send money to (shown on their order and in the email
// they get), and how many hours they have to send it and say so before the
// order expires. Admins and super admins then confirm each transfer on Shop ›
// Bank transfers. It decides where customers' money goes, so saving asks
// for the password and a fresh code, and every other super admin is told.
// Orders already placed keep the account they were given.
// ─────────────────────────────────────────────────────────────────────────────

const toValues = (settings: ShopBankTransferSettings | undefined): Values => ({
    enabled: settings?.enabled ?? false,
    bankName: settings?.bankName ?? "",
    accountNumber: settings?.accountNumber ?? "",
    accountName: settings?.accountName ?? "",
    sendWithinHours: String(settings?.sendWithinHours ?? 24),
});

const toSettings = (values: Values): ShopBankTransferSettings => ({
    enabled: values.enabled,
    bankName: values.bankName.trim(),
    accountNumber: values.accountNumber.trim(),
    accountName: values.accountName.trim(),
    sendWithinHours: Number(values.sendWithinHours),
});

/** Needed to switch it on; optional while it's off. */
const neededWhenOn = (message: string) => (value: string, all: Record<string, unknown>) => !all.enabled || value.trim().length >= 2 || message;

export default function BankTransferSettingsForm({
    settings,
    onSave,
}: {
    settings: ShopBankTransferSettings | undefined;
    onSave: (settings: ShopBankTransferSettings, reauthToken: string) => Promise<void>;
}) {
    const methods = useForm<Values>({ mode: "onTouched", defaultValues: toValues(settings) });
    const [pending, setPending] = useState<{ settings: ShopBankTransferSettings; submitted: Values } | null>(null);

    const fields: FormFieldConfig[] = [
        { name: "enabled", type: "checkbox", label: "Customers can pay by bank transfer" },
        { name: "bankName", type: "text", label: "Bank", placeholder: "e.g. Providus Bank", maxLength: 80, validation: { validate: neededWhenOn("Enter the bank's name") } },
        {
            name: "accountNumber",
            type: "text",
            label: "Account number",
            inputMode: "numeric",
            maxLength: ACCOUNT_NUMBER_LENGTH,
            validation: {
                validate: (value: string, all: Record<string, unknown>) =>
                    (!all.enabled && value.trim() === "") || new RegExp(`^\\d{${ACCOUNT_NUMBER_LENGTH}}$`).test(value.trim()) || `Enter the ${ACCOUNT_NUMBER_LENGTH}-digit account number`,
            },
        },
        {
            name: "accountName",
            type: "text",
            label: "Account name",
            description: "Exactly as the bank shows it, so customers can check they're paying MANDE.",
            maxLength: 120,
            validation: { validate: neededWhenOn("Enter the name on the account") },
        },
        {
            name: "sendWithinHours",
            type: "number",
            label: "Hours customers have to send it",
            description: "An order not marked as sent by then is cancelled. One marked as sent waits for staff to check it.",
            min: 1,
            max: MAX_HOURS,
            validation: {
                required: "Enter the hours",
                validate: (value: string) => (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= MAX_HOURS) || `A whole number from 1 to ${MAX_HOURS}`,
            },
        },
    ];

    const save = async (reauthToken: string) => {
        if (!pending) return;
        try {
            await onSave(pending.settings, reauthToken);
            methods.reset(pending.submitted);
            toast.success(pending.settings.enabled ? "Bank transfers saved. Customers can now pay this way." : "Bank transfers switched off");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't save the bank transfer settings. Please try again."));
        }
        setPending(null);
    };

    return (
        <>
            <MainForm<Values>
                methods={methods}
                fields={fields}
                rowPairs={[["bankName", "accountNumber"]]}
                onSubmit={(submitted) => {
                    try {
                        setPending({ settings: toSettings(submitted), submitted });
                    } catch {
                        toast.error("Couldn't check the bank transfer settings. Please try again.");
                    }
                }}
                hideRequiredMarks
                renderFooter={({ isLoading, canSubmit }) => (
                    <div className="flex justify-end">
                        <FormSubmitButton label="Save bank transfers" loadingLabel="Saving..." isLoading={isLoading} disabled={!canSubmit || !methods.formState.isDirty} className="w-auto px-6" />
                    </div>
                )}
            />
            <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Save bank transfers?</DialogTitle>
                        <DialogDescription>
                            {pending?.settings.enabled
                                ? `New orders paid by transfer will be asked to pay ${pending.settings.accountName}, ${pending.settings.bankName} ${pending.settings.accountNumber}. Check the number carefully: customers' money goes here.`
                                : "Customers won't be able to choose bank transfer at checkout. Orders already waiting for a transfer carry on."}
                        </DialogDescription>
                    </div>
                    <ReauthSteps confirmLabel="Save bank transfers" onCancel={() => setPending(null)} onConfirmed={save} />
                </DialogContent>
            </Dialog>
        </>
    );
}

export function BankTransferSettingsFormSkeleton() {
    return (
        <FormFieldsSkeleton
            fields={[
                { name: "bankName", label: "Bank" },
                { name: "accountNumber", label: "Account number" },
                { name: "accountName", label: "Account name" },
                { name: "sendWithinHours", label: "Hours customers have to send it" },
            ]}
            rowPairs={[["bankName", "accountNumber"]]}
            submitLabel="Save bank transfers"
        />
    );
}
