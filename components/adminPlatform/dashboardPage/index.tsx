import StatsGrid from "./statsGrid";
import JobStatisticsCard from "./jobStatisticsCard";
import JobStatusCard from "./jobStatusCard";
import RecentTransactionsCard from "./recentTransactionsCard";
import PendingReviewsCard from "./pendingReviewsCard";

export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col gap-8 lg:gap-10">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Dashboard</h1>

            <StatsGrid />

            <div className="grid gap-10 md:gap-6 lg:grid-cols-[minmax(0,1fr)_20.5rem]">
                <JobStatisticsCard />
                <JobStatusCard />
            </div>

            <div className="grid gap-10 md:gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                <RecentTransactionsCard />
                <PendingReviewsCard />
            </div>
        </div>
    );
}
