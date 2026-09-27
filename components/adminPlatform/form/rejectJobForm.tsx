"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import type { AdminJobAttachment } from "@/constant/admin";
import { FormSubmitButton } from "./formButtons";

type RejectJobValues = {
    reason: string;
    attachments: FileList | File[] | null;
};

const REASON_MIN_LENGTH = 10;
const REASON_MAX_LENGTH = 500;

const FIELDS: FormFieldConfig[] = [
    {
        name: "reason",
        type: "textarea",
        label: "Your review",
        placeholder: "What's wrong, and what does the manufacturer need to fix?",
        rows: 4,
        validation: {
            required: "Tell the manufacturer why",
            validate: (value: string) =>
                value.trim().length >= REASON_MIN_LENGTH || `Write at least ${REASON_MIN_LENGTH} characters`,
            maxLength: { value: REASON_MAX_LENGTH, message: `Keep it under ${REASON_MAX_LENGTH} characters` },
        },
    },
    {
        name: "attachments",
        type: "file",
        label: (
            <>
                Attachments <span className="font-normal text-mist-400">(optional)</span>
            </>
        ),
        description: "Photos or PDFs that show the problems",
        accept: ".pdf, .jpg, .jpeg, .png, .webp, .avif, .heic, application/pdf, image/jpeg, image/png, image/webp, image/avif, image/heic",
        multiple: true,
        maxFiles: 5,
        maxSizeMB: 10,
    },
];

/** A lead turning down work that's in review — a written review, and optional photos or PDFs. */
export default function RejectJobForm({
    onReject,
    onCancel,
}: {
    onReject: (review: { reason: string; attachments: AdminJobAttachment[] }) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<RejectJobValues>({ mode: "onTouched", defaultValues: { reason: "", attachments: null } });

    const handleSubmit = async ({ reason, attachments }: RejectJobValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate the upload. Files show
            // from local object URLs until the API returns real ones.
            await new Promise((resolve) => setTimeout(resolve, 800));
            onReject({
                reason: reason.trim(),
                attachments: Array.from(attachments ?? []).map((file) => ({
                    name: file.name,
                    url: URL.createObjectURL(file),
                    kind: file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf") ? "document" : "image",
                })),
            });
        } catch {
            toast.error("Couldn't reject the job. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<RejectJobValues>
            methods={methods}
            fields={FIELDS}
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
                        label="Reject job"
                        loadingLabel="Rejecting..."
                        isLoading={isLoading}
                        disabled={!canSubmit}
                        className="w-auto bg-error-600 px-5 hover:bg-error-700"
                    />
                </div>
            )}
        />
    );
}
