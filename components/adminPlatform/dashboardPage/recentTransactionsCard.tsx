"use client";

import { ArrowDown, ArrowUp, ReceiptText } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/customTable";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import { ADMIN_TRANSACTIONS_URL, type AdminTransaction } from "@/constant/admin";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import DashboardCard from "./dashboardCard";
import EmptyState from "../emptyState";
import { getRecentTransactions } from "./dashboardStats";

const COLUMNS: ColumnDef<AdminTransaction>[] = [
    {
        key: "account",
        header: "Account",
        className: "whitespace-normal",
        cell: (transaction) => <AccountCell transaction={transaction} />,
    },
    {
        key: "amount",
        header: "Amount paid",
        cell: (transaction) => formatPrice(transaction.amount),
    },
    {
        key: "date",
        header: "Date",
        cell: (transaction) => formatOrdinalDate(new Date(transaction.date)),
    },
    {
        key: "status",
        header: "Status",
        className: "text-center",
        cell: (transaction) => <ReconciledBadge isReconciled={transaction.isReconciled} />,
    },
];

/** The latest installments paid out on jobs — a table from md up, a stacked list on phones. */
export default function RecentTransactionsCard() {
    const { jobs } = useAdminJobs();
    const transactions = getRecentTransactions(jobs);

    return (
        <DashboardCard
            title="Recent Transactions"
            viewAllHref={transactions.length > 0 ? ADMIN_TRANSACTIONS_URL : undefined}
        >
            {transactions.length === 0 ? (
                <EmptyState
                    icon={ReceiptText}
                    title="No Transactions"
                    description="There are no transactions to display"
                />
            ) : (
                <>
                    <div className="hidden md:block">
                        <DataTable tableId="recent-transactions" columns={COLUMNS} rows={transactions} compact />
                    </div>

                    <ul className="flex flex-col gap-6 md:hidden">
                        {transactions.map((transaction) => (
                            <li key={transaction.id} className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <AccountCell transaction={transaction} />
                                    <p className="mt-1 pl-8 text-xs font-text text-mist-400">
                                        {formatOrdinalDate(new Date(transaction.date))}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-2">
                                    <span className="text-base font-text text-mist-950">
                                        {formatPrice(transaction.amount)}
                                    </span>
                                    <ReconciledBadge isReconciled={transaction.isReconciled} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </DashboardCard>
    );
}

function AccountCell({ transaction }: { transaction: AdminTransaction }) {
    const isOut = transaction.direction === "out";
    const Arrow = isOut ? ArrowUp : ArrowDown;

    return (
        <div className="flex gap-3">
            <span
                className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white",
                    isOut ? "bg-error-600" : "bg-primary-600",
                )}
            >
                <Arrow className="size-3" strokeWidth={2.5} aria-hidden />
                <span className="sr-only">{isOut ? "Money out:" : "Money in:"}</span>
            </span>
            <div className="min-w-0">
                <p className="text-base font-text text-mist-950">{transaction.accountName}</p>
                <p className="text-sm font-text text-mist-600">{transaction.label}</p>
            </div>
        </div>
    );
}

function ReconciledBadge({ isReconciled }: { isReconciled: boolean }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium font-text whitespace-nowrap",
                isReconciled ? "bg-primary-50 text-primary-700" : "bg-warning-50 text-warning-700",
            )}
        >
            <span
                className={cn("size-1.5 rounded-full", isReconciled ? "bg-primary-600" : "bg-warning-500")}
                aria-hidden
            />
            {isReconciled ? "Reconciled" : "Yet to reconcile"}
        </span>
    );
}
