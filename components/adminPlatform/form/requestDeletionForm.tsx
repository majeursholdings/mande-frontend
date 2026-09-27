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

type RequestDeletionValues = {
    reason: string;
    photos: FileList | File[] | null;
    documents: FileList | File[] | null;
};

const REASON_MIN_LENGTH = 10;
const REASON_MAX_LENGTH = 500;

const optional = (label: string) => (
    <>
        {label} <span className="font-normal text-mist-400">(optional)</span>
    </>
);

const FIELDS: FormFieldConfig[] = [
    {
        name: "reason",
        type: "textarea",
        label: "Reason",
        placeholder: "Why should this account be deleted?",
        height: 120,
        validation: {
            required: "Give the super admin a reason",
            validate: (value: string) =>
                value.trim().length >= REASON_MIN_LENGTH || `Write at least ${REASON_MIN_LENGTH} characters`,
            maxLength: { value: REASON_MAX_LENGTH, message: `Keep it under ${REASON_MAX_LENGTH} characters` },
        },
    },
    {
        name: "photos",
        type: "image",
        label: optional("Photos"),
        description: `Screenshots or photos that back it up — images only, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB each`,
        multiple: true,
        maxFiles: 5,
    },
    {
        name: "documents",
        type: "file",
        label: optional("Documents"),
        description: `PDF or Word, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB each`,
        multiple: true,
        maxFiles: 5,
    },
];

/**
 * An admin asking a super admin to delete a manufacturer's account — admins
 * can't delete it themselves. A reason, and optional files to back it up.
 */
export default function RequestDeletionForm({
    onRequest,
    onCancel,
}: {
    onRequest: (request: { reason: string; attachments: AdminJobAttachment[] }) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<RequestDeletionValues>({
        mode: "onTouched",
        defaultValues: { reason: "", photos: null, documents: null },
    });

    const handleSubmit = async ({ reason, photos, documents }: RequestDeletionValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate the upload. Files show
            // from local object URLs until the API returns real ones.
            await new Promise((resolve) => setTimeout(resolve, 800));
            const upload = (files: FileList | File[] | null, kind: AdminJobAttachment["kind"]) =>
                Array.from(files ?? []).map((file) => ({ name: file.name, url: URL.createObjectURL(file), kind }));
            onRequest({
                reason: reason.trim(),
                attachments: [...upload(photos, "image"), ...upload(documents, "document")],
            });
        } catch {
            toast.error("Couldn't send the deletion request. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<RequestDeletionValues>
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
                        label="Send request"
                        loadingLabel="Sending..."
                        isLoading={isLoading}
                        disabled={!canSubmit}
                        className="w-auto bg-error-600 px-5 hover:bg-error-700"
                    />
                </div>
            )}
        />
    );
}
