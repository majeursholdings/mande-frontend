"use client";

import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { formatDuration, formatOrdinalDate } from "@/lib/date";
import { MAX_EXTENSION_PERCENT } from "@/constant/jobWorkflow";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";

type ReportDelayFormValues = {
    newDueDate: string;
    delay: string;
};

type ReportDelayFormProps = {
    /** ISO dates — the job's due date now, and the latest one it can move to (see getLatestAllowedDueDate). */
    dueDate: string;
    latestDueDate: Date;
    /** ISO dates the job's original length is measured between — its start, and its first due date. */
    start: string;
    originalDueDate: string;
    reportDelay: (request: { requestedDueDate: string; reason: string }) => Promise<void>;
    closeDialog: () => void;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// ─────────────────────────────────────────────────────────────────────────────
// ReportDelayForm — the manufacturer asks for a later due date, and says why.
// The new date has to be after the current one and no later than
// MAX_EXTENSION_PERCENT of the job's original length past its original due
// date; their project lead approves or rejects it.
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportDelayForm({
    dueDate,
    latestDueDate,
    start,
    originalDueDate,
    reportDelay,
    closeDialog,
}: ReportDelayFormProps) {
    const earliest = startOfDay(new Date(dueDate));
    earliest.setDate(earliest.getDate() + 1);
    const latest = startOfDay(latestDueDate);

    const fields: FormFieldConfig[] = [
        {
            name: "newDueDate",
            type: "date",
            label: "New due date",
            placeholder: "Pick the date you can deliver by",
            description: `By ${formatOrdinalDate(latest)} at the latest — up to ${MAX_EXTENSION_PERCENT}% of the job's original ${formatDuration(new Date(start), new Date(originalDueDate))}.`,
            minDate: earliest,
            maxDate: latest,
            validation: {
                required: "Pick the new due date",
                validate: (value: string) => {
                    const picked = startOfDay(new Date(value));
                    if (picked < earliest) return "Pick a date after the current due date";
                    return picked <= latest || `Pick a date no later than ${formatOrdinalDate(latest)}`;
                },
            },
        },
        {
            name: "delay",
            type: "textarea",
            label: "Reason",
            placeholder: "What's holding the job up?",
            height: 120,
            validation: {
                required: "Delay is required",
                minLength: {
                    value: 5,
                    message: "Delay must be at least 5 characters",
                },
                maxLength: {
                    value: 250,
                    message: "Delay must not exceed 250 characters",
                },
                // Trimmed so a delay made of only spaces doesn't pass
                validate: (value: string) =>
                    value.trim().length >= 5 ||
                    "Delay must be at least 5 characters",
            },
        },
    ];

    const handleFormSubmit = async ({ newDueDate, delay }: ReportDelayFormValues) => {
        try {
            await reportDelay({ requestedDueDate: new Date(newDueDate).toISOString(), reason: delay.trim() });
            closeDialog();
            toast.success("Delay reported. Waiting for your project lead");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't report the delay on this job. Please try again."));
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <p className="text-xs text-mist-400">
                Ask for a later due date if something is holding up production. Your project lead approves or
                rejects it.
            </p>
            <MainForm<ReportDelayFormValues>
                fields={fields}
                submitLabel="Submit delay"
                onSubmit={handleFormSubmit}
            />
        </div>
    );
}
