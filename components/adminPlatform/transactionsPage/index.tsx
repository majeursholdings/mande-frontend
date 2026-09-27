"use client";

import { useRouter } from "next/navigation";
import {
    DataTable,
    TableToolbar,
    useTableRows,
    type SelectFilterItem,
    type SortOptionDef,
} from "@/components/customTable";
import { getAdminManufacturerUrl, getAdminTransactions, type AdminTransaction } from "@/constant/admin";
import { getTransactionSummary } from "@/constant/manufacturer";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import { useAdminManufacturers } from "../dashboardLayout/adminManufacturersContext";
import { getAdminTransactionColumns } from "./adminTransactionParts";
import TransactionSummaryCards from "./transactionSummaryCards";

const TABLE_ID = "transactions";
const COLUMNS = getAdminTransactionColumns();

const TYPE_ITEMS: SelectFilterItem[] = [
    { label: "Job payments", value: "payment" },
    { label: "Withdrawals", value: "withdrawal" },
    { label: "Subscriptions", value: "subscription" },
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
// Admin Transactions — every manufacturer's transactions, as a manufacturer's
// own Transactions tab shows theirs: the totals across the platform (paid
// for jobs, withdrawn, paid for plans, and still in wallets), then every job
// payment, withdrawal and plan payment — searchable, filtered by type and
// sorted. Each row opens the manufacturer.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminTransactionsPage() {
    const router = useRouter();
    const { manufacturers } = useAdminManufacturers();
    const { jobs } = useAdminJobs();

    // Newest first across everyone — the order before a sort is picked
    const allRows = getAdminTransactions(manufacturers, jobs);

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

            <TransactionSummaryCards summary={getTransactionSummary(allRows)} scope="platform" />

            <DataTable
                tableId={TABLE_ID}
                columns={COLUMNS}
                rows={rows}
                pagination={pagination}
                emptyMessage="No transactions match your search."
                onRowClick={(row) => router.push(getAdminManufacturerUrl(row.manufacturerId))}
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
