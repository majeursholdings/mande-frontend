"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MessageSquareWarning, Star, ThumbsUp } from "lucide-react";
import AdminPageHeader from "@/components/adminPlatform/pageHeader";
import DashboardCard from "@/components/adminPlatform/dashboardPage/dashboardCard";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import MotionBarChart from "@/components/common/charts/motionBarChart";
import ResponsiveTabs from "@/components/ui/responsiveTabs";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService, type JobReviewKind, type JobReviewSummary } from "@/lib/services/reportsService";
import JobReviewsTable from "./jobReviewsTable";

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminJobReviewPage: what people said about each other on jobs, in two
// tabs: manufacturer reviews (a project lead's rating of the manufacturer at
// sign-off, including ones under the threshold held for a super admin), and
// project lead reviews (each manufacturer's rating of the lead once the job
// is done). Each tab has its numbers, how the stars spread, and every review
// to search, filter and sort (/reports/job-reviews and its summary).
// A sub page of Jobs; the jobs' money is in Reporting.
// ─────────────────────────────────────────────────────────────────────────────

/** warning-500: the stars. */
const STAR_COLOR = "#f59e0b";

export default function SuperAdminJobReviewPage() {
    const summaryQuery = useQuery({
        queryKey: queryKeys.reports.jobReviewSummary(),
        queryFn: () => reportsService.getJobReviewSummary(),
        staleTime: 30_000,
    });

    return (
        <div className="flex flex-col gap-6">
            <AdminPageHeader
                title="Job review"
                description="How manufacturers and project leads rate each other on jobs: leads rate the manufacturer's work at sign-off, and manufacturers rate their lead once the job is done."
            />

            <ResponsiveTabs<JobReviewKind>
                label="Reviews"
                defaultValue="manufacturer"
                tabs={[
                    {
                        value: "manufacturer",
                        label: "Manufacturer reviews",
                        panel: <ReviewsPanel kind="manufacturer" summary={summaryQuery.data} loading={summaryQuery.isPending} error={summaryQuery.isError} />,
                    },
                    {
                        value: "lead",
                        label: "Project lead reviews",
                        panel: <ReviewsPanel kind="lead" summary={summaryQuery.data} loading={summaryQuery.isPending} error={summaryQuery.isError} />,
                    },
                ]}
            />
        </div>
    );
}

/** One kind's numbers, its stars as bars, and its reviews. */
function ReviewsPanel({
    kind,
    summary,
    loading,
    error,
}: {
    kind: JobReviewKind;
    summary: JobReviewSummary | undefined;
    loading: boolean;
    error: boolean;
}) {
    const totals = summary?.[kind];
    const isManufacturer = kind === "manufacturer";
    const count = totals?.count ?? 0;
    const distribution = totals?.distribution ?? [0, 0, 0, 0, 0];
    const happy = distribution[3] + distribution[4];
    const share = (part: number) => (count === 0 ? "0%" : `${Math.round((part / count) * 100)}%`);
    const bars = distribution.map((reviews, index) => ({ label: `${index + 1} star${index === 0 ? "" : "s"}`, reviews }));
    const flagged = summary ? (isManufacturer ? summary.manufacturer.held : summary.lead.followedUp) : 0;

    return (
        <div className="flex flex-col gap-6 pt-6">
            {error ? (
                <ReportError message="Couldn't load the review numbers. Please refresh to try again." />
            ) : (
                <OverviewCardGrid columns={4}>
                    <OverviewCard
                        icon={Star}
                        label="Average rating"
                        value={totals?.average === null || totals?.average === undefined ? "None yet" : `${totals.average.toFixed(1)} / 5`}
                        detail={{ label: "Reviews", value: count.toLocaleString(), tone: "blue" }}
                        loading={loading}
                    />
                    <OverviewCard
                        icon={ThumbsUp}
                        label="Rated 4 or 5"
                        value={happy.toLocaleString()}
                        detail={{ label: "Of all reviews", value: share(happy), tone: "green" }}
                        loading={loading}
                    />
                    <OverviewCard
                        icon={MessageSquareWarning}
                        label="Rated 2 or under"
                        value={(totals?.low ?? 0).toLocaleString()}
                        detail={{
                            label: isManufacturer ? "Held for sign-off" : "Followed up",
                            value: flagged.toLocaleString(),
                            tone: isManufacturer && flagged > 0 ? "red" : "gray",
                        }}
                        loading={loading}
                    />
                    <OverviewCard
                        icon={CalendarDays}
                        label="This month"
                        value={(totals?.thisMonth ?? 0).toLocaleString()}
                        detail={{ label: "Of all reviews", value: share(totals?.thisMonth ?? 0), tone: "amber" }}
                        loading={loading}
                    />
                </OverviewCardGrid>
            )}

            {!error && (
                <DashboardCard title="How the stars spread">
                    <MotionBarChart
                        data={bars}
                        series={[{ label: "Reviews", color: STAR_COLOR, value: (bar) => bar.reviews }]}
                        xLabel="Rating"
                        yLabel="Reviews"
                        formatTick={(value) => value.toLocaleString()}
                        formatValue={(value) => value.toLocaleString()}
                        height={200}
                        loading={loading}
                        emptyMessage="No reviews yet."
                        animationKey={kind}
                        caption={isManufacturer ? "Manufacturer reviews by rating" : "Project lead reviews by rating"}
                    />
                </DashboardCard>
            )}

            <JobReviewsTable kind={kind} />
        </div>
    );
}
