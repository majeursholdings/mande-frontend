"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { WithdrawalFeeSettings } from "@/constant/superAdmin";
import { getErrorMessage } from "@/lib/api";
import ReauthSteps from "../reauthSteps";
import FormFieldsSkeleton from "./formFieldsSkeleton";

type Values = {
    charging: boolean;
    /** The day it starts (yyyy-mm-dd), when charging. */
    startsOn: string;
    // Naira, digits only (the amount field)
    fee1: string;
    upTo1: string;
    fee2: string;
    upTo2: string;
    fee3: string;
};

const naira = (kobo: number | null | undefined) => (kobo == null ? "" : String(Math.round(kobo / 100)));
const kobo = (value: string) => Math.round(Number(value || 0) * 100);
const PAYSTACK = { fee1: "10", upTo1: "5000", fee2: "25", upTo2: "50000", fee3: "50" };

// ─────────────────────────────────────────────────────────────────────────────
// WithdrawalFeeForm: the bank transfer fee manufacturers pay on each wallet
// withdrawal (SHOP_IMPLEMENTATION.md 3.5), in three tiers like Paystack's
// pricing, and the day it starts. Saving tells every manufacturer, so set
// the start a few days ahead. It moves money, so saving asks for the
// password and a fresh code. Off (no start date): MANDE pays the fee.
// ─────────────────────────────────────────────────────────────────────────────

function toValues(fee: WithdrawalFeeSettings | undefined): Values {
    const tiers = fee?.tiers ?? [];
    const has3 = tiers.length === 3;
    return {
        charging: !!fee?.startsAt,
        startsOn: fee?.startsAt ? fee.startsAt.slice(0, 10) : "",
        fee1: has3 ? naira(tiers[0]!.feeKobo) : PAYSTACK.fee1,
        upTo1: has3 ? naira(tiers[0]!.upToKobo) : PAYSTACK.upTo1,
        fee2: has3 ? naira(tiers[1]!.feeKobo) : PAYSTACK.fee2,
        upTo2: has3 ? naira(tiers[1]!.upToKobo) : PAYSTACK.upTo2,
        fee3: has3 ? naira(tiers[2]!.feeKobo) : PAYSTACK.fee3,
    };
}

function toSettings(values: Values): WithdrawalFeeSettings {
    return {
        // The start of that day in Lagos (UTC+1)
        startsAt: values.charging && values.startsOn ? new Date(`${values.startsOn.slice(0, 10)}T00:00:00+01:00`).toISOString() : null,
        tiers: [
            { upToKobo: kobo(values.upTo1), feeKobo: kobo(values.fee1) },
            { upToKobo: kobo(values.upTo2), feeKobo: kobo(values.fee2) },
            { upToKobo: null, feeKobo: kobo(values.fee3) },
        ],
    };
}

const feeRule = { required: "Enter the fee", validate: (value: string) => (Number(value) >= 0 && Number(value) <= 10_000) || "Up to ₦10,000" };

export default function WithdrawalFeeForm({ fee, onSave }: { fee: WithdrawalFeeSettings | undefined; onSave: (fee: WithdrawalFeeSettings, reauthToken: string) => Promise<void> }) {
    const methods = useForm<Values>({ mode: "onTouched", defaultValues: toValues(fee) });
    const [pending, setPending] = useState<{ settings: WithdrawalFeeSettings; submitted: Values } | null>(null);

    const fields: FormFieldConfig[] = [
        { name: "charging", type: "checkbox", label: "Manufacturers pay the transfer fee on each withdrawal" },
        {
            name: "startsOn",
            type: "date",
            label: "From",
            description: "Every manufacturer is told when you save. Give them a few days' notice.",
            validation: { validate: (value: string, all: Record<string, unknown>) => !all.charging || !!value || "Pick the day it starts" },
        },
        { name: "fee1", type: "amount", label: "Fee (₦)", validation: feeRule },
        { name: "upTo1", type: "amount", label: "On withdrawals up to (₦)", validation: { required: "Enter the limit" } },
        { name: "fee2", type: "amount", label: "Fee (₦)", validation: feeRule },
        {
            name: "upTo2",
            type: "amount",
            label: "On withdrawals up to (₦)",
            validation: { required: "Enter the limit", validate: (value: string, all: Record<string, unknown>) => Number(value) > Number(all.upTo1) || "Make it more than the first limit" },
        },
        { name: "fee3", type: "amount", label: "Fee on anything above that (₦)", validation: feeRule },
    ];

    const save = async (reauthToken: string) => {
        if (!pending) return;
        try {
            await onSave(pending.settings, reauthToken);
            methods.reset(pending.submitted);
            toast.success(pending.settings.startsAt ? "Withdrawal fee saved. Manufacturers have been told." : "Withdrawal fee switched off");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't save the withdrawal fee. Please try again."));
        }
        setPending(null);
    };

    return (
        <>
            <MainForm<Values>
                methods={methods}
                fields={fields}
                rowPairs={[
                    ["fee1", "upTo1"],
                    ["fee2", "upTo2"],
                ]}
                onSubmit={(submitted) => {
                    try {
                        setPending({ settings: toSettings(submitted), submitted });
                    } catch {
                        toast.error("Couldn't check the withdrawal fee. Please try again.");
                    }
                }}
                hideRequiredMarks
                renderFooter={({ isLoading, canSubmit }) => (
                    <div className="flex justify-end">
                        <FormSubmitButton label="Save withdrawal fee" loadingLabel="Saving..." isLoading={isLoading} disabled={!canSubmit || !methods.formState.isDirty} className="w-auto px-6" />
                    </div>
                )}
            />
            <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Save the withdrawal fee?</DialogTitle>
                        <DialogDescription>
                            {pending?.settings.startsAt
                                ? "Every manufacturer is told about it now, and it's taken from withdrawals from the day you chose."
                                : "Withdrawals will be free for manufacturers: MANDE pays the transfer fee."}
                        </DialogDescription>
                    </div>
                    <ReauthSteps confirmLabel="Save withdrawal fee" onCancel={() => setPending(null)} onConfirmed={save} />
                </DialogContent>
            </Dialog>
        </>
    );
}

export function WithdrawalFeeFormSkeleton() {
    return (
        <FormFieldsSkeleton
            fields={[
                { name: "startsOn", label: "From" },
                { name: "fee1", label: "Fee (₦)" },
                { name: "upTo1", label: "On withdrawals up to (₦)" },
                { name: "fee3", label: "Fee on anything above that (₦)" },
            ]}
            rowPairs={[["fee1", "upTo1"]]}
            submitLabel="Save withdrawal fee"
        />
    );
}
