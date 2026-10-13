"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { getErrorMessage } from "@/lib/api";

/** The API's limit on a note (jobs.validation noteSchema). */
export const JOB_NOTE_MAX_LENGTH = 2000;

type JobNoteFormValues = {
    message: string;
};

type JobNoteFormProps = {
    /** Sends the note; rejects if the server doesn't take it. */
    addNote: (message: string) => Promise<void>;
};

// ─────────────────────────────────────────────────────────────────────────────
// JobNoteForm: the manufacturer leaves a note on the job's thread for their
// project lead (who's told about it). Cleared once it's posted; kept, with
// the reason, if it isn't.
// ─────────────────────────────────────────────────────────────────────────────

export default function JobNoteForm({ addNote }: JobNoteFormProps) {
    const methods = useForm<JobNoteFormValues>({ mode: "onTouched", defaultValues: { message: "" } });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fields: FormFieldConfig[] = [
        {
            name: "message",
            type: "textarea",
            label: "Add a note",
            placeholder: "Share an update or ask your project lead a question",
            height: 96,
            validation: {
                required: "Write a note first",
                maxLength: {
                    value: JOB_NOTE_MAX_LENGTH,
                    message: `A note must be at most ${JOB_NOTE_MAX_LENGTH} characters`,
                },
                // Trimmed so a note made of only spaces doesn't pass
                validate: (value: string) => value.trim().length > 0 || "Write a note first",
            },
        },
    ];

    const handleFormSubmit = async ({ message }: JobNoteFormValues) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await addNote(message.trim());
            methods.reset({ message: "" });
            toast.success("Note posted");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't post your note. Please try again."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainForm<JobNoteFormValues>
            methods={methods}
            fields={fields}
            submitLabel="Post note"
            isLoading={isSubmitting}
            onSubmit={handleFormSubmit}
            hideRequiredMarks
        />
    );
}
