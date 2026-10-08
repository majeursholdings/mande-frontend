"use client";

import { ShieldAlert, ShieldCheck, UsersRound } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { getManufacturerVerification } from "@/constant/platformRecords";
import { useLeadOverview } from "@/hooks/useLeadOverview";
import { useAdminManufacturers } from "../dashboardLayout/adminManufacturersContext";
import { ReportError } from "../dashboardPage/reportStates";

/**
 * Above the project lead's manufacturers: how many there are and how many
 * they've worked with (from /reports/lead-overview), and from the list
 * itself, who's verified and whose account needs attention.
 */
export default function LeadManufacturersOverview() {
    const { overview, isLoading, isError } = useLeadOverview();
    const { manufacturers, isLoading: isListLoading } = useAdminManufacturers();
    if (isError) return <ReportError message="Couldn't load the manufacturer numbers. Please refresh to try again." />;

    const verification = manufacturers.map((manufacturer) => manufacturer.verification ?? getManufacturerVerification(manufacturer));
    const verified = verification.filter((status) => status === "verified").length;
    const awaiting = verification.filter((status) => status !== "verified" && status !== "rejected").length;
    const onHold = manufacturers.filter((manufacturer) => manufacturer.accountStatus === "flagged" || manufacturer.accountStatus === "suspended");
    const appeals = manufacturers.filter(
        (manufacturer) => manufacturer.hasPendingAppeal ?? manufacturer.appeals.some((appeal) => appeal.status === "pending"),
    ).length;

    return (
        <OverviewCardGrid columns={3}>
            <OverviewCard
                icon={UsersRound}
                label="Manufacturers on Mande"
                value={overview?.manufacturers.onPlatform.toLocaleString()}
                detail={{ label: "Worked with you", value: overview?.manufacturers.workedWithYou.toLocaleString(), tone: "green" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={ShieldCheck}
                label="Verified"
                value={verified.toLocaleString()}
                detail={{ label: "Waiting on checks", value: awaiting.toLocaleString(), tone: "amber" }}
                loading={isListLoading}
            />
            <OverviewCard
                icon={ShieldAlert}
                label="Flagged or suspended"
                value={onHold.length.toLocaleString()}
                detail={{ label: "Appeals waiting", value: appeals.toLocaleString(), tone: appeals > 0 ? "red" : "gray" }}
                loading={isListLoading}
            />
        </OverviewCardGrid>
    );
}
