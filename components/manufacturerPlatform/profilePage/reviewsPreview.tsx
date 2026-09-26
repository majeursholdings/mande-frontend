import { Star } from "lucide-react";
import { MANUFACTURER_REVIEWS_URL, type ManufacturerReview } from "@/constant/manufacturer";
import EmptyState from "../dashboardPage/emptyState";
import ProfileSectionCard from "./profileSectionCard";
import ReviewItem from "./reviewItem";

const PREVIEW_COUNT = 3;

export default function ReviewsPreview({ reviews }: { reviews: ManufacturerReview[] }) {
    const hasReviews = reviews.length > 0;

    return (
        <ProfileSectionCard
            title="Reviews"
            viewAllHref={hasReviews ? MANUFACTURER_REVIEWS_URL : undefined}
        >
            {hasReviews ? (
                <ul className="flex flex-col gap-5">
                    {reviews.slice(0, PREVIEW_COUNT).map((review) => (
                        <li key={review.id}>
                            <ReviewItem review={review} />
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-1 items-center justify-center">
                    <EmptyState
                        icon={Star}
                        title="No Reviews"
                        description="There are no reviews to display"
                    />
                </div>
            )}
        </ProfileSectionCard>
    );
}
