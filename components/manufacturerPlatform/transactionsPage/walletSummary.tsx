import { BriefcaseBusiness, CreditCard, HandCoins, type LucideIcon } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";

export type WalletFigure = {
    label: string;
    amount: number;
    /** A muted line under it, e.g. "From 18 job payments". */
    hint: string;
    icon: LucideIcon;
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** The figures beside the balance, from the wallet's totals and the jobs underway. */
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
            hint: `From ${plural(paymentCount, "job payment", "job payments")}`,
            icon: HandCoins,
        },
        {
            label: "Spent on subscriptions",
            amount: subscriptions,
            hint: `Over ${plural(subscriptionCount, "plan payment", "plan payments")}`,
            icon: CreditCard,
        },
        {
            label: "Current jobs worth",
            amount: currentJobs.worth,
            hint:
                currentJobs.count === 0
                    ? "No jobs underway"
                    : `${formatPrice(currentJobs.stillToCome)} still to come · ${plural(currentJobs.count, "job", "jobs")}`,
            icon: BriefcaseBusiness,
        },
    ];
}

export default function WalletSummary({
    figures,
    isLoading,
}: {
    figures: WalletFigure[];
    isLoading?: boolean;
}) {
    return (
        <ul className="grid divide-y divide-border rounded-xl border border-border bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {figures.map(({ label, amount, hint, icon: Icon }) => (
                <li
                    key={label}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 sm:flex-col sm:items-start sm:justify-start sm:gap-1 sm:p-5"
                >
                    <div className="flex min-w-0 flex-col gap-0.5 sm:contents">
                        <p className="flex items-center gap-1.5 text-xs font-text text-mist-500 sm:text-sm">
                            <Icon className="size-4 shrink-0 text-mist-400" strokeWidth={1.75} aria-hidden />
                            {label}
                        </p>
                        {isLoading ? (
                            <Skeleton className="h-3 w-32 sm:order-last sm:mt-1" />
                        ) : (
                            <p className="text-xs font-text text-mist-400 sm:order-last">{hint}</p>
                        )}
                    </div>
                    {isLoading ? (
                        <Skeleton className="h-6 w-24 shrink-0 sm:h-7" />
                    ) : (
                        <p className="shrink-0 text-base font-semibold font-text text-mist-950 sm:text-xl">
                            {formatPrice(amount)}
                        </p>
                    )}
                </li>
            ))}
        </ul>
    );
}
