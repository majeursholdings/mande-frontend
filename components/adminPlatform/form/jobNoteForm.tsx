"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormSubmitButton } from "./formButtons";

type JobNoteValues = {
    note: string;
};

const NOTE_MAX_LENGTH = 500;

const FIELDS: FormFieldConfig[] = [
    {
        name: "note",
        type: "textarea",
        // The Notes heading says what this is; the label is for screen readers
        label: <span className="sr-only">Add a note</span>,
        placeholder: "Post an update, comment or feedback…",
        height: 120,
        validation: {
            required: "Write a note first",
            // Trimmed so a note made of only spaces doesn't post
            validate: (value: string) =>
                value.trim().length > 0 || "Write a note first",
            maxLength: {
                value: NOTE_MAX_LENGTH,
                message: `Keep it under ${NOTE_MAX_LENGTH} characters`,
            },
        },
    },
];

/** Leaves a note, comment or feedback on a job — for its project lead. */
export default function JobNoteForm({
    onPost,
}: {
    /** Saves the note. May throw; the form reports the failure. */
    onPost: (message: string) => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<JobNoteValues>({ defaultValues: { note: "" } });

    const handleSubmit = async ({ note }: JobNoteValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate saving the note
            await new Promise((resolve) => setTimeout(resolve, 500));
            onPost(note.trim());
            methods.reset({ note: "" });
        } catch {
            toast.error("Couldn't post your note. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<JobNoteValues>
            methods={methods}
            fields={FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            className="gap-3"
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end">
                    <FormSubmitButton
                        label="Post note"
                        loadingLabel="Posting..."
                        isLoading={isLoading}
                        disabled={!canSubmit}
                        className="h-9 w-auto px-4"
                    />
                </div>
            )}
        />
    );
}
