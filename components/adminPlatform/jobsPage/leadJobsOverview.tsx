"use client";

import { Briefcase, CircleCheckBig, ClipboardCheck } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { useLeadOverview } from "@/hooks/useLeadOverview";
import { formatCompactPrice, fromKobo } from "@/lib/currency";
import { ReportError } from "../dashboardPage/reportStates";

/** Above the project lead's jobs board: the jobs they lead, what's waiting for them, and what's done. */
export default function LeadJobsOverview() {
    const { overview, isLoading, isError } = useLeadOverview();
    if (isError) return <ReportError message="Couldn't load your job numbers. Please refresh to try again." />;
    const jobs = overview?.jobs;
    const jobValue = fromKobo(overview?.money.jobValueKobo ?? 0);

    return (
        <OverviewCardGrid columns={3}>
            <OverviewCard
                icon={Briefcase}
                label="Your jobs, all time"
                value={jobs?.allTime.toLocaleString()}
                detail={{ label: "Active now", value: jobs?.active.toLocaleString(), tone: "blue" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={ClipboardCheck}
                label="Finished work to review"
                value={jobs?.inReview.toLocaleString()}
                detail={{ label: "Not started yet", value: jobs?.pending.toLocaleString(), tone: "amber" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={CircleCheckBig}
                label="Completed"
                value={jobs?.completed.toLocaleString()}
                detail={{ label: "Value of your jobs", value: formatCompactPrice(jobValue), tone: "green" }}
                loading={isLoading}
            />
        </OverviewCardGrid>
    );
}
