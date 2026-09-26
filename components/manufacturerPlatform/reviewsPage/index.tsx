import { Star } from "lucide-react";
import { MANUFACTURER_REVIEWS } from "@/constant/manufacturer";
import EmptyState from "../dashboardPage/emptyState";
import ProfileSubpageHeader from "../profilePage/profileSubpageHeader";
import ReviewItem from "../profilePage/reviewItem";

export default function ManufacturerReviewsPage() {
    return (
        <div className="flex flex-col gap-6">
            <ProfileSubpageHeader title="Reviews" />

            {MANUFACTURER_REVIEWS.length > 0 ? (
                <ul className="flex flex-col gap-6 lg:gap-0">
                    {MANUFACTURER_REVIEWS.map((review) => (
                        <li
                            key={review.id}
                            className="lg:border-b lg:border-border lg:py-5 lg:first:pt-0"
                        >
                            <ReviewItem review={review} size="md" />
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState
                    icon={Star}
                    title="No Reviews"
                    description="There are no reviews to display"
                />
            )}
        </div>
    );
}
