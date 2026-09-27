"use client";

import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { JOB_DETAIL_PRIMARY_BUTTON_CLASS } from "@/components/manufacturerPlatform/jobDetailPage/styles";
import { toast } from "sonner";

type CompletionFormValues = {
    photo: FileList;
    note?: string;
};

const NOTE_MAX_LENGTH = 500;

const getFields = (photoLabel: string, withNote: boolean): FormFieldConfig[] => [
    {
        name: "photo",
        // Images only, up to the form's 5MB default each
        type: "image",
        label: photoLabel,
        showPreview: true,
        multiple: true,
        maxFiles: 3,
        // Keeps the submit button disabled until at least one photo is added
        validation: { required: "Upload at least one photo" },
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
                onSubmit={(values) => {
                    try {
                        const files = Array.from(values.photo ?? []);
                        if (files.length === 0) {
                            toast.error("You need to add image to submit");
                            return;
                        }
                        onComplete(
                            files.map((file) => URL.createObjectURL(file)),
                            values.note?.trim() || undefined,
                        );
                    } catch {
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
