"use client";

import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { getRelativeTimeLabel } from "@/lib/date";
import {
    ADMIN_JOBS_URL,
    TOTAL_PRODUCTION_STEPS,
    getReviewStage,
    type PendingProgressReview,
} from "@/constant/admin";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import DashboardCard from "./dashboardCard";
import EmptyState from "../emptyState";
import { getPendingProgressReviews } from "./dashboardStats";

// ─────────────────────────────────────────────────────────────────────────────
// PendingReviewsCard — manufacturers' progress updates waiting for an admin
// to check: a production step marked done, or photos of the finished
// furniture. Newest first, and each row says how long it's been waiting. The
// bar shows how far through production the job is — the same horizontal bars
// the design used for this spot.
// ─────────────────────────────────────────────────────────────────────────────

export default function PendingReviewsCard() {
    const { jobs } = useAdminJobs();
    const reviews = getPendingProgressReviews(jobs);

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
            viewAllHref={reviews.length > 0 ? ADMIN_JOBS_URL : undefined}
        >
            {reviews.length === 0 ? (
                <EmptyState
                    icon={ClipboardCheck}
                    title="No Pending Reviews"
                    description="Progress updates from manufacturers will show up here"
                />
            ) : (
                <ul className="-my-3.5 flex flex-col divide-y divide-border">
                    {reviews.map((review) => (
                        <ReviewRow key={review.id} review={review} />
                    ))}
                </ul>
            )}
        </DashboardCard>
    );
}

function ReviewRow({ review }: { review: PendingProgressReview }) {
    const stage = getReviewStage(review);
    const percentDone = Math.round((review.stepsCompleted / TOTAL_PRODUCTION_STEPS) * 100);

    return (
        <li className="flex gap-3 py-3.5">
            <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-mist-100">
                <Image src={review.imageUrl} alt="" fill sizes="48px" className="object-cover" />
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
                        href={`${ADMIN_JOBS_URL}?job=${review.jobId}`}
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
