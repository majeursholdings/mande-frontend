"use client";

import { CircleCheckBig, Hammer, ShieldUser, Star } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import { useProjectLeads } from "@/components/adminPlatform/dashboardLayout/useProjectLeads";
import { SUPER_ADMIN_JOB_REVIEW_URL } from "@/constant/superAdmin";

/** Above the project leads: how many there are, the jobs they lead and finish, and how they're rated. */
export default function SuperAdminProjectLeadsOverview() {
    const { leads, isLoading, isError } = useProjectLeads({ status: "all" });
    if (isError) return <ReportError message="Couldn't load the project lead numbers. Please refresh to try again." />;

    const deactivated = leads.filter((lead) => lead.status === "deactivated").length;
    const activeJobs = leads.reduce((sum, lead) => sum + (lead.activeJobsCount ?? 0), 0);
    const withoutJobs = leads.filter((lead) => lead.status !== "deactivated" && !lead.activeJobsCount).length;
    const completedJobs = leads.reduce((sum, lead) => sum + (lead.completedJobsCount ?? 0), 0);
    const perLead = leads.length ? Math.round((completedJobs / leads.length) * 10) / 10 : 0;
    const ratings = leads.flatMap((lead) => (lead.averageRating ? [lead.averageRating] : []));
    const averageRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;

    return (
        <OverviewCardGrid>
            <OverviewCard
                icon={ShieldUser}
                label="Project leads"
                value={leads.length.toLocaleString()}
                detail={{ label: "Deactivated", value: deactivated.toLocaleString(), tone: "gray" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={Hammer}
                label="Active jobs led"
                value={activeJobs.toLocaleString()}
                detail={{ label: "Leads with none", value: withoutJobs.toLocaleString(), tone: "amber" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={CircleCheckBig}
                label="Jobs completed"
                value={completedJobs.toLocaleString()}
                detail={{ label: "Per lead", value: perLead.toLocaleString(), tone: "green" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={Star}
                label="Average rating"
                value={averageRating === null ? "None yet" : averageRating.toFixed(1)}
                detail={{ label: "Not rated yet", value: (leads.length - ratings.length).toLocaleString(), tone: "gray" }}
                href={SUPER_ADMIN_JOB_REVIEW_URL}
                loading={isLoading}
            />
        </OverviewCardGrid>
    );
}
