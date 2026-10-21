"use client";

import { CreditCard, ShieldAlert, ShieldCheck, UsersRound } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { getManufacturerVerification } from "@/constant/platformRecords";
import { usePlans } from "@/hooks/usePlans";
import { useAdminManufacturers } from "../dashboardLayout/adminManufacturersContext";
import { ReportError } from "../dashboardPage/reportStates";

/**
 * Above the super admin's manufacturers, from the list itself: how many
 * there are, who's verified, whose account needs attention, and who pays
 * for a plan.
 */
export default function SuperAdminManufacturersOverview() {
    const { manufacturers, isLoading, isError } = useAdminManufacturers();
    const { getPlan, isLoading: isPlansLoading, isError: isPlansError } = usePlans();
    if (isError || isPlansError) {
        return <ReportError message="Couldn't load the manufacturer numbers. Please refresh to try again." />;
    }

    const deletionRequests = manufacturers.filter((manufacturer) => !!manufacturer.deletionRequest).length;
    const verification = manufacturers.map((manufacturer) => manufacturer.verification ?? getManufacturerVerification(manufacturer));
    const verified = verification.filter((status) => status === "verified").length;
    const awaiting = verification.filter((status) => status !== "verified" && status !== "rejected").length;
    const onHold = manufacturers.filter(
        (manufacturer) => manufacturer.accountStatus === "flagged" || manufacturer.accountStatus === "suspended",
    ).length;
    const appeals = manufacturers.filter(
        (manufacturer) => manufacturer.hasPendingAppeal ?? (manufacturer.appeals ?? []).some((appeal) => appeal.status === "pending"),
    ).length;
    // A plan with a price, whatever the billing cycle
    const onPaidPlan = manufacturers.filter((manufacturer) => {
        const plan = getPlan(manufacturer.subscription?.planId);
        return !!plan && (plan.monthlyPrice > 0 || plan.annualPrice > 0);
    });
    const overdue = onPaidPlan.filter((manufacturer) => manufacturer.subscription?.status === "past_due").length;

    return (
        <OverviewCardGrid>
            <OverviewCard
                icon={UsersRound}
                label="Manufacturers"
                value={manufacturers.length.toLocaleString()}
                detail={{
                    label: "Asked to close",
                    value: deletionRequests.toLocaleString(),
                    tone: deletionRequests > 0 ? "red" : "gray",
                }}
                loading={isLoading}
            />
            <OverviewCard
                icon={ShieldCheck}
                label="Verified"
                value={verified.toLocaleString()}
                detail={{ label: "Waiting on checks", value: awaiting.toLocaleString(), tone: "amber" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={ShieldAlert}
                label="Flagged or suspended"
                value={onHold.toLocaleString()}
                detail={{ label: "Appeals waiting", value: appeals.toLocaleString(), tone: appeals > 0 ? "red" : "gray" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={CreditCard}
                label="On a paid plan"
                value={onPaidPlan.length.toLocaleString()}
                detail={{ label: "Payment overdue", value: overdue.toLocaleString(), tone: overdue > 0 ? "red" : "gray" }}
                loading={isLoading || isPlansLoading}
            />
        </OverviewCardGrid>
    );
}
