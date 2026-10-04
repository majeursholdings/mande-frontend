"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { API_DOCUMENT_ACCEPT, API_PHOTO_ACCEPT, DEFAULT_MAX_FILE_SIZE_MB } from "@/components/form/fileRules";
import { clearFormUploadedFiles } from "@/components/form/fileInput";
import { getErrorMessage } from "@/lib/api";
import type { CloudinaryUploadResult } from "@/lib/services/cloudinaryService";
import { Button } from "@/components/ui/button";
import type { JobAttachmentRecord } from "@/constant/platformRecords";
import { JOB_DETAIL_PRIMARY_BUTTON_CLASS } from "@/components/manufacturerPlatform/jobDetailPage/styles";

type AppealValues = {
    message: string;
    /** Uploaded as soon as they're picked (see the fields' uploadPurpose). */
    photos: CloudinaryUploadResult[] | null;
    documents: CloudinaryUploadResult[] | null;
};

/** The API takes up to 5 files with an appeal, photos and documents together. */
const MAX_ATTACHMENTS = 5;


const MESSAGE_MIN_LENGTH = 20;
const MESSAGE_MAX_LENGTH = 1000;

const optional = (label: string) => (
    <>
        {label} <span className="font-normal text-mist-400">(optional)</span>
    </>
);

const FIELDS: FormFieldConfig[] = [
    {
        name: "message",
        type: "textarea",
        label: "Your appeal",
        placeholder: "Tell us what happened, and why the suspension should be lifted",
        rows: 5,
        validation: {
            required: "Tell us why the suspension should be lifted",
            validate: (value: string) =>
                value.trim().length >= MESSAGE_MIN_LENGTH || `Write at least ${MESSAGE_MIN_LENGTH} characters`,
            maxLength: { value: MESSAGE_MAX_LENGTH, message: `Keep it under ${MESSAGE_MAX_LENGTH} characters` },
        },
    },
    {
        name: "photos",
        type: "image",
        label: optional("Photos"),
        description: `JPG, PNG or WebP, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB each`,
        accept: API_PHOTO_ACCEPT,
        multiple: true,
        maxFiles: MAX_ATTACHMENTS,
        // Signed by the API, which only takes its own uploads with an appeal
        uploadPurpose: "appeal-attachment",
    },
    {
        name: "documents",
        type: "file",
        label: optional("Documents"),
        description: `Invoices, receipts or letters as PDFs, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB each. Up to ${MAX_ATTACHMENTS} files in all.`,
        accept: API_DOCUMENT_ACCEPT,
        multiple: true,
        maxFiles: MAX_ATTACHMENTS,
        uploadPurpose: "appeal-attachment",
    },
];

/** A suspended manufacturer asking for the suspension to be lifted — what happened, and any files that show it. */
export default function AppealForm({
    onSend,
    onCancel,
}: {
    /** Sends the appeal; a rejection (shown as a toast) keeps the form filled in to try again. */
    onSend: (appeal: { message: string; attachments: JobAttachmentRecord[] }) => Promise<void>;
    /** Shows a Cancel button — e.g. when the form is in a dialog. */
    onCancel?: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AppealValues>({
        mode: "onTouched",
        defaultValues: { message: "", photos: null, documents: null },
    });

    const handleSubmit = async ({ message, photos, documents }: AppealValues) => {
        const toAttachments = (files: CloudinaryUploadResult[] | null, kind: JobAttachmentRecord["kind"]) =>
            (files ?? [])
                .filter((file) => !!file?.publicId)
                .map((file) => ({ name: file.originalName || file.name || "Attachment", url: file.url, kind, publicId: file.publicId }));
        const attachments = [...toAttachments(photos, "image"), ...toAttachments(documents, "document")];
        if (attachments.length > MAX_ATTACHMENTS) {
            toast.error(`Add up to ${MAX_ATTACHMENTS} files in all`);
            return;
        }
        setIsLoading(true);
        try {
            await onSend({ message: message.trim(), attachments });
            clearFormUploadedFiles("photos");
            clearFormUploadedFiles("documents");
            toast.success("Appeal sent. We'll get back to you.");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't send your appeal. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<AppealValues>
            methods={methods}
            fields={FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex gap-3">
                    {onCancel && (
                        <Button type="button" variant="outline" className="h-11 flex-1" onClick={onCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isLoading || !canSubmit}
                        className={`h-11 flex-1 ${JOB_DETAIL_PRIMARY_BUTTON_CLASS}`}
                    >
                        {isLoading ? "Sending..." : "Send appeal"}
                    </Button>
                </div>
            )}
        />
    );
}
