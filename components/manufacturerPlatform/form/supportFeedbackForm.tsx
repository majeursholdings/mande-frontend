"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { cleanupFormFieldUploads, clearFormUploadedFiles } from "@/components/form/fileInput";
import { FEEDBACK_CATEGORY_OPTIONS } from "@/constant/support";
import type { ManufacturerFeedback } from "@/constant/manufacturer";
import { FormSubmitButton } from "./formButtons";
import { supportService } from "@/lib/services/supportService";

type SupportFeedbackFormValues = {
    category: ManufacturerFeedback["category"] | "";
    message: string;
    screenshot: FileList | File[] | null;
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
        uploadCategory: "support",
        uploadVisibility: "private",
    },
];

/** Sending feedback to support — `onSend` gets it once it's gone, to show in their history. */
export default function SupportFeedbackForm({
    onSend,
}: {
    onSend: (feedback: Pick<ManufacturerFeedback, "category" | "message" | "screenshotUrl">) => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    // Bumped after sending to remount the form — the upload field keeps its
    // preview in its own state, which a form reset doesn't clear
    const [formKey, setFormKey] = useState(0);
    const methods = useForm<SupportFeedbackFormValues>({
        mode: "onTouched",
        defaultValues: SUPPORT_FEEDBACK_DEFAULT_VALUES,
    });

    const handleSubmit = async ({ category, message, screenshot }: SupportFeedbackFormValues) => {
        setIsLoading(true);
        try {
            const [file] = Array.from(screenshot ?? []);
            const fileObj = file as unknown;
            const publicId =
                fileObj && typeof fileObj === "object" && "publicId" in fileObj && typeof fileObj.publicId === "string"
                    ? fileObj.publicId
                    : undefined;
            const screenshotUrl =
                fileObj && typeof fileObj === "object" && "url" in fileObj && typeof fileObj.url === "string"
                    ? fileObj.url
                    : file instanceof File
                      ? URL.createObjectURL(file)
                      : null;

            await supportService.sendFeedback({
                category: category as ManufacturerFeedback["category"],
                message: message.trim(),
                screenshot: publicId,
            });

            onSend({
                category: category as ManufacturerFeedback["category"],
                message: message.trim(),
                screenshotUrl,
            });
            clearFormUploadedFiles("screenshot");
            methods.reset(SUPPORT_FEEDBACK_DEFAULT_VALUES);
            setFormKey((key) => key + 1);
            toast.success("Thanks — we've received your feedback");
        } catch {
            await cleanupFormFieldUploads("screenshot");
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
