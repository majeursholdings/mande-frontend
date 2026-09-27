"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "./formButtons";

type AccountActionValues = {
    reason: string;
    confirmation: string;
};

const REASON_MAX_LENGTH = 300;

/**
 * `confirm`: the full name has to be typed in capitals — for what takes
 * something away from the manufacturer, never for giving it back.
 */
const ACTIONS = {
    flag: { submitLabel: "Flag manufacturer", loadingLabel: "Flagging...", noteLabel: "Reason", confirm: true },
    suspend: { submitLabel: "Suspend manufacturer", loadingLabel: "Suspending...", noteLabel: "Reason", confirm: true },
    "lift-flag": { submitLabel: "Lift flag", loadingLabel: "Lifting...", noteLabel: "Note", confirm: false },
    "lift-suspension": { submitLabel: "Lift suspension", loadingLabel: "Lifting...", noteLabel: "Note", confirm: false },
    "approve-appeal": { submitLabel: "Approve appeal", loadingLabel: "Approving...", noteLabel: "Note", confirm: false },
} as const;

export type AccountAction = keyof typeof ACTIONS;

/**
 * Changing a manufacturer's account — flagging or suspending it, lifting a
 * flag or suspension, or approving their appeal. An optional note they'll
 * see; flagging and suspending also need their full name typed in capitals,
 * so it's never done by accident.
 */
export default function AccountActionForm({
    action,
    fullName,
    onConfirm,
    onCancel,
}: {
    action: AccountAction;
    /** The manufacturer's full name — typed in capitals to confirm. */
    fullName: string;
    onConfirm: (reason: string | null) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AccountActionValues>({ mode: "onChange", defaultValues: { reason: "", confirmation: "" } });
    const phrase = fullName.toUpperCase();
    const { confirm, noteLabel } = ACTIONS[action];
    // Off until the name is typed exactly, not just typed
    const typed = useWatch({ control: methods.control, name: "confirmation" });
    const isConfirmed = !confirm || typed?.trim() === phrase;

    const fields: FormFieldConfig[] = [
        {
            name: "reason",
            type: "textarea",
            label: (
                <>
                    {noteLabel}{" "}
                    <span className="font-normal text-mist-400">
                        (optional)
                    </span>
                </>
            ),
            placeholder: "Why — the manufacturer will see this",
            height: 120,
            validation: {
                maxLength: {
                    value: REASON_MAX_LENGTH,
                    message: `Keep it under ${REASON_MAX_LENGTH} characters`,
                },
            },
        },
    ];
    if (confirm) {
        fields.push({
            name: "confirmation",
            type: "text",
            label: (
                <>
                    Type <span className="font-semibold text-mist-950">{phrase}</span> to confirm
                </>
            ),
            placeholder: phrase,
            validation: {
                required: `Type ${phrase} to confirm`,
                validate: (value: string) => value.trim() === phrase || `Type ${phrase} exactly, in capitals`,
            },
        });
    }

    const handleSubmit = async ({ reason }: AccountActionValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate saving it
            await new Promise((resolve) => setTimeout(resolve, 600));
            onConfirm(reason.trim() || null);
        } catch {
            toast.error("Couldn't save that. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<AccountActionValues>
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
                        label={ACTIONS[action].submitLabel}
                        loadingLabel={ACTIONS[action].loadingLabel}
                        isLoading={isLoading}
                        disabled={!canSubmit || !isConfirmed}
                        className="w-auto bg-error-600 px-5 hover:bg-error-700"
                    />
                </div>
            )}
        />
    );
}
