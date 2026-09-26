"use client";

import { useMemo, useState } from "react";
import { getJobStatistics, type JobStatisticsRange } from "@/constant/manufacturer";
import StatsGrid from "./statsGrid";
import JobStatisticsCard from "./jobStatisticsCard";
import PerformanceCard from "./performanceCard";
import RecentJobsSection from "./recentJobsSection";

export default function ManufacDashboardPage() {
    const [range, setRange] = useState<JobStatisticsRange>("monthly");
    const stats = useMemo(() => getJobStatistics(range), [range]);

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Dashboard</h1>

            <StatsGrid />

            <div className="flex flex-col lg:flex-row gap-4">
                <JobStatisticsCard
                    range={range}
                    onRangeChange={setRange}
                    data={stats.data}
                    axisMax={stats.axisMax}
                    axisStep={stats.axisStep}
                />
                <PerformanceCard percentage={stats.performance} />
            </div>

            <RecentJobsSection />
        </div>
    );
}
