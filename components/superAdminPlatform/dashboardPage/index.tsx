import StatsGrid from "@/components/adminPlatform/dashboardPage/statsGrid";
import JobStatisticsCard from "@/components/adminPlatform/dashboardPage/jobStatisticsCard";
import JobStatusCard from "@/components/adminPlatform/dashboardPage/jobStatusCard";
import RecentTransactionsCard from "@/components/adminPlatform/dashboardPage/recentTransactionsCard";
import { SUPER_ADMIN_DASHBOARD_STAT_IDS } from "@/components/adminPlatform/dashboardPage/dashboardStats";
import ActivityLogCard from "./activityLogCard";
import PendingActionsNotice from "./pendingActionsNotice";
import { BookingsPreviewCard, ShopPreviewCard } from "./previewCards";

/**
 * The super admin's dashboard: the admin dashboard's cards across the whole
 * platform (with what it earns in place of payouts), previews of the shop
 * and machine bookings, and the activity log where the admin has progress
 * reviews.
 */
export default function SuperAdminDashboardPage() {
    return (
        <div className="flex flex-col gap-8 lg:gap-10">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Dashboard</h1>

            <PendingActionsNotice />

            <StatsGrid statIds={SUPER_ADMIN_DASHBOARD_STAT_IDS} />

            <div className="grid gap-10 md:gap-6 lg:grid-cols-[minmax(0,1fr)_20.5rem]">
                <JobStatisticsCard />
                <JobStatusCard />
            </div>

            <div className="grid gap-10 md:gap-6 xl:grid-cols-2 xl:items-start">
                <ShopPreviewCard />
                <BookingsPreviewCard />
            </div>

            {/* Each card its own height, so "Show more" on the log doesn't stretch the transactions */}
            <div className="grid gap-10 md:gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] xl:items-start">
                <RecentTransactionsCard limit={6} />
                <ActivityLogCard />
            </div>
        </div>
    );
}
