"use client";

import Link from "next/link";
import type { ColumnDef } from "@/components/customTable";
import UserAvatar from "@/components/ui/userAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    PaidByCardNote,
    TransactionIcon,
} from "@/components/manufacturerPlatform/transactionsPage/transactionListItem";
import { formatPrice, fromKobo } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import type { ReportTransaction, ReportTransactionType } from "@/lib/services/reportsService";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";

/**
 * A manufacturer's transaction, with who it's for: a row of the admin
 * Transactions page and the dashboard's Recent Transactions, from
 * /reports/transactions. Seen from the manufacturer's side, as on their own
 * Transactions page: a job payment is money in; a withdrawal or plan payment
 * is money out.
 */
export type AdminTransaction = {
    id: string;
    type: ReportTransactionType;
    /** Money in to the manufacturer's wallet, or out. */
    direction: "credit" | "debit";
    status: ReportTransaction["status"];
    /** e.g. "First installment", or "Withdrawal". */
    label: string;
    /** Title of the job a payment is for, when the jobs loaded here have it. */
    projectName: string | null;
    /** ISO date. */
    date: string;
    /** In naira, always positive: `direction` says which way. */
    amount: number;
    paidByCard: boolean;
    manufacturerId: string;
    manufacturerName: string;
    companyName: string;
    avatarUrl: string | null;
};

/**
 * An API transaction as a row. The API sends the job's id, not its title:
 * `getJobTitle` finds it among the jobs already loaded.
 */
export function toAdminTransaction(transaction: ReportTransaction): AdminTransaction {
    return {
        id: transaction.id,
        type: transaction.type,
        direction: transaction.direction,
        status: transaction.status,
        label: transaction.label,
        projectName: transaction.jobTitle,
        date: transaction.date,
        amount: fromKobo(transaction.amountKobo),
        paidByCard: transaction.paidByCard,
        manufacturerId: transaction.manufacturerId,
        manufacturerName: transaction.manufacturerName,
        companyName: transaction.companyName,
        avatarUrl: transaction.avatar?.url ?? null,
    };
}

/** The arrow: in (green, down) for money into the wallet, out (red, up) otherwise. */
function DirectionIcon({ transaction, className }: { transaction: AdminTransaction; className?: string }) {
    // TransactionIcon reads money in from "payment" and money out from anything else
    return <TransactionIcon type={transaction.direction === "credit" ? "payment" : "withdrawal"} className={className} />;
}

/** After the label of a withdrawal still on its way, or one that didn't go through. */
function StatusNote({ status }: { status: AdminTransaction["status"] }) {
    if (status === "completed") return null;
    return <span className="ml-1.5 text-xs font-normal text-mist-400">{status === "pending" ? "pending" : "failed"}</span>;
}

/** Who a transaction is for — their photo, name (a link to them) and company; just the name when `compact`. */
function ManufacturerCell({ transaction, compact }: { transaction: AdminTransaction; compact: boolean }) {
    const { getManufacturerUrl } = useStaffPlatform();

    return (
        <span className="flex items-center gap-3">
            {!compact && (
                <UserAvatar name={transaction.manufacturerName} src={transaction.avatarUrl} className="size-8 text-xs" />
            )}
            <span className="flex min-w-0 flex-col">
                <Link
                    href={getManufacturerUrl(transaction.manufacturerId)}
                    // The row opens it too; this is for keyboards
                    onClick={(event) => event.stopPropagation()}
                    className="font-medium text-mist-950 outline-none hover:underline focus-visible:underline"
                >
                    {transaction.manufacturerName}
                </Link>
                {!compact && <span className="text-xs text-gray-500">{transaction.companyName}</span>}
            </span>
        </span>
    );
}

/**
 * The columns of every admin table of transactions — the Transactions page,
 * and (`compact`, to fit a dashboard card: the manufacturer by name alone)
 * Recent Transactions: who it's for, what it was with the job under it,
 * when, and how much.
 */
export const getAdminTransactionColumns = (compact = false): ColumnDef<AdminTransaction>[] => [
    // Names and payments wrap when the table's narrow — the date and amount never do
    {
        key: "manufacturer",
        header: "Manufacturer",
        className: "whitespace-normal",
        cell: (transaction) => <ManufacturerCell transaction={transaction} compact={compact} />,
    },
    {
        key: "payment",
        header: "Payment",
        className: "whitespace-normal",
        cell: (transaction) => (
            <span className="flex items-center gap-3">
                <DirectionIcon transaction={transaction} />
                <span className="flex min-w-0 flex-col">
                    <span className="font-medium text-mist-950">
                        {transaction.label}
                        {transaction.paidByCard && <PaidByCardNote />}
                        <StatusNote status={transaction.status} />
                    </span>
                    {transaction.projectName && (
                        <span className="text-xs text-gray-500">{transaction.projectName}</span>
                    )}
                </span>
            </span>
        ),
    },
    {
        key: "date",
        header: "Date",
        cell: (transaction) => (
            <span className="text-mist-500">{formatOrdinalDate(new Date(transaction.date))}</span>
        ),
    },
    {
        key: "amount",
        header: "Amount",
        className: "text-right",
        cell: (transaction) => (
            <span className="font-semibold text-mist-950">{formatPrice(transaction.amount)}</span>
        ),
    },
];

/** One transaction as a list row, on phones where the table doesn't fit — what it was, who for, when and how much. */
export function AdminTransactionListItem({ transaction }: { transaction: AdminTransaction }) {
    return (
        <li className="flex gap-3">
            <DirectionIcon transaction={transaction} className="mt-0.5" />
            <div className="min-w-0 flex-1 font-text">
                <p className="text-base font-medium text-mist-950">
                    {transaction.label}
                    {transaction.paidByCard && <PaidByCardNote />}
                    <StatusNote status={transaction.status} />
                </p>
                <p className="text-sm text-mist-600">
                    {transaction.manufacturerName}
                    {transaction.projectName && ` · ${transaction.projectName}`}
                </p>
                <p className="text-xs text-mist-400">{formatOrdinalDate(new Date(transaction.date))}</p>
            </div>
            <p className="shrink-0 self-start text-base font-semibold font-text text-mist-950">
                {formatPrice(transaction.amount)}
            </p>
        </li>
    );
}

/** AdminTransactionListItems while they load: rows of their shape. */
export function AdminTransactionListSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <ul aria-hidden className="flex flex-col gap-6">
            {Array.from({ length: rows }, (_, index) => (
                <li key={index} className="flex gap-3">
                    <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <Skeleton className="h-4 w-2/5" />
                        <Skeleton className="h-3.5 w-3/5" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20 shrink-0" />
                </li>
            ))}
        </ul>
    );
}
