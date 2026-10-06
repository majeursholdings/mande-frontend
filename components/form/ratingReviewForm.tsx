"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { useController, useForm, useWatch, type Control } from "react-hook-form";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";

import { API_PHOTO_ACCEPT, DEFAULT_MAX_FILE_SIZE_MB } from "@/components/form/fileRules";
import { cleanupFormFieldUploads, clearFormUploadedFiles } from "@/components/form/fileInput";
import type { AdminJobAttachment } from "@/constant/admin";

export type RatingReview = {
    rating: number;
    comment: string;
    clientProofs?: AdminJobAttachment[];
};

type RatingReviewFormValues = {
    rating: number;
    comment: string;
    clientProofs?: FileList | File[] | null;
};

const MAX_RATING = 5;
const RATING_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];
export const REVIEW_MAX_LENGTH = 120;

// ─────────────────────────────────────────────────────────────────────────────
// RatingReviewForm — five stars and a short review: a lead rating a
// manufacturer's work (as they sign off a job), and a manufacturer rating
// the job's project lead. The button stays off until both are given, and its
// label can follow the rating (e.g. a low one holds the job instead).
// ─────────────────────────────────────────────────────────────────────────────

export default function RatingReviewForm({
    ratingLabel,
    placeholder = "Give reasons for your rating above",
    submitLabel,
    loadingLabel,
    errorMessage,
    withClientProof = false,
    onSubmit,
}: {
    /** Over the stars, e.g. "Rate this manufacturer's work". */
    ratingLabel: string;
    placeholder?: string;
    /** The button's label for the chosen rating (0 before one's chosen). */
    submitLabel: string | ((rating: number) => string);
    loadingLabel: string;
    /** Shown if saving fails. */
    errorMessage: string;
    /** Require uploading client delivery proof (signed waybill, handover photo). */
    withClientProof?: boolean;
    onSubmit: (review: RatingReview) => void | Promise<void>;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<RatingReviewFormValues>({
        mode: "onTouched",
        defaultValues: { rating: 0, comment: "", clientProofs: null },
    });
    const rating = useWatch({ control: methods.control, name: "rating" });

    const fields: FormFieldConfig[] = [
        {
            name: "comment",
            type: "textarea",
            label: "Review",
            placeholder,
            height: 88,
            validation: {
                required: "Give a reason for your rating",
                validate: (value: string) => value.trim().length > 0 || "Give a reason for your rating",
                maxLength: { value: REVIEW_MAX_LENGTH, message: `Keep it under ${REVIEW_MAX_LENGTH} characters` },
            },
        },
        ...(withClientProof
            ? [
                  {
                      name: "clientProofs",
                      type: "image" as const,
                      label: (
                          <>
                              Client delivery proof{" "}
                              <span className="font-normal text-mist-500">(signed waybill, site handover photo)</span>
                          </>
                      ),
                      description: `Photo or document confirming client received delivery: JPG, PNG or WebP, up to ${DEFAULT_MAX_FILE_SIZE_MB}MB`,
                      accept: API_PHOTO_ACCEPT,
                      multiple: true,
                      maxFiles: 5,
                      uploadPurpose: "review-attachment" as const,
                  },
              ]
            : []),
    ];

    const handleSubmit = async ({ rating, comment, clientProofs }: RatingReviewFormValues) => {
        setIsLoading(true);
        try {
            const proofs: AdminJobAttachment[] = Array.from((clientProofs as Array<Record<string, unknown> | File>) ?? []).map((file) => {
                if (file && typeof file === "object" && "url" in file && typeof file.url === "string") {
                    const f = file as { name?: string; originalName?: string; url: string; publicId?: string };
                    return {
                        name: f.originalName || f.name || "delivery-proof",
                        url: f.url,
                        kind: "image" as const,
                        publicId: f.publicId,
                    };
                }
                if (file instanceof File) {
                    return { name: file.name, url: URL.createObjectURL(file), kind: "image" as const };
                }
                return { name: "delivery-proof", url: "", kind: "image" as const };
            });

            if (withClientProof && proofs.length === 0) {
                toast.error("Please upload at least one delivery proof from the client (signed waybill or photo).");
                setIsLoading(false);
                return;
            }

            await onSubmit({ rating, comment: comment.trim(), clientProofs: proofs });
            if (withClientProof) {
                clearFormUploadedFiles("clientProofs");
            }
        } catch (err: unknown) {
            if (withClientProof) {
                await Promise.allSettled([cleanupFormFieldUploads("clientProofs")]);
            }
            const message = getErrorMessage(err, errorMessage);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <StarRatingInput control={methods.control} label={ratingLabel} />
            <MainForm<RatingReviewFormValues>
                methods={methods}
                fields={fields}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                hideRequiredMarks
                renderFooter={({ isLoading, canSubmit }) => (
                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading || !canSubmit || rating === 0}
                            className={cn(
                                "h-11 gap-2 rounded-button bg-secondary-700 px-5 text-sm font-medium font-text text-white transition-colors duration-300 hover:bg-secondary-900 cursor-pointer",
                                // Stays red while saving; only an idle, disabled button turns grey
                                !isLoading && "disabled:bg-mist-200 disabled:opacity-100",
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    {loadingLabel}
                                </>
                            ) : typeof submitLabel === "function" ? (
                                submitLabel(rating)
                            ) : (
                                submitLabel
                            )}
                        </Button>
                    </div>
                )}
            />
        </div>
    );
}

/** Five big stars as a radio group — click one, or use the arrow keys. */
function StarRatingInput({ control, label }: { control: Control<RatingReviewFormValues>; label: ReactNode }) {
    const { field } = useController({ control, name: "rating", rules: { min: 1 } });
    const [hovered, setHovered] = useState(0);
    const shown = hovered || field.value;

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step =
            event.key === "ArrowRight" || event.key === "ArrowUp"
                ? 1
                : event.key === "ArrowLeft" || event.key === "ArrowDown"
                  ? -1
                  : 0;
        if (!step) return;
        event.preventDefault();
        field.onChange(Math.min(MAX_RATING, Math.max(1, (field.value || 0) + step)));
    };

    return (
        <div className="flex flex-col gap-3">
            <span id="rating-label" className="text-sm font-medium font-text text-mist-900">
                {label}
            </span>
            <div
                role="radiogroup"
                aria-labelledby="rating-label"
                onKeyDown={handleKeyDown}
                onMouseLeave={() => setHovered(0)}
                className="flex items-center justify-between px-2"
            >
                {Array.from({ length: MAX_RATING }, (_, index) => {
                    const value = index + 1;
                    return (
                        <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={field.value === value}
                            aria-label={`${value} star${value === 1 ? "" : "s"}, ${RATING_LABELS[index]}`}
                            // One tab stop for the group, on the chosen star (or the first)
                            tabIndex={field.value === value || (field.value === 0 && value === 1) ? 0 : -1}
                            onClick={() => field.onChange(value)}
                            onMouseEnter={() => setHovered(value)}
                            className="rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-secondary-300 cursor-pointer"
                        >
                            <Star
                                className={cn(
                                    "size-9 transition-colors duration-150",
                                    value <= shown ? "fill-primary-600 text-primary-600" : "fill-mist-200 text-mist-200",
                                )}
                                strokeWidth={1.5}
                            />
                        </button>
                    );
                })}
            </div>
            <span className="h-4 text-center text-xs font-text text-mist-500" aria-live="polite">
                {shown > 0 ? RATING_LABELS[shown - 1] : ""}
            </span>
        </div>
    );
}
