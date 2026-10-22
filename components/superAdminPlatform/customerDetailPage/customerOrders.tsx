"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DataTable, StatusBadge, type ColumnDef } from "@/components/customTable";
import { ORDER_PART_STATUS_LABELS, ORDER_PART_STATUS_TONES } from "@/constant/shop";
import { formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { customerService, type CustomerOrderRow } from "@/lib/services/customerService";
import { CUSTOMER_ORDER_STATUS } from "../customersPage/customerStatus";

const PAGE_SIZE = 10;

const COLUMNS: ColumnDef<CustomerOrderRow>[] = [
    { key: "code", header: "Order", cell: (order) => <span className="font-mono text-xs font-bold text-mist-700">{order.code}</span> },
    { key: "placed", header: "Placed", cell: (order) => <span className="whitespace-nowrap">{dayjs(order.placedAt).format("D MMM YYYY")}</span> },
    {
        key: "status",
        header: "Status",
        cell: (order) => <StatusBadge label={CUSTOMER_ORDER_STATUS[order.status].label} tone={CUSTOMER_ORDER_STATUS[order.status].tone} variant="pill" />,
    },
    {
        key: "parts",
        header: "Sellers",
        cell: (order) => (
            <span className="flex flex-col gap-1">
                {order.parts.map((part, index) => (
                    <span key={`${part.sellerName}-${index}`} className="flex items-center gap-2 whitespace-nowrap">
                        <span className="max-w-40 truncate text-mist-700">{part.sellerName}</span>
                        <StatusBadge label={ORDER_PART_STATUS_LABELS[part.status]} tone={ORDER_PART_STATUS_TONES[part.status]} />
                    </span>
                ))}
            </span>
        ),
    },
    { key: "items", header: "Items", cell: (order) => <span className="tabular-nums">{order.itemCount}</span> },
    {
        key: "total",
        header: "Total",
        cell: (order) => (
            <span className="flex flex-col whitespace-nowrap tabular-nums">
                <span className="font-medium text-mist-950">{formatPrice(fromKobo(order.totalKobo))}</span>
                {order.creditKobo > 0 && <span className="text-xs text-mist-500">{formatPrice(fromKobo(order.creditKobo))} in credit</span>}
                {order.refundedKobo > 0 && <span className="text-xs text-secondary-700">{formatPrice(fromKobo(order.refundedKobo))} refunded</span>}
            </span>
        ),
    },
];

/** Every order the customer started, newest first, a page at a time (the page is kept here, not in the URL). */
export default function CustomerOrders({ customerId }: { customerId: string }) {
    const [page, setPage] = useState(1);
    const query = useQuery({
        queryKey: queryKeys.customers.orders(customerId, page),
        queryFn: () => customerService.listOrders(customerId, { page, limit: PAGE_SIZE }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    return (
        <DataTable
            tableId="customer-orders"
            columns={COLUMNS}
            rows={query.data?.orders ?? []}
            page={page}
            onPageChange={setPage}
            pagination={{ total: query.data?.total ?? 0, totalPages: query.data?.totalPages || 1, rowsPerPage: PAGE_SIZE }}
            loading={query.isPending}
            error={query.isError ? "We couldn't load their orders. Please refresh the page." : undefined}
            emptyMessage="They haven't ordered anything yet."
        />
    );
}
