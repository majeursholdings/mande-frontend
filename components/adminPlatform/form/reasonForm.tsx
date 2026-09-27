"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "./formButtons";

type ReasonValues = { reason: string };

const REASON_MIN_LENGTH = 10;
const REASON_MAX_LENGTH = 500;

/**
 * A written reason the manufacturer will read — why step proof is being
 * sent back, or what fault was found in delivered work.
 */
export default function ReasonForm({
    label,
    placeholder,
    submitLabel,
    loadingLabel,
    errorMessage,
    onSubmit,
    onCancel,
}: {
    label: string;
    placeholder: string;
    submitLabel: string;
    loadingLabel: string;
    /** Shown if saving fails. */
    errorMessage: string;
    onSubmit: (reason: string) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<ReasonValues>({ mode: "onTouched", defaultValues: { reason: "" } });

    const fields: FormFieldConfig[] = [
        {
            name: "reason",
            type: "textarea",
            label,
            placeholder,
            rows: 4,
            validation: {
                required: "Tell the manufacturer why",
                validate: (value: string) =>
                    value.trim().length >= REASON_MIN_LENGTH || `Write at least ${REASON_MIN_LENGTH} characters`,
                maxLength: { value: REASON_MAX_LENGTH, message: `Keep it under ${REASON_MAX_LENGTH} characters` },
            },
        },
    ];

    const handleSubmit = async ({ reason }: ReasonValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate saving it
            await new Promise((resolve) => setTimeout(resolve, 600));
            onSubmit(reason.trim());
        } catch {
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ReasonValues>
            methods={methods}
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
                        className="w-auto bg-error-600 px-5 hover:bg-error-700"
                    />
                </div>
            )}
        />
    );
}
