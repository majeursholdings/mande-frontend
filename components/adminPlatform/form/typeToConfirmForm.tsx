"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import { FormSubmitButton } from "./formButtons";

type TypeToConfirmValues = { confirmation: string };

/** Case and surrounding spaces don't matter — the words do. */
const matches = (typed: string, expected: string) => typed.trim().toLowerCase() === expected.trim().toLowerCase();

/**
 * The last step of every delete: type the name of what's going (a person's
 * full name, a job's title) and only then does the red button work. Stops
 * a delete going through on a slip of the finger.
 */
export default function TypeToConfirmForm({
    confirmText,
    submitLabel,
    loadingLabel,
    errorMessage,
    onConfirm,
    onCancel,
}: {
    /** What they have to type, e.g. "Demi Semande". */
    confirmText: string;
    submitLabel: string;
    loadingLabel: string;
    /** Shown if the delete fails. */
    errorMessage: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<TypeToConfirmValues>({ mode: "onChange", defaultValues: { confirmation: "" } });
    const typed = useWatch({ control: methods.control, name: "confirmation" }) ?? "";

    const fields: FormFieldConfig[] = [
        {
            name: "confirmation",
            type: "text",
            label: (
                <>
                    Type <span className="font-semibold text-mist-950">{confirmText}</span> to confirm
                </>
            ),
            placeholder: confirmText,
            autoComplete: "off",
            validation: {
                required: `Type ${confirmText} to confirm`,
                validate: (value: string) => matches(value, confirmText) || `That doesn't match ${confirmText}`,
            },
        },
    ];

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
        } catch (err: unknown) {
            const message = getErrorMessage(err, errorMessage);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<TypeToConfirmValues>
            methods={methods}
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            renderFooter={({ isLoading }) => (
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
                        disabled={!matches(typed, confirmText)}
                        className="w-auto bg-error-600 px-5 hover:bg-error-700"
                    />
                </div>
            )}
        />
    );
}
