"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DataTable, type ColumnDef } from "@/components/customTable";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBalance, formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { customerService, type CustomerCreditEntry } from "@/lib/services/customerService";
import { cn } from "@/lib/utils";
import { CREDIT_ENTRY_KIND_LABELS } from "../customersPage/customerStatus";

const PAGE_SIZE = 10;

const COLUMNS: ColumnDef<CustomerCreditEntry>[] = [
    { key: "at", header: "Date", cell: (entry) => <span className="whitespace-nowrap">{dayjs(entry.at).format("D MMM YYYY, h:mm a")}</span> },
    { key: "kind", header: "Type", cell: (entry) => CREDIT_ENTRY_KIND_LABELS[entry.kind] },
    {
        key: "summary",
        header: "What for",
        cell: (entry) => (
            <span className="flex flex-col">
                <span className="max-w-72 text-mist-950">{entry.summary}</span>
                {entry.orderCode && <span className="font-mono text-xs text-mist-500">{entry.orderCode}</span>}
            </span>
        ),
    },
    {
        key: "amount",
        header: "Amount",
        cell: (entry) => (
            <span className={cn("whitespace-nowrap font-medium tabular-nums", entry.amountKobo > 0 ? "text-primary-700" : "text-mist-950")}>
                {entry.amountKobo > 0 ? "+" : "-"}
                {formatPrice(fromKobo(Math.abs(entry.amountKobo)))}
            </span>
        ),
    },
    { key: "balance", header: "Balance after", cell: (entry) => <span className="whitespace-nowrap tabular-nums">{formatBalance(fromKobo(entry.balanceAfterKobo))}</span> },
];

/** The customer's store credit balance and its statement, newest first (read only: credit moves only through orders and refunds). */
export default function CustomerCredit({ customerId }: { customerId: string }) {
    const [page, setPage] = useState(1);
    const query = useQuery({
        queryKey: queryKeys.customers.credit(customerId, page),
        queryFn: () => customerService.getCredit(customerId, { page, limit: PAGE_SIZE }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-5">
                <span className="text-xs font-text text-mist-500">Store credit balance</span>
                {query.data ? (
                    <span className="text-2xl font-semibold font-text tabular-nums text-mist-950">{formatBalance(fromKobo(query.data.balanceKobo))}</span>
                ) : query.isError ? (
                    <span className="text-sm font-text text-error-600">Couldn&apos;t load the balance.</span>
                ) : (
                    <Skeleton className="h-8 w-32" />
                )}
                <span className="text-xs font-text text-mist-500">It never expires. Refunds paid as credit add to it, and checkouts spend it.</span>
            </div>
            <DataTable
                tableId="customer-credit"
                columns={COLUMNS}
                rows={query.data?.entries ?? []}
                page={page}
                onPageChange={setPage}
                pagination={{ total: query.data?.total ?? 0, totalPages: query.data?.totalPages || 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load their store credit. Please refresh the page." : undefined}
                emptyMessage="No store credit has moved on this account yet."
            />
        </div>
    );
}
