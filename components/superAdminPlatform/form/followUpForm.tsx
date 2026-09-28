"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";

type FollowUpValues = { note: string };

const NOTE_MAX_LENGTH = 300;

/**
 * How a super admin followed up a manufacturer's low rating of their project
 * lead — kept with the rating, so there's a record of what was done.
 */
export default function FollowUpForm({
    leadName,
    onSave,
    onCancel,
}: {
    leadName: string;
    onSave: (note: string) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<FollowUpValues>({ mode: "onTouched", defaultValues: { note: "" } });

    const fields: FormFieldConfig[] = [
        {
            name: "note",
            type: "textarea",
            label: "What you did",
            placeholder: `e.g. Spoke to ${leadName} about reviewing work within the day`,
            height: 110,
            validation: {
                required: "Say how you followed it up",
                validate: (value: string) => value.trim().length > 0 || "Say how you followed it up",
                maxLength: { value: NOTE_MAX_LENGTH, message: `Keep it under ${NOTE_MAX_LENGTH} characters` },
            },
        },
    ];

    const handleSubmit = async ({ note }: FollowUpValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate saving it
            await new Promise((resolve) => setTimeout(resolve, 600));
            onSave(note.trim());
        } catch {
            toast.error("Couldn't save the follow-up. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<FollowUpValues>
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
                        label="Mark as followed up"
                        loadingLabel="Saving..."
                        isLoading={isLoading}
                        disabled={!canSubmit}
                        className="w-auto px-5"
                    />
                </div>
            )}
        />
    );
}
