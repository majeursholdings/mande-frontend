"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { getRelativeTimeLabel } from "@/lib/date";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService } from "@/lib/services/reportsService";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TOTAL_PRODUCTION_STEPS,
    getReviewStage,
    type PendingProgressReview,
} from "@/constant/admin";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import DashboardCard from "./dashboardCard";
import EmptyState from "../emptyState";
import { toPendingProgressReview } from "./dashboardStats";
import { ReportError } from "./reportStates";

/** The most the API lists at once. */
const LIMIT = 50;

// ─────────────────────────────────────────────────────────────────────────────
// PendingReviewsCard: manufacturers' progress updates waiting for an admin
// to check (from /reports/pending-reviews): a production step marked done,
// or photos of the finished furniture. Newest first, and each row says how
// long it's been waiting. The bar shows how far through production the job
// is: the same horizontal bars the design used for this spot.
// ─────────────────────────────────────────────────────────────────────────────

/** The photo sent with the update, from the job already loaded (the API's list has none). */
export default function PendingReviewsCard() {
    const { jobsUrl } = useStaffPlatform();
    const query = useQuery({
        queryKey: queryKeys.reports.pendingReviews(LIMIT),
        queryFn: () => reportsService.getPendingReviews(LIMIT),
        staleTime: 30_000,
    });
    const reviews = (query.data?.reviews ?? []).map(toPendingProgressReview);

    return (
        <DashboardCard
            title={
                <span className="flex items-center gap-2">
                    Pending Progress Reviews
                    {reviews.length > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-50 px-1.5 text-xs font-semibold text-secondary-700">
                            {reviews.length}
                        </span>
                    )}
                </span>
            }
            viewAllHref={reviews.length > 0 ? jobsUrl : undefined}
        >
            {query.isError ? (
                <ReportError message="Couldn't load the pending reviews. Please refresh to try again." />
            ) : query.isPending ? (
                <ReviewRowsSkeleton />
            ) : reviews.length === 0 ? (
                <EmptyState
                    icon={ClipboardCheck}
                    title="No Pending Reviews"
                    description="Progress updates from manufacturers will show up here"
                />
            ) : (
                <ul className="-my-3.5 flex flex-col divide-y divide-border">
                    {reviews.map((review) => (
                        <ReviewRow key={review.id} review={review} jobsUrl={jobsUrl} />
                    ))}
                </ul>
            )}
        </DashboardCard>
    );
}

function ReviewRow({ review, jobsUrl }: { review: PendingProgressReview; jobsUrl: string }) {
    const stage = getReviewStage(review);
    const percentDone = Math.round((review.stepsCompleted / TOTAL_PRODUCTION_STEPS) * 100);

    return (
        <li className="flex gap-3 py-3.5">
            <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-mist-100">
                {review.imageUrl && <Image src={review.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium font-text text-mist-950">{review.jobTitle}</p>
                        <p className="truncate text-xs font-text text-mist-500">
                            {review.manufacturerName} · {stage}
                        </p>
                    </div>
                    <Link
                        href={`${jobsUrl}?job=${encodeURIComponent((review.jobCode || review.jobId).toLowerCase())}`}
                        aria-label={`Review ${review.jobTitle}`}
                        className="shrink-0 rounded-button border border-border px-3 py-1.5 text-xs font-medium font-text text-mist-900 transition-colors duration-200 hover:border-secondary-300 hover:bg-secondary-50 hover:text-secondary-700"
                    >
                        Review
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <div
                        role="progressbar"
                        aria-label={`${review.jobTitle}: production steps done`}
                        aria-valuemin={0}
                        aria-valuemax={TOTAL_PRODUCTION_STEPS}
                        aria-valuenow={review.stepsCompleted}
                        aria-valuetext={`${review.stepsCompleted} of ${TOTAL_PRODUCTION_STEPS} steps`}
                        className="h-2 flex-1 overflow-hidden rounded-full bg-mist-100"
                    >
                        <div className="h-full rounded-full bg-error-600" style={{ width: `${percentDone}%` }} />
                    </div>
                    <span className="shrink-0 text-xs font-text text-mist-500 tabular-nums">
                        {review.stepsCompleted}/{TOTAL_PRODUCTION_STEPS} · {getRelativeTimeLabel(new Date(review.submittedAt))}
                    </span>
                </div>
            </div>
        </li>
    );
}

/** Rows the shape of ReviewRow's, while the reviews load. */
function ReviewRowsSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <ul aria-hidden className="-my-3.5 flex flex-col divide-y divide-border">
            {Array.from({ length: rows }, (_, index) => (
                <li key={index} className="flex gap-3 py-3.5">
                    <Skeleton className="size-12 shrink-0 rounded-lg" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-1 flex-col gap-1.5">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-2/5" />
                            </div>
                            {/* The Review button */}
                            <Skeleton className="h-7 w-16 shrink-0" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                </li>
            ))}
        </ul>
    );
}
