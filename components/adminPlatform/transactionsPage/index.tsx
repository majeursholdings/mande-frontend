"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
    DataTable,
    TableToolbar,
    useTableRows,
    type SelectFilterItem,
    type SortOptionDef,
} from "@/components/customTable";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService } from "@/lib/services/reportsService";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import { ReportError } from "../dashboardPage/reportStates";
import { getAdminTransactionColumns, toAdminTransaction, type AdminTransaction } from "./adminTransactionParts";
import TransactionSummaryCards, { fromApiTransactionSummary } from "./transactionSummaryCards";

const TABLE_ID = "transactions";
const COLUMNS = getAdminTransactionColumns();

const TYPE_ITEMS: SelectFilterItem[] = [
    { label: "Job payments", value: "payment" },
    { label: "Withdrawals", value: "withdrawal" },
    { label: "Subscriptions", value: "subscription" },
    { label: "Rejection charges", value: "charge" },
    { label: "Reversals", value: "reversal" },
];

const SORT_ITEMS: SelectFilterItem[] = [
    { label: "Date", value: "date" },
    { label: "Amount", value: "amount" },
    { label: "Manufacturer", value: "manufacturer" },
];

const SORT_OPTIONS: SortOptionDef<AdminTransaction>[] = [
    { value: "date", field: "date", type: "date" },
    { value: "amount", field: "amount", type: "number", direction: "desc" },
    { value: "manufacturer", field: "manufacturerName" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Admin Transactions: every manufacturer's transactions, as a manufacturer's
// own Transactions tab shows theirs. The totals across the platform (paid
// for jobs, withdrawn, paid for plans, and still in wallets) come from
// /reports/transactions/summary; then every job payment, withdrawal, plan
// payment, charge and reversal from /reports/transactions, searchable,
// filtered by type and sorted. The API pages by date, so every page is
// loaded up front (see getAllTransactions) and the table searches, sorts
// and pages them here. Each row opens the manufacturer.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminTransactionsPage() {
    const router = useRouter();
    const { getManufacturerUrl } = useStaffPlatform();

    const summaryQuery = useQuery({
        queryKey: queryKeys.reports.transactionsSummary(),
        queryFn: () => reportsService.getTransactionsSummary(),
        staleTime: 30_000,
    });
    const transactionsQuery = useQuery({
        queryKey: queryKeys.reports.transactions({ all: true }),
        queryFn: () => reportsService.getAllTransactions(),
        staleTime: 30_000,
    });

    // Newest first across everyone: the order before a sort is picked
    const allRows = (transactionsQuery.data ?? []).map((transaction) =>
        toAdminTransaction(transaction),
    );

    const { rows, pagination } = useTableRows({
        tableId: TABLE_ID,
        data: allRows,
        searchFields: ["manufacturerName", "companyName", "projectName", "label"],
        filters: [{ paramKey: "type", field: "type" }],
        sortOptions: SORT_OPTIONS,
        rowsPerPage: 10,
    });

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Transactions</h1>

            {summaryQuery.isError ? (
                <ReportError message="Couldn't load the totals. Please refresh to try again." />
            ) : (
                <TransactionSummaryCards
                    summary={summaryQuery.data ? fromApiTransactionSummary(summaryQuery.data.summary) : undefined}
                    scope="platform"
                />
            )}

            <DataTable
                tableId={TABLE_ID}
                columns={COLUMNS}
                rows={rows}
                pagination={pagination}
                loading={transactionsQuery.isPending}
                error={transactionsQuery.isError ? "Couldn't load the transactions. Please refresh to try again." : undefined}
                emptyMessage="No transactions match your search."
                onRowClick={(row) => router.push(getManufacturerUrl(row.manufacturerId))}
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search by manufacturer, company or project" }}
                        filters={[{ title: "All types", paramKey: "type", items: TYPE_ITEMS }]}
                        sortBy={{ title: "Sort by", items: SORT_ITEMS }}
                    />
                }
            />
        </div>
    );
}
