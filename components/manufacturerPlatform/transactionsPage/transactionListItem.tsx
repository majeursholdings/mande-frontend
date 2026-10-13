import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import { StatusBadge } from "@/components/customTable";
import type { ManufacturerTransaction } from "@/constant/manufacturer";

/**
 * A transaction as the lists show it. The wallet's own history also says
 * which way the money went and how a withdrawal stands; other callers (the
 * admin's view) may leave those out.
 */
export type TransactionRow = ManufacturerTransaction & {
    direction?: "credit" | "debit";
    status?: "pending" | "completed" | "failed";
    failureReason?: string | null;
};

/** Money out when the ledger says so; otherwise anything but a payment is money out. */
export function isMoneyOut(transaction: Pick<TransactionRow, "type" | "direction">): boolean {
    return transaction.direction ? transaction.direction === "debit" : transaction.type !== "payment";
}

/** The amount with its sign when the direction is known: "+₦5,000" in, "-₦5,000" out. */
export function formatSignedAmount(transaction: TransactionRow): string {
    if (!transaction.direction) return formatPrice(transaction.amount);
    return `${transaction.direction === "debit" ? "-" : "+"}${formatPrice(transaction.amount)}`;
}

/** "Pending" or "Failed" for a withdrawal that hasn't completed; nothing once it has. */
export function TransactionStatusBadge({ transaction }: { transaction: TransactionRow }) {
    if (transaction.status === "pending") return <StatusBadge label="Pending" tone="amber" />;
    if (transaction.status === "failed") {
        return (
            <span title={transaction.failureReason ?? undefined}>
                <StatusBadge label="Failed" tone="red" />
            </span>
        );
    }
    return null;
}

/** Green "money in" badge for a payment, red "money out" for a withdrawal, plan payment or rejection charge. */
export function TransactionIcon({
    type,
    direction,
    className,
}: {
    type: ManufacturerTransaction["type"];
    direction?: "credit" | "debit";
    className?: string;
}) {
    const moneyOut = isMoneyOut({ type, direction });
    const Arrow = moneyOut ? ArrowUp : ArrowDown;

    return (
        <span
            aria-hidden
            className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-white",
                moneyOut ? "bg-error-500" : "bg-primary-500",
                className,
            )}
        >
            <Arrow className="size-3" strokeWidth={2.5} />
        </span>
    );
}

/** After a plan's name when it was paid by card — not from the wallet, so the balance didn't change. */
export function PaidByCardNote() {
    return <span className="ml-1.5 text-xs font-normal text-mist-400">by card</span>;
}

/**
 * One transaction as a list row. "preview" (the profile card) shows the
 * label and date; "full" (the mobile transactions page, where there's no
 * room for the table) adds the project name.
 */
export default function TransactionListItem({
    transaction,
    variant = "preview",
}: {
    transaction: TransactionRow;
    variant?: "preview" | "full";
}) {
    const isFull = variant === "full";

    return (
        <li className="flex gap-3">
            <TransactionIcon type={transaction.type} direction={transaction.direction} className="mt-0.5" />
            <div className="min-w-0 flex-1">
                <p
                    className={cn(
                        "font-medium font-text text-mist-950",
                        isFull ? "text-base" : "text-sm",
                    )}
                >
                    {transaction.label}
                    {transaction.paidByCard && <PaidByCardNote />}
                </p>
                {isFull && transaction.projectName && (
                    <p className="text-sm font-text text-mist-600">{transaction.projectName}</p>
                )}
                {isFull && <TransactionStatusBadge transaction={transaction} />}
                {isFull && transaction.status === "failed" && transaction.failureReason && (
                    <p className="text-xs font-text text-mist-500">{transaction.failureReason}</p>
                )}
                <p className="text-xs font-text text-mist-400">
                    {formatOrdinalDate(new Date(transaction.date))}
                </p>
            </div>
            <p
                className={cn(
                    "shrink-0 font-semibold font-text text-mist-950",
                    isFull ? "self-start text-base" : "self-center text-sm",
                )}
            >
                {formatSignedAmount(transaction)}
            </p>
        </li>
    );
}

/** A TransactionListItem while the transactions load. */
export function TransactionListItemSkeleton({ variant = "preview" }: { variant?: "preview" | "full" }) {
    const isFull = variant === "full";
    return (
        <li aria-hidden className="flex gap-3">
            <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className={isFull ? "h-5 w-40" : "h-4 w-36"} />
                <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className={cn("shrink-0", isFull ? "h-5 w-20" : "h-4 w-16 self-center")} />
        </li>
    );
}
