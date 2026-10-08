"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig, SelectOption } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";

export type DeactivateProjectLeadValues = { reason: string; replacementLeadId?: string };

type DeactivateProjectLeadFormValues = { reason: string; replacementLeadId: string };

const REASON_MIN_LENGTH = 5;
const REASON_MAX_LENGTH = 1000;

/**
 * Why a project lead's account is being deactivated and, when they're the only
 * lead on some active jobs, the active lead who takes those jobs over
 * (`replacementOptions`; leave it out when no one needs to). Submitting moves
 * on to confirming it's them (see ReauthSteps).
 */
export default function DeactivateProjectLeadForm({
    replacementOptions,
    onSubmit,
    onCancel,
}: {
    replacementOptions?: SelectOption[];
    onSubmit: (values: DeactivateProjectLeadValues) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<DeactivateProjectLeadFormValues>({
        mode: "onTouched",
        defaultValues: { reason: "", replacementLeadId: "" },
    });

    const fields: FormFieldConfig[] = [
        ...(replacementOptions
            ? [
                  {
                      name: "replacementLeadId",
                      type: "combobox" as const,
                      label: "Replacement project lead",
                      placeholder: "Choose an active project lead",
                      emptyMessage: "No project lead matches that name",
                      options: replacementOptions,
                      description: "They become the lead on the jobs listed above, and we let them know.",
                      validation: { required: "Choose who takes over their jobs" },
                  },
              ]
            : []),
        {
            name: "reason",
            type: "textarea",
            label: "Reason",
            placeholder: "Why is this account being deactivated?",
            height: 110,
            description: "Kept in the activity log for other super admins.",
            validation: {
                required: "Give a reason",
                validate: (value: string) =>
                    value.trim().length >= REASON_MIN_LENGTH || `Write at least ${REASON_MIN_LENGTH} characters`,
                maxLength: { value: REASON_MAX_LENGTH, message: `Keep it under ${REASON_MAX_LENGTH} characters` },
            },
        },
    ];

    const handleSubmit = async (values: DeactivateProjectLeadFormValues) => {
        setIsLoading(true);
        try {
            if (replacementOptions && !values.replacementLeadId) throw new Error("No replacement chosen");
            onSubmit({
                reason: values.reason.trim(),
                ...(replacementOptions ? { replacementLeadId: values.replacementLeadId } : {}),
            });
        } catch {
            toast.error("Choose who takes over their jobs, then try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<DeactivateProjectLeadFormValues>
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
                        label="Continue"
                        isLoading={isLoading}
                        disabled={!canSubmit}
                        className="w-auto bg-error-600 px-6 hover:bg-error-700"
                    />
                </div>
            )}
        />
    );
}
