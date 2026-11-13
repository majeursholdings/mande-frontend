"use client";

import { useState } from "react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";

type ReasonValues = { reason: string };

const REASON_MIN = 5;
const REASON_MAX = 500;

/**
 * A reason, for a shop action the seller (or customer) is told about:
 * taking a product off the shop, revoking or restoring a seller's shop
 * access, or rejecting a bank transfer. The API keeps it on the record and
 * in the notification.
 */
export default function ShopReasonForm({
    label,
    placeholder,
    description,
    submitLabel,
    loadingLabel = "Saving...",
    maxLength = REASON_MAX,
    onSubmit,
    onCancel,
}: {
    label: string;
    placeholder: string;
    description?: string;
    submitLabel: string;
    loadingLabel?: string;
    /** The longest reason the API takes for this action (500 unless it says less). */
    maxLength?: number;
    onSubmit: (reason: string) => Promise<void>;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);

    const fields: FormFieldConfig[] = [
        {
            name: "reason",
            type: "textarea",
            label,
            placeholder,
            description,
            height: 100,
            validation: {
                required: "Give a reason",
                validate: (value: string) => {
                    const length = value.trim().length;
                    if (length < REASON_MIN) return `Use at least ${REASON_MIN} characters`;
                    return length <= maxLength || `Keep it to ${maxLength} characters`;
                },
            },
        },
    ];

    const handleSubmit = async ({ reason }: ReasonValues) => {
        setIsLoading(true);
        try {
            await onSubmit(reason.trim());
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't save that. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ReasonValues>
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <FormSubmitButton
                        label={submitLabel}
                        loadingLabel={loadingLabel}
                        isLoading={isLoading}
                        disabled={!canSubmit}
                        className="w-auto px-6"
                    />
                </div>
            )}
        />
    );
}
