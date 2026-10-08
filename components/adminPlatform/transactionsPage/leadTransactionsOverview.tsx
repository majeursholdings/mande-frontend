"use client";

import { Ban, Hourglass, HandCoins, Wallet } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { useLeadOverview } from "@/hooks/useLeadOverview";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import { ReportError } from "../dashboardPage/reportStates";

/**
 * Above a project lead's transactions: the money on the jobs they lead only.
 * What the jobs are worth, what's been paid to manufacturers, what's still to
 * pay on jobs underway, and what manufacturers were charged for rejected work.
 */
export default function LeadTransactionsOverview() {
    const { overview, isLoading, isError } = useLeadOverview();
    if (isError) return <ReportError message="Couldn't load your totals. Please refresh to try again." />;

    const money = overview?.money;
    const naira = (kobo: number | undefined) => ({ value: formatCompactPrice(fromKobo(kobo ?? 0)), full: formatPrice(fromKobo(kobo ?? 0)) });
    const total = naira(money?.jobValueKobo);
    const paid = naira(money?.paidOutKobo);
    const pending = naira(money?.pendingKobo);
    const charges = naira(money?.chargesKobo);

    return (
        <OverviewCardGrid>
            <OverviewCard
                icon={Wallet}
                label="Value of your jobs"
                value={total.value}
                fullValue={total.full}
                detail={{ label: "Jobs", value: overview?.jobs.allTime.toLocaleString(), tone: "blue" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={HandCoins}
                label="Paid to manufacturers"
                value={paid.value}
                fullValue={paid.full}
                detail={{ label: "Payments", value: money?.payments.toLocaleString(), tone: "green" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={Hourglass}
                label="Still to pay"
                value={pending.value}
                fullValue={pending.full}
                detail={{ label: "On jobs underway", value: overview?.jobs.active.toLocaleString(), tone: "amber" }}
                loading={isLoading}
            />
            <OverviewCard
                icon={Ban}
                label="Rejection charges"
                value={charges.value}
                fullValue={charges.full}
                detail={{ label: "Charges", value: money?.charges.toLocaleString(), tone: money?.charges ? "red" : "gray" }}
                loading={isLoading}
            />
        </OverviewCardGrid>
    );
}
