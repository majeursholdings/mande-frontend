"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { DEFAULT_MAX_FILE_SIZE_MB } from "@/components/form/fileRules";
import { cleanupFormFieldUploads, clearFormUploadedFiles } from "@/components/form/fileInput";
import { Button } from "@/components/ui/button";
import type { JobAttachmentRecord } from "@/constant/sampleDb";
import { JOB_DETAIL_PRIMARY_BUTTON_CLASS } from "@/components/manufacturerPlatform/jobDetailPage/styles";

type AppealValues = {
    message: string;
    photos: FileList | File[] | null;
    documents: FileList | File[] | null;
};

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
        description: `Images only, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB each`,
        multiple: true,
        maxFiles: 5,
        uploadCategory: "appeal",
        uploadVisibility: "private",
    },
    {
        name: "documents",
        type: "file",
        label: optional("Documents"),
        description: `Invoices, receipts or letters — PDF or Word, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB each`,
        multiple: true,
        maxFiles: 5,
        uploadCategory: "appeal",
        uploadVisibility: "private",
    },
];

/** A suspended manufacturer asking for the suspension to be lifted — what happened, and any files that show it. */
export default function AppealForm({
    onSend,
    onCancel,
}: {
    onSend: (appeal: { message: string; attachments: JobAttachmentRecord[] }) => void;
    /** Shows a Cancel button — e.g. when the form is in a dialog. */
    onCancel?: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AppealValues>({
        mode: "onTouched",
        defaultValues: { message: "", photos: null, documents: null },
    });

    const handleSubmit = async ({ message, photos, documents }: AppealValues) => {
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 800));
            const upload = (files: unknown, kind: JobAttachmentRecord["kind"]) =>
                Array.from((files as Array<Record<string, unknown> | File>) ?? []).map((file) => {
                    if (file && typeof file === "object" && "url" in file && typeof file.url === "string") {
                        const f = file as { name?: string; originalName?: string; url: string };
                        return {
                            name: f.originalName || f.name || "attachment",
                            url: f.url,
                            kind,
                        };
                    }
                    if (file instanceof File) {
                        return { name: file.name, url: URL.createObjectURL(file), kind };
                    }
                    return { name: "attachment", url: "", kind };
                });
            onSend({
                message: message.trim(),
                attachments: [...upload(photos, "image"), ...upload(documents, "document")],
            });
            clearFormUploadedFiles("photos");
            clearFormUploadedFiles("documents");
            toast.success("Appeal sent — we'll get back to you");
        } catch {
            await Promise.allSettled([
                cleanupFormFieldUploads("photos"),
                cleanupFormFieldUploads("documents"),
            ]);
            toast.error("Couldn't send your appeal. Please try again.");
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
