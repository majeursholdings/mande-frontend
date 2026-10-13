"use client";

import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";

type DeclineJobFormValues = {
    reason: string;
};

type DeclineJobFormProps = {
    /** Sends the decline to the API, with the reason if one was given. Rejects if it doesn't take it. */
    declineJob: (reason?: string) => Promise<void>;
    closeDialog: () => void;
};

const REASON_MAX_LENGTH = 500;

const FIELDS: FormFieldConfig[] = [
    {
        name: "reason",
        type: "textarea",
        label: "Reason (optional)",
        placeholder: "Let your project lead know why, if you like",
        height: 120,
        validation: {
            maxLength: {
                value: REASON_MAX_LENGTH,
                message: `Reason must not exceed ${REASON_MAX_LENGTH} characters`,
            },
        },
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// DeclineJobForm: confirms turning an offered job down, with an optional
// reason for the project lead. Declining ends the offer for everyone it went
// to, so the lead can offer the job again.
// ─────────────────────────────────────────────────────────────────────────────

export default function DeclineJobForm({ declineJob, closeDialog }: DeclineJobFormProps) {
    const handleFormSubmit = async (values: DeclineJobFormValues) => {
        try {
            await declineJob(values.reason?.trim() || undefined);
            closeDialog();
            toast.success("Job declined");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't decline this job. Please try again."));
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <p className="text-xs text-mist-400">
                The offer ends for everyone it went to, and your project lead can offer the job again. This can&apos;t be
                undone.
            </p>
            <MainForm<DeclineJobFormValues>
                fields={FIELDS}
                submitLabel="Decline job"
                onSubmit={handleFormSubmit}
            />
        </div>
    );
}
