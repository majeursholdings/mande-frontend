"use client";

import { useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    TRANSACTION_SORT_OPTIONS,
    type ManufacturerTransaction,
} from "@/constant/manufacturer";
import { useManufacturerWallet } from "../dashboardLayout/manufacturerWalletContext";
import { SortByDropdown } from "../jobsPage/sortByDropdown";
import EmptyState from "../dashboardPage/emptyState";
import ProfileSubpageHeader from "../profilePage/profileSubpageHeader";
import TransactionListItem, { TransactionIcon } from "../profilePage/transactionListItem";

const newestFirst = (a: ManufacturerTransaction, b: ManufacturerTransaction) =>
    new Date(b.date).getTime() - new Date(a.date).getTime();

function sortTransactions(
    transactions: ManufacturerTransaction[],
    sortBy: string,
): ManufacturerTransaction[] {
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

export default function ManufacturerTransactionsPage() {
    const { wallet } = useManufacturerWallet();
    const [sortBy, setSortBy] = useState("");
    const transactions = useMemo(
        () => sortTransactions(wallet.transactions, sortBy),
        [wallet.transactions, sortBy],
    );
    const hasTransactions = transactions.length > 0;

    return (
        <div className="flex flex-col gap-6">
            <ProfileSubpageHeader
                title="Transactions"
                action={
                    hasTransactions ? (
                        <SortByDropdown
                            items={TRANSACTION_SORT_OPTIONS}
                            value={sortBy}
                            onChange={setSortBy}
                        />
                    ) : null
                }
            />

            {hasTransactions ? (
                <>
                    <TransactionsTable transactions={transactions} className="hidden md:block" />
                    <ul className="flex flex-col gap-6 md:hidden">
                        {transactions.map((transaction) => (
                            <TransactionListItem
                                key={transaction.id}
                                transaction={transaction}
                                variant="full"
                            />
                        ))}
                    </ul>
                </>
            ) : (
                <EmptyState
                    icon={ReceiptText}
                    title="No Transactions"
                    description="There are no transactions to display"
                />
            )}
        </div>
    );
}

const HEAD_CLASS = "h-13 px-6 text-xs font-medium font-text uppercase tracking-wide text-mist-500";
const CELL_CLASS = "px-6 py-4 text-sm font-text";

function TransactionsTable({
    transactions,
    className,
}: {
    transactions: ManufacturerTransaction[];
    className?: string;
}) {
    return (
        <div className={className}>
            <Table>
                <TableHeader className="[&_tr]:border-0">
                    <TableRow className="bg-mist-100 hover:bg-mist-100">
                        <TableHead className={HEAD_CLASS}>Payment</TableHead>
                        <TableHead className={HEAD_CLASS}>Project name</TableHead>
                        <TableHead className={HEAD_CLASS}>Date</TableHead>
                        <TableHead className={cn(HEAD_CLASS, "text-right")}>Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="[&_tr:last-child]:border-b">
                    {transactions.map((transaction) => (
                        <TableRow key={transaction.id} className="border-border">
                            <TableCell className={CELL_CLASS}>
                                <span className="flex items-center gap-3 font-medium text-mist-950">
                                    <TransactionIcon type={transaction.type} />
                                    {transaction.label}
                                </span>
                            </TableCell>
                            <TableCell className={cn(CELL_CLASS, "text-mist-950")}>
                                {transaction.projectName ?? (
                                    <span className="text-mist-400">—</span>
                                )}
                            </TableCell>
                            <TableCell className={cn(CELL_CLASS, "text-mist-500")}>
                                {formatOrdinalDate(new Date(transaction.date))}
                            </TableCell>
                            <TableCell className={cn(CELL_CLASS, "text-right font-semibold text-mist-950")}>
                                {formatPrice(transaction.amount)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
