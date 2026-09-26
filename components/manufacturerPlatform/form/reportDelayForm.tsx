"use client";

import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { toast } from "sonner";

type ReportDelayFormValues = {
    delay: string;
};

type ReportDelayFormProps = {
    reportDelay: () => void;
    closeDialog: () => void;
};

const FIELDS: FormFieldConfig[] = [
    {
        name: "delay",
        type: "textarea",
        placeholder: "Enter delay here",
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

export default function ReportDelayForm({ reportDelay, closeDialog }: ReportDelayFormProps) {
    const handleFormSubmit = () => {
        try {
            reportDelay();
            closeDialog();
            toast.success("Submitted successfully");
        } catch {
            toast.error("Couldn't report the delay on this job. Please try again.");
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <p className="text-xs text-mist-400">
                State any delay you might be experiencing during the course of
                this production. It will be escalated to customer service.
            </p>
            <MainForm<ReportDelayFormValues>
                fields={FIELDS}
                submitLabel="Submit delay"
                onSubmit={handleFormSubmit}
            />
        </div>
    );
}
