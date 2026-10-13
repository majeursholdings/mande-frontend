import { BriefcaseBusiness, CreditCard, HandCoins, type LucideIcon } from "lucide-react";
import OverviewCard, { OverviewCardGrid, type OverviewTone } from "@/components/common/overviewCard";
import { formatCompactPrice, formatPrice } from "@/lib/currency";

export type WalletFigure = {
    label: string;
    /** Null when it couldn't load: shown as "-", never as ₦0. */
    amount: number | null;
    /** The line under it: a second figure. */
    detail: { label: string; value: string; tone: OverviewTone };
    icon: LucideIcon;
};

/** The figures above the balance, from the wallet's totals and the jobs underway. */
export function getWalletFigures({
    totals,
    currentJobs,
}: {
    /** The wallet's all-time totals, in naira. Null when they couldn't load. */
    totals: { earned: number; paymentCount: number; subscriptions: number; subscriptionCount: number } | null;
    /** The jobs underway. Null when they couldn't load. */
    currentJobs: { count: number; worth: number; stillToCome: number } | null;
}): WalletFigure[] {
    return [
        {
            label: "Total made",
            amount: totals?.earned ?? null,
            detail: { label: "Job payments", value: totals ? totals.paymentCount.toLocaleString() : "-", tone: "green" },
            icon: HandCoins,
        },
        {
            label: "Spent on subscriptions",
            amount: totals?.subscriptions ?? null,
            detail: { label: "Plan payments", value: totals ? totals.subscriptionCount.toLocaleString() : "-", tone: "blue" },
            icon: CreditCard,
        },
        {
            label: "Current jobs worth",
            amount: currentJobs?.worth ?? null,
            detail: !currentJobs
                ? { label: "Still to come", value: "-", tone: "gray" }
                : currentJobs.count === 0
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
                    value={amount === null ? "-" : formatCompactPrice(amount)}
                    fullValue={amount === null ? undefined : formatPrice(amount)}
                    detail={detail}
                    loading={isLoading}
                />
            ))}
        </OverviewCardGrid>
    );
}
