"use client";

import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { JOB_DETAIL_PRIMARY_BUTTON_CLASS } from "@/components/manufacturerPlatform/jobDetailPage/styles";
import { toast } from "sonner";

type CompletionFormValues = {
    photo: FileList;
};

const FIELDS: FormFieldConfig[] = [
    {
        name: "photo",
        type: "image",
        label: "Furniture photo",
        accept: "image/*",
        showPreview: true,
        multiple: true,
        maxFiles: 3,
        maxSizeMB: 5,
        // Keeps the submit button disabled until at least one photo is added
        validation: { required: "Upload at least one photo" },
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailCompletionUpload — shown once every production step is ticked
// off. Submitting the photo is the "mark as done" action: it's what actually
// sends the job for review, so there's no separate confirm step on top of it.
// Also reused, with different copy, to resubmit a rejected job with new proof.
// ─────────────────────────────────────────────────────────────────────────────

export default function JobDetailCompletionUpload({
    onComplete,
    title = "Production complete",
    description = "Upload a photo of the finished furniture to mark this job as done.",
    submitLabel = "Mark as done",
}: {
    onComplete: (imageUrls: string[]) => void;
    title?: string;
    description?: string;
    submitLabel?: string;
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
                fields={FIELDS}
                submitLabel={submitLabel}
                onSubmit={(values) => {
                    try {
                        const files = Array.from(values.photo ?? []);
                        if (files.length === 0) {
                            toast.error("You need to add image to submit");
                            return;
                        }
                        onComplete(files.map((file) => URL.createObjectURL(file)));
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
