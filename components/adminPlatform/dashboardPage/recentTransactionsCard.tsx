"use client";

import { ReceiptText } from "lucide-react";
import { DataTable } from "@/components/customTable";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import { useAdminManufacturers } from "../dashboardLayout/adminManufacturersContext";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import {
    AdminTransactionListItem,
    getAdminTransactionColumns,
} from "../transactionsPage/adminTransactionParts";
import DashboardCard from "./dashboardCard";
import EmptyState from "../emptyState";
import { getRecentTransactions } from "./dashboardStats";

const COLUMNS = getAdminTransactionColumns(true);

/**
 * The latest transactions across every manufacturer — the top of the
 * Transactions page, with its columns — a table from md up, a stacked list
 * on phones.
 */
export default function RecentTransactionsCard({ limit = 4 }: { limit?: number }) {
    const { manufacturers } = useAdminManufacturers();
    const { jobs } = useAdminJobs();
    const { transactionsUrl } = useStaffPlatform();
    const transactions = getRecentTransactions(manufacturers, jobs, limit);

    return (
        <DashboardCard
            title="Recent Transactions"
            viewAllHref={transactions.length > 0 ? transactionsUrl : undefined}
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
                        <DataTable
                            tableId="recent-transactions"
                            columns={COLUMNS}
                            rows={transactions}
                            compact
                        />
                    </div>

                    <ul className="flex flex-col gap-6 md:hidden">
                        {transactions.map((transaction) => (
                            <AdminTransactionListItem key={transaction.id} transaction={transaction} />
                        ))}
                    </ul>
                </>
            )}
        </DashboardCard>
    );
}
