"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import EmptyState from "../dashboardPage/emptyState";
import PageHeader from "../pageHeader";
import ReviewItem, { ReviewItemSkeleton, type ReviewItemData } from "./reviewItem";
import LoadError from "../loadError";
import ReviewsOverviewCards from "./reviewsOverviewCards";

export default function ManufacturerReviewsPage() {
    const { data, isPending, isError } = useQuery({
        queryKey: queryKeys.jobs.reviews(),
        queryFn: () => jobsService.getReviews(),
    });

    const reviews: ReviewItemData[] = useMemo(() => {
        return (data?.reviews ?? []).map((r) => ({
            id: r.id,
            // A role label, not a name: shown when the review has no author on record
            customerName: r.author || "Project lead",
            rating: r.rating,
            comment: r.comment,
            jobTitle: r.jobTitle || null,
            createdAt: r.createdAt || null,
        }));
    }, [data]);

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="Reviews" />

            {!isError && <ReviewsOverviewCards overview={data?.overview} isPending={isPending} />}

            {isError ? (
                <LoadError>Couldn&apos;t load your reviews. Please refresh the page to try again.</LoadError>
            ) : isPending ? (
                <ul className="flex flex-col gap-6 lg:gap-0 bg-white border border-border rounded-xl p-5 lg:p-6 divide-y divide-border">
                    {[1, 2, 3].map((i) => (
                        <li key={i} className="py-5 first:pt-0 last:pb-0">
                            <ReviewItemSkeleton />
                        </li>
                    ))}
                </ul>
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
