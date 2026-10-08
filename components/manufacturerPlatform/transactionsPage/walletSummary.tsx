import { BriefcaseBusiness, CreditCard, HandCoins, type LucideIcon } from "lucide-react";
import OverviewCard, { OverviewCardGrid, type OverviewTone } from "@/components/common/overviewCard";
import { formatCompactPrice, formatPrice } from "@/lib/currency";

export type WalletFigure = {
    label: string;
    amount: number;
    /** The line under it: a second figure. */
    detail: { label: string; value: string; tone: OverviewTone };
    icon: LucideIcon;
};

/** The figures above the balance, from the wallet's totals and the jobs underway. */
export function getWalletFigures({
    earned,
    paymentCount,
    subscriptions,
    subscriptionCount,
    currentJobs,
}: {
    earned: number;
    paymentCount: number;
    subscriptions: number;
    subscriptionCount: number;
    currentJobs: { count: number; worth: number; stillToCome: number };
}): WalletFigure[] {
    return [
        {
            label: "Total made",
            amount: earned,
            detail: { label: "Job payments", value: paymentCount.toLocaleString(), tone: "green" },
            icon: HandCoins,
        },
        {
            label: "Spent on subscriptions",
            amount: subscriptions,
            detail: { label: "Plan payments", value: subscriptionCount.toLocaleString(), tone: "blue" },
            icon: CreditCard,
        },
        {
            label: "Current jobs worth",
            amount: currentJobs.worth,
            detail:
                currentJobs.count === 0
                    ? { label: "No jobs underway", value: "0", tone: "gray" }
                    : { label: "Still to come", value: formatCompactPrice(currentJobs.stillToCome), tone: "amber" },
            icon: BriefcaseBusiness,
        },
    ];
}

/** The wallet's figures, in the overview card design. */
export default function WalletSummary({ figures, isLoading }: { figures: WalletFigure[]; isLoading?: boolean }) {
    return (
        <OverviewCardGrid columns={3}>
            {figures.map(({ label, amount, detail, icon }) => (
                <OverviewCard
                    key={label}
                    icon={icon}
                    label={label}
                    value={formatCompactPrice(amount)}
                    fullValue={formatPrice(amount)}
                    detail={detail}
                    loading={isLoading}
                />
            ))}
        </OverviewCardGrid>
    );
}
