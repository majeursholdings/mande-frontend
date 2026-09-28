"use client";

import { useState } from "react";
import { PauseCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrdinalDate } from "@/lib/date";
import type { Job } from "@/constant/manufacturer";
import LeadReviewDialog from "../leadReviewDialog";
import { useLeadReviews } from "../dashboardLayout/leadReviewsContext";

/**
 * On a completed job: their rating of the project lead — or, until they've
 * given it, a way to (the prompt that opens as the job completes can be put
 * off).
 */
export default function JobDetailLeadReview({ job }: { job: Job }) {
    const { getLeadReview } = useLeadReviews();
    const [isRating, setIsRating] = useState(false);
    const review = getLeadReview(job.id);
    const leadName = job.assignee?.name ?? "your project lead";
    if (!job.leadId) return null;

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold font-text text-mist-950">Your rating of {leadName}</h3>
            {review ? (
                <div className="flex flex-col gap-2 rounded-xl border border-border bg-mist-50 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-0.5" role="img" aria-label={`${review.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }, (_, index) => (
                                <Star
                                    key={index}
                                    className={cn(
                                        "size-4.5",
                                        index < review.rating ? "fill-primary-600 text-primary-600" : "fill-mist-200 text-mist-200",
                                    )}
                                    strokeWidth={1.5}
                                    aria-hidden
                                />
                            ))}
                        </span>
                        <span className="text-xs font-text text-mist-400">{formatOrdinalDate(new Date(review.createdAt))}</span>
                    </div>
                    <p className="text-sm font-text text-mist-800">{review.comment}</p>
                </div>
            ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3.5">
                    <p className="text-sm font-text text-mist-600">How was {leadName} to work with on this job?</p>
                    <button
                        type="button"
                        onClick={() => setIsRating(true)}
                        className="shrink-0 rounded-button bg-secondary-700 px-3.5 py-2 text-xs font-medium font-text text-white transition-colors hover:bg-secondary-900 cursor-pointer"
                    >
                        Rate {leadName}
                    </button>
                </div>
            )}
            <LeadReviewDialog job={job} open={isRating} onOpenChange={setIsRating} />
        </div>
    );
}

/** Finished work the lead held for a second look: it's with Mande, not them. */
export function HeldForReviewNote() {
    return (
        <div role="status" className="flex gap-3 rounded-xl border border-warning-200 bg-warning-50/60 p-4">
            <PauseCircle className="size-5 shrink-0 text-warning-600" strokeWidth={1.75} aria-hidden />
            <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold font-text text-mist-950">Taking a second look</p>
                <p className="text-xs font-text text-mist-600">
                    Your project lead has asked Mande to review the finished work further. It&apos;s signed off, or sent
                    back with what to fix, once that&apos;s done. You don&apos;t need to do anything yet.
                </p>
            </div>
        </div>
    );
}
