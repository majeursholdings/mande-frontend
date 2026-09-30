"use client";

import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { toast } from "sonner";

type CancelJobFormValues = {
    reason: string;
};

type CancelJobFormProps = {
    cancelJob: (reason: string) => void | Promise<void>;
    closeDialog: () => void;
};

const FIELDS: FormFieldConfig[] = [
    {
        name: "reason",
        type: "textarea",
        placeholder: "State reason here",
        height: 120,
        validation: {
            required: "Reason is required",
            minLength: {
                value: 5,
                message: "Reason must be at least 5 characters",
            },
            maxLength: {
                value: 250,
                message: "Reason must not exceed 250 characters",
            },
            // Trimmed so a reason made of only spaces doesn't pass
            validate: (value: string) =>
                value.trim().length >= 5 ||
                "Reason must be at least 5 characters",
        },
    },
];

export default function CancelJobForm({
    cancelJob,
    closeDialog,
}: CancelJobFormProps) {
    const handleFormSubmit = async (values: CancelJobFormValues) => {
        try {
            await cancelJob(values.reason.trim());
            closeDialog();
            toast.success("Submitted successfully");
        } catch {
            toast.error("Couldn't cancel this job. Please try again.");
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <p className="text-xs text-mist-400">
                This action cannot be undone.
            </p>
            <MainForm<CancelJobFormValues>
                fields={FIELDS}
                submitLabel="Cancel job"
                onSubmit={handleFormSubmit}
            />
        </div>
    );
}
