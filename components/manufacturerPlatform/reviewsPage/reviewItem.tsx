import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/customTable/ratingStars";
import { formatOrdinalDate } from "@/lib/date";
import type { ManufacturerReview } from "@/constant/manufacturer";

/** A review, with the job it was for and when it was left when those are known. */
export type ReviewItemData = ManufacturerReview & { jobTitle?: string | null; createdAt?: string | null };

/** One customer review — "sm" in the profile card, "md" on the reviews page. */
export default function ReviewItem({
    review,
    size = "sm",
}: {
    review: ReviewItemData;
    size?: "sm" | "md";
}) {
    return (
        <article className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
                <h3
                    className={cn(
                        "font-medium font-text text-mist-950",
                        size === "md" ? "text-sm lg:text-base" : "text-sm",
                    )}
                >
                    {review.customerName}
                </h3>
                <div className="shrink-0">
                    <RatingStars value={review.rating} />
                    <span className="sr-only">{review.rating} out of 5 stars</span>
                </div>
            </div>
            {(review.jobTitle || review.createdAt) && (
                <p className="text-xs font-text text-mist-400">
                    {review.jobTitle && <span className="text-mist-600">{review.jobTitle}</span>}
                    {review.jobTitle && review.createdAt && <span aria-hidden> · </span>}
                    {review.createdAt && formatOrdinalDate(new Date(review.createdAt))}
                </p>
            )}
            <p
                className={cn(
                    "font-text text-mist-600 leading-5",
                    size === "md" ? "text-xs lg:text-sm" : "text-xs",
                )}
            >
                {review.comment}
            </p>
        </article>
    );
}

/** A ReviewItem while the reviews load. */
export function ReviewItemSkeleton() {
    return (
        <div aria-hidden className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
        </div>
    );
}
