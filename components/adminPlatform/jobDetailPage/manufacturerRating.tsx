import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrdinalDate } from "@/lib/date";
import { getAdminManufacturer, type AdminJob } from "@/constant/admin";
import ManufacturerReviewForm from "@/components/adminPlatform/form/manufacturerReviewForm";
import { DetailSection } from "./detailParts";

/**
 * On a completed job, the lead's star rating and review of the manufacturer
 * — the form until it's given, then the rating itself.
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
                <div className="flex flex-col gap-2 rounded-lg bg-mist-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-0.5" role="img" aria-label={`${review.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }, (_, index) => (
                                <Star
                                    key={index}
                                    className={cn(
                                        "size-5",
                                        index < review.rating ? "fill-amber-400 text-amber-400" : "text-mist-200",
                                    )}
                                    aria-hidden
                                />
                            ))}
                        </span>
                        <span className="text-xs font-text text-mist-400">
                            {review.authorName} · {formatOrdinalDate(new Date(review.createdAt))}
                        </span>
                    </div>
                    <p className="text-sm font-text whitespace-pre-line text-mist-800">{review.comment}</p>
                </div>
            ) : canRate ? (
                <ManufacturerReviewForm manufacturerName={manufacturerName} onSubmit={onRate} />
            ) : (
                <p className="text-sm font-text text-mist-500">
                    Not rated yet — {leadNames} can rate {manufacturerName}.
                </p>
            )}
        </DetailSection>
    );
}
