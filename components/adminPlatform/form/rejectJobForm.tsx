"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { DEFAULT_MAX_FILE_SIZE_MB } from "@/components/form/fileRules";
import { Button } from "@/components/ui/button";
import type { AdminJobAttachment } from "@/constant/admin";
import { FormSubmitButton } from "./formButtons";

type RejectJobValues = {
    reason: string;
    photos: FileList | File[] | null;
    documents: FileList | File[] | null;
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
        name: "photos",
        type: "image",
        label: (
            <>
                Photos <span className="font-normal text-mist-400">(optional)</span>
            </>
        ),
        description: `Photos that show the problems — images only, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB each`,
        multiple: true,
        maxFiles: 5,
    },
    {
        name: "documents",
        type: "file",
        label: (
            <>
                Documents <span className="font-normal text-mist-400">(optional)</span>
            </>
        ),
        description: `Marked-up drawings or notes — PDF or Word, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB each`,
        multiple: true,
        maxFiles: 5,
    },
];

/** A lead turning down work that's in review — a written review, and optional photos and documents. */
export default function RejectJobForm({
    onReject,
    onCancel,
}: {
    onReject: (review: { reason: string; attachments: AdminJobAttachment[] }) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<RejectJobValues>({
        mode: "onTouched",
        defaultValues: { reason: "", photos: null, documents: null },
    });

    const handleSubmit = async ({ reason, photos, documents }: RejectJobValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate the upload. Files show
            // from local object URLs until the API returns real ones.
            await new Promise((resolve) => setTimeout(resolve, 800));
            const upload = (files: FileList | File[] | null, kind: AdminJobAttachment["kind"]) =>
                Array.from(files ?? []).map((file) => ({ name: file.name, url: URL.createObjectURL(file), kind }));
            onReject({
                reason: reason.trim(),
                attachments: [...upload(photos, "image"), ...upload(documents, "document")],
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
