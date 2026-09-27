"use client";

import { useState, type KeyboardEvent } from "react";
import { useController, useForm, useWatch, type Control } from "react-hook-form";
import { Star } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { cn } from "@/lib/utils";
import { FormSubmitButton } from "./formButtons";

type ManufacturerReviewValues = {
    rating: number;
    comment: string;
};

const MAX_RATING = 5;
const RATING_LABELS = ["Poor", "Fair", "Good", "Very good", "Excellent"];

const FIELDS: FormFieldConfig[] = [
    {
        name: "comment",
        type: "textarea",
        label: "Your review",
        placeholder: "How did the manufacturer do — quality, timing, communication?",
        rows: 3,
        validation: {
            required: "Write a short review",
            validate: (value: string) => value.trim().length > 0 || "Write a short review",
            maxLength: { value: 500, message: "Keep it under 500 characters" },
        },
    },
];

/** The lead's star rating and review of the manufacturer, once a job is completed. */
export default function ManufacturerReviewForm({
    manufacturerName,
    onSubmit,
}: {
    manufacturerName: string;
    onSubmit: (review: ManufacturerReviewValues) => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<ManufacturerReviewValues>({ defaultValues: { rating: 0, comment: "" } });
    const rating = useWatch({ control: methods.control, name: "rating" });

    const handleSubmit = async ({ rating, comment }: ManufacturerReviewValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate saving the review
            await new Promise((resolve) => setTimeout(resolve, 600));
            onSubmit({ rating, comment: comment.trim() });
        } catch {
            toast.error("Couldn't save your review. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ManufacturerReviewValues>
            methods={methods}
            fields={FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            className="gap-4"
            footerSlot={<StarRatingInput control={methods.control} label={`Rate ${manufacturerName}`} />}
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end">
                    <FormSubmitButton
                        label="Submit review"
                        loadingLabel="Submitting..."
                        isLoading={isLoading}
                        disabled={!canSubmit || rating === 0}
                        className="h-9 w-auto px-4"
                    />
                </div>
            )}
        />
    );
}

/** Five stars as a radio group — click, or use the arrow keys. */
function StarRatingInput({ control, label }: { control: Control<ManufacturerReviewValues>; label: string }) {
    const { field } = useController({ control, name: "rating", rules: { min: 1 } });
    const [hovered, setHovered] = useState(0);
    const shown = hovered || field.value;

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        field.onChange(Math.min(MAX_RATING, Math.max(1, (field.value || 0) + step)));
    };

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium font-text text-[#1F2937]">{label}</span>
            <div className="flex items-center gap-3">
                <div
                    role="radiogroup"
                    aria-label={label}
                    onKeyDown={handleKeyDown}
                    onMouseLeave={() => setHovered(0)}
                    className="flex items-center gap-1"
                >
                    {Array.from({ length: MAX_RATING }, (_, index) => {
                        const value = index + 1;
                        return (
                            <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={field.value === value}
                                aria-label={`${value} star${value === 1 ? "" : "s"} — ${RATING_LABELS[index]}`}
                                // One tab stop for the group, on the chosen star (or the first)
                                tabIndex={field.value === value || (field.value === 0 && value === 1) ? 0 : -1}
                                onClick={() => field.onChange(value)}
                                onMouseEnter={() => setHovered(value)}
                                className="rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-secondary-300 cursor-pointer"
                            >
                                <Star
                                    className={cn(
                                        "size-6 transition-colors",
                                        value <= shown ? "fill-amber-400 text-amber-400" : "text-mist-200",
                                    )}
                                />
                            </button>
                        );
                    })}
                </div>
                {shown > 0 && <span className="text-sm font-text text-mist-600">{RATING_LABELS[shown - 1]}</span>}
            </div>
        </div>
    );
}
