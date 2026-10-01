"use client";

import { useState } from "react";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { JOB_DETAIL_PRIMARY_BUTTON_CLASS } from "@/components/manufacturerPlatform/jobDetailPage/styles";
import { clearFormUploadedFiles } from "@/components/form/fileInput";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";

import { MIN_STEP_PROOF_PHOTOS, MAX_STEP_PROOF_PHOTOS } from "@/constant/jobWorkflow";
import type { CloudinaryUploadResult } from "@/lib/services/cloudinaryService";

type CompletionFormValues = {
    /** Uploaded as soon as they're picked (see the field's uploadPurpose). */
    photo: CloudinaryUploadResult[];
    note?: string;
};

/** A photo sent as proof: the API takes the publicId; the url shows it straight away. */
export type ProofPhoto = { publicId: string; url: string };

/** The finished furniture can have up to 6 photos (the API's limit). */
const MAX_COMPLETION_PHOTOS = 6;

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
            maxFiles: withNote ? MAX_STEP_PROOF_PHOTOS : MAX_COMPLETION_PHOTOS,
            // Signed by the API, which only takes its own uploads as proof
            uploadPurpose: withNote ? "step-proof" : "completion-photo",
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
    /** Sends the photos; a rejection (shown as a toast) keeps them in the form to try again. */
    onComplete: (photos: ProofPhoto[], note?: string) => Promise<void>;
    title?: string;
    description?: string;
    submitLabel?: string;
    photoLabel?: string;
    /** Adds an optional note to send with the photos. */
    withNote?: boolean;
}) {
    const [isLoading, setIsLoading] = useState(false);

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
                isLoading={isLoading}
                onSubmit={async (values) => {
                    const minPhotos = withNote ? MIN_STEP_PROOF_PHOTOS : 1;
                    const photos = (Array.isArray(values.photo) ? values.photo : [])
                        .filter((file) => !!file?.publicId)
                        .map((file) => ({ publicId: file.publicId, url: file.url }));
                    if (photos.length < minPhotos) {
                        toast.error(minPhotos > 1 ? `Upload at least ${minPhotos} photos` : "You need to add an image to submit");
                        return;
                    }
                    setIsLoading(true);
                    try {
                        await onComplete(photos, values.note?.trim() || undefined);
                        clearFormUploadedFiles("photo");
                    } catch (err) {
                        toast.error(getErrorMessage(err, "Couldn't send the photos. Please try again."));
                    } finally {
                        setIsLoading(false);
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
