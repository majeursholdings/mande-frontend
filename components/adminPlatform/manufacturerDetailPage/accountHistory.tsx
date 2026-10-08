"use client";

import ResponsiveTabs from "@/components/ui/responsiveTabs";
import type { ManufacturerRecord } from "@/constant/platformRecords";
import AccountIssueHistory from "./accountIssueHistory";
import ActivityHistory from "./activityHistory";

type HistoryTab = "activity" | "issues";

/**
 * The account over time, in two lists: what the manufacturer did to it
 * (activity — sign-ins, passwords, linked accounts, two-factor, bank
 * accounts), and what admins did about it (issues — flags, suspensions and
 * appeals).
 */
export default function AccountHistory({ manufacturer }: { manufacturer: ManufacturerRecord }) {
    return (
        <ResponsiveTabs<HistoryTab>
            label="Account history"
            defaultValue="activity"
            variant="segmented"
            tabs={[
                {
                    value: "activity",
                    label: "Activity history",
                    panel: <ActivityHistory manufacturerId={manufacturer.id} />,
                },
                {
                    value: "issues",
                    label: "Issue history",
                    panel: <AccountIssueHistory manufacturer={manufacturer} />,
                },
            ]}
        />
    );
}
