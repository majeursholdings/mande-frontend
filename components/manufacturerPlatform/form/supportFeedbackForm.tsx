"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { cleanupFormFieldUploads, clearFormUploadedFiles } from "@/components/form/fileInput";
import { FEEDBACK_CATEGORY_OPTIONS } from "@/constant/support";
import type { ManufacturerFeedback } from "@/constant/manufacturer";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { FormSubmitButton } from "./formButtons";
import { supportService } from "@/lib/services/supportService";
import { trackEvent } from "@/lib/analytics";

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
        // Signed by the API, which only takes its own uploads with the feedback
        uploadPurpose: "feedback-screenshot",
    },
];

/** Sending feedback to support. Their history refetches once it's sent. */
export default function SupportFeedbackForm() {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    // Bumped after sending to remount the form: the upload field keeps its
    // preview in its own state, which a form reset does not clear
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

            await supportService.sendFeedback({
                category: category as ManufacturerFeedback["category"],
                message: message.trim(),
                screenshot: publicId,
            });

            void queryClient.invalidateQueries({ queryKey: queryKeys.support.feedback() });
            clearFormUploadedFiles("screenshot");
            methods.reset(SUPPORT_FEEDBACK_DEFAULT_VALUES);
            setFormKey((key) => key + 1);
            trackEvent({ event: "form_submit", form_name: "support_feedback" });
            toast.success("Thanks, we've received your feedback");
        } catch (err) {
            trackEvent({ event: "form_error", form_name: "support_feedback" });
            await cleanupFormFieldUploads("screenshot");
            toast.error(getErrorMessage(err, "Couldn't send your feedback. Please try again."));
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
            trackingName="support_feedback"
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
