import { CreditCard, HandCoins, Landmark, WalletMinimal, type LucideIcon } from "lucide-react";
import { formatCompactPrice, formatPrice } from "@/lib/currency";
import type { TransactionSummary } from "@/constant/manufacturer";
import { StatCard, StatCardRow } from "../statCard";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

type SummaryCard = {
    key: string;
    label: string;
    amount: number;
    icon: LucideIcon;
    iconClassName: string;
    footer: string;
};

/**
 * What's moved through manufacturer wallets — earned for jobs, withdrawn,
 * spent on plans, and the balance left. For one manufacturer (exact
 * amounts, two to a row beside their profile card), or for everyone on the
 * platform (rounded, four to a row).
 */
export default function TransactionSummaryCards({
    summary,
    scope,
}: {
    summary: TransactionSummary;
    scope: "manufacturer" | "platform";
}) {
    const isPlatform = scope === "platform";
    const cards: SummaryCard[] = [
        {
            key: "earned",
            label: isPlatform ? "Paid to manufacturers" : "Total earned",
            amount: summary.earned,
            icon: HandCoins,
            iconClassName: "bg-primary-600",
            footer: `From ${plural(summary.counts.payment, "job payment", "job payments")}`,
        },
        {
            key: "withdrawn",
            label: "Withdrawn",
            amount: summary.withdrawn,
            icon: Landmark,
            iconClassName: "bg-indigo-500",
            footer: `In ${plural(summary.counts.withdrawal, "withdrawal", "withdrawals")}`,
        },
        {
            key: "subscriptions",
            label: isPlatform ? "Paid for subscriptions" : "Spent on subscriptions",
            amount: summary.subscriptions,
            icon: CreditCard,
            iconClassName: "bg-warning-500",
            footer: `Over ${plural(summary.counts.subscription, "plan payment", "plan payments")}`,
        },
        {
            key: "balance",
            label: isPlatform ? "Held in wallets" : "Balance",
            amount: summary.balance,
            icon: WalletMinimal,
            iconClassName: "bg-secondary-600",
            footer: isPlatform ? "Waiting to be withdrawn" : "In their wallet now",
        },
    ];

    return (
        <StatCardRow columns={isPlatform ? 4 : 2}>
            {cards.map((card) => (
                <StatCard
                    key={card.key}
                    label={card.label}
                    value={isPlatform ? formatCompactPrice(card.amount) : formatPrice(card.amount)}
                    fullValue={isPlatform ? formatPrice(card.amount) : undefined}
                    icon={card.icon}
                    iconClassName={card.iconClassName}
                    footer={card.footer}
                />
            ))}
        </StatCardRow>
    );
}
