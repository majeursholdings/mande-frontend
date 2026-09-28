import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrdinalDate } from "@/lib/date";
import RatingReviewForm from "@/components/form/ratingReviewForm";
import { getAdminManufacturer, getProjectLead, type AdminJob } from "@/constant/admin";
import { DetailSection } from "./detailParts";

/** A rating as five stars, read-only — with its value for screen readers. */
export function RatingStarsDisplay({ rating, className }: { rating: number; className?: string }) {
    return (
        <span className={cn("flex items-center gap-0.5", className)} role="img" aria-label={`${rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, index) => (
                <Star
                    key={index}
                    className={cn(
                        "size-5",
                        index < rating ? "fill-primary-600 text-primary-600" : "fill-mist-200 text-mist-200",
                    )}
                    strokeWidth={1.5}
                    aria-hidden
                />
            ))}
        </span>
    );
}

/** One review: the stars, who gave it and when, and what they wrote. */
function ReviewCard({ rating, comment, byline }: { rating: number; comment: string; byline: string }) {
    return (
        <div className="flex flex-col gap-2 rounded-lg bg-mist-50 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <RatingStarsDisplay rating={rating} />
                <span className="text-xs font-text text-mist-400">{byline}</span>
            </div>
            <p className="text-sm font-text whitespace-pre-line text-mist-800">{comment}</p>
        </div>
    );
}

/**
 * On a completed job, the lead's rating of the manufacturer — given as they
 * signed it off; a job approved automatically takes it here afterwards.
 */
export default function ManufacturerRating({
    job,
    canRate,
    leadNames,
    onRate,
}: {
    job: AdminJob;
    canRate: boolean;
    leadNames: string;
    onRate: (review: { rating: number; comment: string }) => void;
}) {
    const manufacturerName =
        job.manufacturerIds.map((id) => getAdminManufacturer(id)?.companyName).filter(Boolean).join(" & ") ||
        "the manufacturer";
    const review = job.manufacturerReview;

    return (
        <DetailSection title="Manufacturer rating">
            {review ? (
                <ReviewCard
                    rating={review.rating}
                    comment={review.comment}
                    byline={`${review.authorName} · ${formatOrdinalDate(new Date(review.createdAt))}`}
                />
            ) : canRate ? (
                <RatingReviewForm
                    ratingLabel="Rate this manufacturer's work"
                    submitLabel="Submit"
                    loadingLabel="Submitting..."
                    errorMessage="Couldn't save your rating. Please try again."
                    onSubmit={onRate}
                />
            ) : (
                <p className="text-sm font-text text-mist-500">
                    Not rated yet. {leadNames} can rate {manufacturerName}.
                </p>
            )}
        </DetailSection>
    );
}

/** On a completed job, what its manufacturer(s) thought of the project lead — asked for as soon as it was completed. */
export function LeadRating({ job }: { job: AdminJob }) {
    const leadName = getProjectLead(job.projectLeadIds[0])?.name ?? "the project lead";

    return (
        <DetailSection title="Project lead rating" count={job.leadReviews.length || undefined}>
            {job.leadReviews.length === 0 ? (
                <p className="text-sm font-text text-mist-500">
                    Not rated yet. The manufacturer is asked to rate {leadName} once the job is completed.
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    {job.leadReviews.map((review) => (
                        <ReviewCard
                            key={review.manufacturerId}
                            rating={review.rating}
                            comment={review.comment}
                            byline={`${getAdminManufacturer(review.manufacturerId)?.companyName ?? "Manufacturer"} rated ${
                                getProjectLead(review.leadId)?.name ?? leadName
                            } · ${formatOrdinalDate(new Date(review.createdAt))}`}
                        />
                    ))}
                </div>
            )}
        </DetailSection>
    );
}
