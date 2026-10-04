"use client";

import { useQuery } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react";
import { DataTable } from "@/components/customTable";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService } from "@/lib/services/reportsService";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import {
    AdminTransactionListItem,
    AdminTransactionListSkeleton,
    getAdminTransactionColumns,
    toAdminTransaction,
} from "../transactionsPage/adminTransactionParts";
import DashboardCard from "./dashboardCard";
import EmptyState from "../emptyState";
import { ReportError } from "./reportStates";

const COLUMNS = getAdminTransactionColumns(true);

/**
 * The latest transactions across every manufacturer, from
 * /reports/transactions: the top of the Transactions page, with its columns.
 * A table from md up, a stacked list on phones.
 */
export default function RecentTransactionsCard({ limit = 4 }: { limit?: number }) {
    const { transactionsUrl } = useStaffPlatform();
    const query = useQuery({
        queryKey: queryKeys.reports.transactions({ limit }),
        queryFn: () => reportsService.getTransactions({ limit }),
        staleTime: 30_000,
    });
    const transactions = (query.data?.transactions ?? []).map((transaction) =>
        toAdminTransaction(transaction),
    );

    return (
        <DashboardCard
            title="Recent Transactions"
            viewAllHref={transactions.length > 0 ? transactionsUrl : undefined}
        >
            {query.isError ? (
                <ReportError message="Couldn't load the recent transactions. Please refresh to try again." />
            ) : !query.isPending && transactions.length === 0 ? (
                <EmptyState
                    icon={ReceiptText}
                    title="No Transactions"
                    description="There are no transactions to display"
                />
            ) : (
                <>
                    <div className="hidden md:block">
                        <DataTable
                            tableId="recent-transactions"
                            columns={COLUMNS}
                            rows={transactions}
                            loading={query.isPending}
                            compact
                        />
                    </div>

                    {query.isPending ? (
                        <div className="md:hidden">
                            <AdminTransactionListSkeleton rows={limit} />
                        </div>
                    ) : (
                        <ul className="flex flex-col gap-6 md:hidden">
                            {transactions.map((transaction) => (
                                <AdminTransactionListItem key={transaction.id} transaction={transaction} />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </DashboardCard>
    );
}
