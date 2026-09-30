"use client";

import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { JOB_DETAIL_PRIMARY_BUTTON_CLASS } from "@/components/manufacturerPlatform/jobDetailPage/styles";
import { cleanupFormFieldUploads, clearFormUploadedFiles } from "@/components/form/fileInput";
import { toast } from "sonner";

import { MIN_STEP_PROOF_PHOTOS, MAX_STEP_PROOF_PHOTOS } from "@/constant/jobWorkflow";

type CompletionFormValues = {
    photo: FileList;
    note?: string;
};

const NOTE_MAX_LENGTH = 500;

const getFields = (photoLabel: string, withNote: boolean): FormFieldConfig[] => {
    const minPhotos = withNote ? MIN_STEP_PROOF_PHOTOS : 1;
    return [
        {
            name: "photo",
            // Images only, up to the form's 5MB default each
            type: "image",
            label: photoLabel,
            description: minPhotos > 1 ? `Upload at least ${minPhotos} photos (up to ${MAX_STEP_PROOF_PHOTOS})` : undefined,
            showPreview: true,
            multiple: true,
            maxFiles: MAX_STEP_PROOF_PHOTOS,
            uploadCategory: "jobProof",
            uploadVisibility: "public",
            validation: {
                required: minPhotos > 1 ? `Upload at least ${minPhotos} photos` : "Upload at least one photo",
                validate: (value: unknown) => {
                    const count = Array.isArray(value) ? value.length : value instanceof FileList ? value.length : 0;
                    if (count < minPhotos) {
                        return `Upload at least ${minPhotos} photos`;
                    }
                    return true;
                },
            },
        },
        ...(withNote
            ? [
                  {
                      name: "note",
                      type: "textarea",
                      label: "Note (optional)",
                      placeholder: "Anything your project lead should know about this step",
                      rows: 3,
                      validation: {
                          maxLength: { value: NOTE_MAX_LENGTH, message: `Keep it under ${NOTE_MAX_LENGTH} characters` },
                      },
                  } satisfies FormFieldConfig,
              ]
            : []),
    ];
};

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailCompletionUpload — shown once every production step is approved.
// Submitting the photo is the "mark as done" action: it's what actually
// sends the job for review, so there's no separate confirm step on top of it.
// Also reused, with different copy, to resubmit a rejected job with new
// proof, and to send proof of each production step — with an optional note
// when `withNote` is set (every step's proof).
// ─────────────────────────────────────────────────────────────────────────────

export default function JobDetailCompletionUpload({
    onComplete,
    title = "Production complete",
    description = "Upload a photo of the finished furniture to mark this job as done.",
    submitLabel = "Mark as done",
    photoLabel = "Furniture photo",
    withNote = false,
}: {
    onComplete: (imageUrls: string[], note?: string) => void;
    title?: string;
    description?: string;
    submitLabel?: string;
    photoLabel?: string;
    /** Adds an optional note to send with the photos. */
    withNote?: boolean;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
            <div>
                <h3 className="text-sm font-semibold font-text text-mist-950">
                    {title}
                </h3>
                <p className="text-xs font-text text-mist-500">{description}</p>
            </div>

            <MainForm<CompletionFormValues>
                fields={getFields(photoLabel, withNote)}
                submitLabel={submitLabel}
                onSubmit={async (values) => {
                    try {
                        const minPhotos = withNote ? MIN_STEP_PROOF_PHOTOS : 1;
                        const files = Array.from(values.photo ?? []);
                        if (files.length < minPhotos) {
                            toast.error(minPhotos > 1 ? `Upload at least ${minPhotos} photos` : "You need to add an image to submit");
                            return;
                        }
                        const urls = (files as Array<Record<string, unknown> | File>)
                            .map((file) => {
                                if (file && typeof file === "object" && "url" in file && typeof file.url === "string") {
                                    return file.url;
                                }
                                if (file instanceof File) return URL.createObjectURL(file);
                                return "";
                            })
                            .filter(Boolean);
                        clearFormUploadedFiles("photo");
                        onComplete(urls, values.note?.trim() || undefined);
                    } catch {
                        await cleanupFormFieldUploads("photo");
                        toast.error("Couldn't upload the photo. Please try again.");
                    }
                }}
                renderFooter={({ isLoading, canSubmit }) => (
                    <Button
                        type="submit"
                        disabled={isLoading || !canSubmit}
                        className={`w-full ${JOB_DETAIL_PRIMARY_BUTTON_CLASS}`}
                    >
                        {submitLabel}
                    </Button>
                )}
            />
        </div>
    );
}
