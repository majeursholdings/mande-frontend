import StatsGrid from "./statsGrid";
import OpenJobsSection from "./openJobsSection";
import RecentJobsSection from "./recentJobsSection";

export default function ManufacDashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Dashboard</h1>

            <StatsGrid />

            <OpenJobsSection />

            <RecentJobsSection />
        </div>
    );
}
