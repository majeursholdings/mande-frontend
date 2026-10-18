import { CreditCard, HandCoins, Landmark, WalletMinimal, type LucideIcon } from "lucide-react";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import type { TransactionSummary } from "@/constant/manufacturer";
import type { TransactionSummary as ApiTransactionSummary } from "@/lib/services/reportsService";
import OverviewCard, { OverviewCardGrid, type OverviewCardProps } from "@/components/common/overviewCard";

/** /reports/transactions/summary's totals (kobo), as the cards' (naira). */
export function fromApiTransactionSummary(summary: ApiTransactionSummary): TransactionSummary {
    return {
        earned: fromKobo(summary.earnedKobo),
        withdrawn: fromKobo(summary.withdrawnKobo),
        subscriptions: fromKobo(summary.subscriptionsKobo),
        charges: fromKobo(summary.chargesKobo),
        balance: fromKobo(summary.balanceKobo),
        counts: summary.counts,
    };
}

type SummaryCard = {
    key: string;
    label: string;
    amount: number;
    icon: LucideIcon;
    detail: NonNullable<OverviewCardProps["detail"]>;
};

/**
 * What's moved through manufacturer wallets: earned for jobs, withdrawn,
 * spent on plans, and the balance left. For one manufacturer (exact
 * amounts, two to a row beside their profile card), or for everyone on the
 * platform (rounded, four to a row). Skeletons while `summary` loads.
 */
export default function TransactionSummaryCards({
    summary: loadedSummary,
    scope,
}: {
    /** Undefined while it loads. */
    summary: TransactionSummary | undefined;
    scope: "manufacturer" | "platform";
}) {
    const isPlatform = scope === "platform";
    const summary = loadedSummary ?? {
        earned: 0,
        withdrawn: 0,
        subscriptions: 0,
        charges: 0,
        balance: 0,
        counts: { payment: 0, withdrawal: 0, subscription: 0, charge: 0 },
    };
    const money = (amount: number) => (isPlatform ? formatCompactPrice(amount) : formatPrice(amount));
    const cards: SummaryCard[] = [
        {
            key: "earned",
            label: isPlatform ? "Paid to manufacturers" : "Total earned",
            amount: summary.earned,
            icon: HandCoins,
            detail: { label: "Job payments", value: summary.counts.payment.toLocaleString(), tone: "green" },
        },
        {
            key: "withdrawn",
            label: "Withdrawn",
            amount: summary.withdrawn,
            icon: Landmark,
            detail: { label: "Withdrawals", value: summary.counts.withdrawal.toLocaleString(), tone: "blue" },
        },
        {
            key: "subscriptions",
            label: isPlatform ? "Paid for subscriptions" : "Spent on subscriptions",
            amount: summary.subscriptions,
            icon: CreditCard,
            detail: { label: "Plan payments", value: summary.counts.subscription.toLocaleString(), tone: "amber" },
        },
        {
            key: "balance",
            label: isPlatform ? "Held in wallets" : "Balance",
            amount: summary.balance,
            icon: WalletMinimal,
            // Charges for rejected work come out of it too
            detail: { label: "Rejection charges taken", value: money(summary.charges), tone: summary.charges > 0 ? "red" : "gray" },
        },
    ];

    return (
        <OverviewCardGrid columns={isPlatform ? 4 : 2}>
            {cards.map((card) => (
                <OverviewCard
                    key={card.key}
                    icon={card.icon}
                    label={card.label}
                    value={money(card.amount)}
                    fullValue={isPlatform ? formatPrice(card.amount) : undefined}
                    detail={card.detail}
                    loading={!loadedSummary}
                />
            ))}
        </OverviewCardGrid>
    );
}
