"use client";

import { Briefcase, CircleCheckBig, Hammer, Wallet } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import type { AdminJobStatus } from "@/constant/admin";
import { formatCompactPrice, formatPrice } from "@/lib/currency";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import { ReportError } from "../dashboardPage/reportStates";

/** Above the super admin's jobs board: every job on the platform, by where it is, and what they're worth. */
export default function SuperAdminJobsOverview() {
    const { jobs, isLoading, isError } = useAdminJobs();
    if (isError) return <ReportError message="Couldn't load the job numbers. Please refresh to try again." />;

    const count = (status: AdminJobStatus) => jobs.filter((job) => job.status === status).length.toLocaleString();
    const totalValue = jobs.reduce((sum, job) => sum + job.amount, 0);
    const completedValue = jobs.filter((job) => job.status === "completed").reduce((sum, job) => sum + job.amount, 0);

    return (
        <OverviewCardGrid>
            <OverviewCard
                icon={Briefcase}
                label="All jobs"
                value={jobs.length.toLocaleString()}
                detail={{ label: "Pending", value: count("pending"), tone: "gray" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={Hammer}
                label="In progress"
                value={count("in-progress")}
                detail={{ label: "In review", value: count("in-review"), tone: "blue" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={CircleCheckBig}
                label="Completed"
                value={count("completed")}
                detail={{ label: "Rejected", value: count("rejected"), tone: "red" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={Wallet}
                label="Value of jobs"
                value={formatCompactPrice(totalValue)}
                fullValue={formatPrice(totalValue)}
                detail={{ label: "Completed", value: formatCompactPrice(completedValue), tone: "green" }}
                loading={isLoading}
            />
        </OverviewCardGrid>
    );
}
