"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef } from "@/components/customTable";
import { formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { customerService, type CustomerRow } from "@/lib/services/customerService";
import { getSuperAdminCustomerUrl } from "@/constant/superAdmin";
import CustomersOverview from "./customersOverview";
import { CUSTOMER_STATUS, CUSTOMER_STATUS_FILTER_ITEMS, isCustomerStatusFilter } from "./customerStatus";

const TABLE_ID = "customers";
const PAGE_SIZE = 20;

const COLUMNS: ColumnDef<CustomerRow>[] = [
    {
        key: "name",
        header: "Customer",
        cell: (customer) => (
            <span className="flex flex-col">
                <span className="max-w-56 truncate font-medium text-mist-950">{customer.name}</span>
                <span className="max-w-56 truncate text-xs text-mist-500">{customer.email}</span>
            </span>
        ),
    },
    { key: "phone", header: "Phone", cell: (customer) => <span className="whitespace-nowrap">{customer.phone || "Not given"}</span> },
    {
        key: "status",
        header: "Status",
        cell: (customer) => <StatusBadge label={CUSTOMER_STATUS[customer.status].label} tone={CUSTOMER_STATUS[customer.status].tone} variant="pill" />,
    },
    { key: "orders", header: "Orders", cell: (customer) => <span className="tabular-nums">{customer.ordersCount.toLocaleString()}</span> },
    { key: "spent", header: "Spent", cell: (customer) => <span className="whitespace-nowrap tabular-nums">{formatPrice(fromKobo(customer.spentKobo))}</span> },
    {
        key: "credit",
        header: "Store credit",
        cell: (customer) =>
            customer.creditKobo > 0 ? (
                <span className="whitespace-nowrap tabular-nums">{formatPrice(fromKobo(customer.creditKobo))}</span>
            ) : (
                <span className="text-mist-400">None</span>
            ),
    },
    { key: "joined", header: "Joined", cell: (customer) => <span className="whitespace-nowrap">{dayjs(customer.joinedAt).format("D MMM YYYY")}</span> },
];

// ─────────────────────────────────────────────────────────────────────────────
// The super admin's Customers page: everyone with a shop account, newest
// first, a page at a time. The search (name or email) and the status filter
// live in the URL and are sent to the API, which only sends the page asked
// for. Opening a customer shows their orders and store credit, and lets a
// super admin deactivate or reactivate them.
// ─────────────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const page = Math.max(1, Number(searchParams.get(`${TABLE_ID}_page`) ?? 1) || 1);
    const q = (searchParams.get(`${TABLE_ID}_search`) ?? "").trim();
    const statusParam = searchParams.get(`${TABLE_ID}_status`) ?? "";
    const status = isCustomerStatusFilter(statusParam) ? statusParam : undefined;

    const query = useQuery({
        queryKey: queryKeys.customers.list({ page, q, status: status ?? null }),
        queryFn: () => customerService.listCustomers({ page, limit: PAGE_SIZE, q: q || undefined, status }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold font-text text-mist-950">Customers</h1>
                <p className="text-sm font-text text-mist-500">Everyone with a MANDE Shop account: their orders, store credit and account.</p>
            </div>

            <div className="mt-4">
                <CustomersOverview />
            </div>

            <DataTable
                tableId={TABLE_ID}
                columns={COLUMNS}
                rows={query.data?.customers ?? []}
                pagination={{ total: query.data?.total ?? 0, totalPages: query.data?.totalPages || 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the customers. Please refresh the page." : undefined}
                emptyMessage={q || status ? "No customers match your search." : "No one has signed up on the shop yet."}
                onRowClick={(customer) => router.push(getSuperAdminCustomerUrl(customer.id))}
                rowActions={[{ label: "View", onSelect: (customer) => router.push(getSuperAdminCustomerUrl(customer.id)) }]}
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search by name or email" }}
                        filters={[{ title: "Any status", paramKey: "status", items: CUSTOMER_STATUS_FILTER_ITEMS }]}
                    />
                }
            />
        </div>
    );
}
