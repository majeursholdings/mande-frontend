import { CreditCard, HandCoins, Landmark, WalletMinimal, type LucideIcon } from "lucide-react";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import type { TransactionSummary } from "@/constant/manufacturer";
import type { TransactionSummary as ApiTransactionSummary } from "@/lib/services/reportsService";
import { StatCard, StatCardRow } from "../statCard";
import { StatCardSkeleton } from "../dashboardPage/reportStates";

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
            // Charges for rejected work come out of it too
            footer:
                summary.charges > 0
                    ? `After ${formatPrice(summary.charges)} in rejection charges`
                    : isPlatform
                      ? "Waiting to be withdrawn"
                      : "In their wallet now",
        },
    ];

    return (
        <StatCardRow columns={isPlatform ? 4 : 2}>
            {cards.map((card) =>
                !loadedSummary ? (
                    <StatCardSkeleton key={card.key} label={card.label} icon={card.icon} iconClassName={card.iconClassName} />
                ) : (
                    <StatCard
                        key={card.key}
                        label={card.label}
                        value={isPlatform ? formatCompactPrice(card.amount) : formatPrice(card.amount)}
                        fullValue={isPlatform ? formatPrice(card.amount) : undefined}
                        icon={card.icon}
                        iconClassName={card.iconClassName}
                        footer={card.footer}
                    />
                ),
            )}
        </StatCardRow>
    );
}
