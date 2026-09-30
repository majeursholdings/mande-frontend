"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";

type PlanOfferValues = { discountPercent: string };

const MAX_DISCOUNT_PERCENT = 95;

const FIELDS: FormFieldConfig[] = [
    {
        name: "discountPercent",
        type: "number",
        label: "Discount on every plan (%)",
        placeholder: "0",
        description: "Taken off every plan's usual price, monthly and yearly. 0 ends the offer.",
        min: 0,
        max: MAX_DISCOUNT_PERCENT,
        validation: {
            required: "Enter a discount, or 0 for none",
            validate: (value: string) =>
                (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= MAX_DISCOUNT_PERCENT) ||
                `Enter a whole number from 0 to ${MAX_DISCOUNT_PERCENT}`,
        },
    },
];

/** The offer on every plan — the website, sign-up and plan settings all show the discounted prices. */
export default function PlanOfferForm({
    discountPercent,
    onSave,
}: {
    discountPercent: number;
    onSave: (percent: number) => Promise<void> | void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<PlanOfferValues>({
        mode: "onTouched",
        values: { discountPercent: String(discountPercent) },
    });
    const { isDirty } = methods.formState;

    const handleSubmit = async (values: PlanOfferValues) => {
        setIsLoading(true);
        try {
            const percent = Number(values.discountPercent);
            await onSave(percent);
            methods.reset({ discountPercent: String(percent) });
            toast.success(percent === 0 ? "The plan offer has ended" : `Every plan is now ${percent}% off`);
        } catch {
            toast.error("Couldn't save the offer. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<PlanOfferValues>
            methods={methods}
            fields={FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end">
                    <FormSubmitButton
                        label="Save offer"
                        loadingLabel="Saving..."
                        isLoading={isLoading}
                        disabled={!canSubmit || !isDirty}
                        className="w-auto px-6"
                    />
                </div>
            )}
        />
    );
}
