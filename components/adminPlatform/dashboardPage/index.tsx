import LeadOverviewCards from "./leadOverviewCards";
import JobStatisticsCard from "./jobStatisticsCard";
import JobStatusCard from "./jobStatusCard";
import PendingReviewsCard from "./pendingReviewsCard";

// The project lead's dashboard: their own numbers and standing, how their
// jobs are going, and the work waiting for their review.
export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col gap-8 lg:gap-10">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Dashboard</h1>

            <LeadOverviewCards />

            <div className="grid gap-10 md:gap-6 lg:grid-cols-[minmax(0,1fr)_20.5rem]">
                <JobStatisticsCard />
                <JobStatusCard />
            </div>

            <PendingReviewsCard />
        </div>
    );
}
