"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import { MANUFACTURER_REVIEWS, type ManufacturerReview } from "@/constant/manufacturer";
import EmptyState from "../dashboardPage/emptyState";
import PageHeader from "../pageHeader";
import ReviewItem from "./reviewItem";
import ReviewsOverviewCards from "./reviewsOverviewCards";

export default function ManufacturerReviewsPage() {
    const { data, isPending } = useQuery({
        queryKey: queryKeys.jobs.reviews(),
        queryFn: () => jobsService.getReviews(),
    });

    const reviews: ManufacturerReview[] = useMemo(() => {
        if (data?.reviews && data.reviews.length > 0) {
            return data.reviews.map((r) => ({
                id: r.id,
                customerName: r.author || "Project Lead",
                rating: r.rating,
                comment: r.comment,
            }));
        }
        return isPending ? [] : MANUFACTURER_REVIEWS;
    }, [data, isPending]);

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="Reviews" />

            <ReviewsOverviewCards overview={data?.overview} isPending={isPending} />

            {isPending ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5 animate-pulse">
                            <div className="flex items-center justify-between">
                                <div className="h-4 w-32 rounded bg-mist-200" />
                                <div className="h-4 w-20 rounded bg-mist-100" />
                            </div>
                            <div className="h-3.5 w-full rounded bg-mist-100" />
                            <div className="h-3.5 w-2/3 rounded bg-mist-100" />
                        </div>
                    ))}
                </div>
            ) : reviews.length > 0 ? (
                <ul className="flex flex-col gap-6 lg:gap-0 bg-white border border-border rounded-xl p-5 lg:p-6 divide-y divide-border">
                    {reviews.map((review) => (
                        <li
                            key={review.id}
                            className="py-5 first:pt-0 last:pb-0"
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
