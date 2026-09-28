"use client";

import Link from "next/link";
import type { ColumnDef } from "@/components/customTable";
import UserAvatar from "@/components/ui/userAvatar";
import {
    PaidByCardNote,
    TransactionIcon,
} from "@/components/manufacturerPlatform/transactionsPage/transactionListItem";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import type { AdminTransaction } from "@/constant/admin";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";

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
                <TransactionIcon type={transaction.type} />
                <span className="flex min-w-0 flex-col">
                    <span className="font-medium text-mist-950">
                        {transaction.label}
                        {transaction.paidByCard && <PaidByCardNote />}
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
            <TransactionIcon type={transaction.type} className="mt-0.5" />
            <div className="min-w-0 flex-1 font-text">
                <p className="text-base font-medium text-mist-950">
                    {transaction.label}
                    {transaction.paidByCard && <PaidByCardNote />}
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
