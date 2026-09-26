"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FEEDBACK_CATEGORY_OPTIONS } from "@/constant/support";
import { FormSubmitButton } from "./formButtons";

type SupportFeedbackFormValues = {
    category: string;
    message: string;
    screenshot: FileList | null;
};

const SUPPORT_FEEDBACK_DEFAULT_VALUES: SupportFeedbackFormValues = {
    category: "",
    message: "",
    screenshot: null,
};

const FIELDS: FormFieldConfig[] = [
    {
        name: "category",
        type: "select",
        label: "What's it about?",
        placeholder: "e.g. Suggestion",
        options: FEEDBACK_CATEGORY_OPTIONS,
        validation: { required: "Choose what your feedback is about" },
    },
    {
        name: "message",
        type: "textarea",
        label: "Your message",
        placeholder: "e.g. It would help to see all my payouts for a job in one place.",
        height: 140,
        validation: {
            required: "Write a message",
            minLength: { value: 10, message: "Tell us a little more (at least 10 characters)" },
            maxLength: { value: 1000, message: "Keep it under 1,000 characters" },
            // Trimmed so a message made of only spaces doesn't pass
            validate: (value: string) =>
                value.trim().length >= 10 || "Tell us a little more (at least 10 characters)",
        },
    },
    {
        name: "screenshot",
        type: "image",
        label: "Screenshot (optional)",
        description: "Helps us see the problem if something isn't working. Up to 5MB.",
        accept: "image/*",
        maxFiles: 1,
        maxSizeMB: 5,
    },
];

export default function SupportFeedbackForm() {
    const [isLoading, setIsLoading] = useState(false);
    // Bumped after sending to remount the form — the upload field keeps its
    // preview in its own state, which a form reset doesn't clear
    const [formKey, setFormKey] = useState(0);
    const methods = useForm<SupportFeedbackFormValues>({
        mode: "onTouched",
        defaultValues: SUPPORT_FEEDBACK_DEFAULT_VALUES,
    });

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate the request so the flow
            // is testable end-to-end.
            await new Promise((resolve) => setTimeout(resolve, 800));
            methods.reset(SUPPORT_FEEDBACK_DEFAULT_VALUES);
            setFormKey((key) => key + 1);
            toast.success("Thanks — we've received your feedback");
        } catch {
            toast.error("Couldn't send your feedback. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<SupportFeedbackFormValues>
            key={formKey}
            methods={methods}
            fields={FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end">
                    <FormSubmitButton
                        label="Send feedback"
                        loadingLabel="Sending..."
                        isLoading={isLoading}
                        disabled={!canSubmit}
                    />
                </div>
            )}
        />
    );
}
