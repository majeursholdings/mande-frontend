"use client";

import { DataTable, type ColumnDef } from "@/components/customTable";
import LoadError from "../loadError";
import { formatOrdinalDate } from "@/lib/date";
import TransactionListItem, {
    PaidByCardNote,
    TransactionIcon,
    TransactionListItemSkeleton,
    TransactionStatusBadge,
    formatSignedAmount,
    type TransactionRow,
} from "./transactionListItem";

// Same-day ones by id, so the order never changes between renders
const newestFirst = (a: TransactionRow, b: TransactionRow) =>
    new Date(b.date).getTime() - new Date(a.date).getTime() || a.id.localeCompare(b.id);

/** Transactions in a TRANSACTION_SORT_OPTIONS order — or as they are for any other value. */
export function sortTransactions<T extends TransactionRow>(transactions: T[], sortBy: string): T[] {
    // A → Z, newest first within a project; withdrawals (no project) last
    if (sortBy === "project-name") {
        return [...transactions].sort((a, b) => {
            const byProject =
                a.projectName === null || b.projectName === null
                    ? Number(a.projectName === null) - Number(b.projectName === null)
                    : a.projectName.localeCompare(b.projectName);
            return byProject || newestFirst(a, b);
        });
    }
    if (sortBy === "date") return [...transactions].sort(newestFirst);
    // Largest first, newest first between equal amounts
    if (sortBy === "amount") {
        return [...transactions].sort((a, b) => b.amount - a.amount || newestFirst(a, b));
    }
    return transactions;
}

const COLUMNS: ColumnDef<TransactionRow>[] = [
    {
        key: "payment",
        header: "Payment",
        cell: (transaction) => (
            <span className="flex items-center gap-3 font-medium text-mist-950">
                <TransactionIcon type={transaction.type} direction={transaction.direction} />
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>
                        {transaction.label}
                        {transaction.paidByCard && <PaidByCardNote />}
                    </span>
                    <TransactionStatusBadge transaction={transaction} />
                </span>
            </span>
        ),
    },
    {
        key: "project",
        header: "Project name",
        cell: (transaction) => transaction.projectName ?? <span className="text-mist-400">-</span>,
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
            <span className="font-semibold text-mist-950">{formatSignedAmount(transaction)}</span>
        ),
    },
];

/**
 * A manufacturer's wallet transactions — a table from md up, a list on
 * phones. Shared by their own Transactions page and the admin's view of
 * them, so both read the same.
 */
export default function TransactionsList({
    transactions,
    tableId,
    loading = false,
    error,
}: {
    transactions: TransactionRow[];
    tableId: string;
    /** Skeleton rows while the transactions load. */
    loading?: boolean;
    /** Shown in place of the rows (under the table's headers) when they couldn't load. */
    error?: React.ReactNode;
}) {
    return (
        <>
            <div className="hidden md:block">
                <DataTable tableId={tableId} columns={COLUMNS} rows={transactions} loading={loading} error={error} />
            </div>
            {error && <LoadError className="md:hidden">{error}</LoadError>}
            <ul className="flex flex-col gap-6 md:hidden">
                {loading
                    ? [1, 2, 3, 4].map((i) => <TransactionListItemSkeleton key={i} variant="full" />)
                    : transactions.map((transaction) => (
                          <TransactionListItem key={transaction.id} transaction={transaction} variant="full" />
                      ))}
            </ul>
        </>
    );
}
