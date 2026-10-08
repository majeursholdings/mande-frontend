"use client";

import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { DataTable, TableToolbar, useTableRows, type ColumnDef } from "@/components/customTable";
import UserAvatar from "@/components/ui/userAvatar";
import { formatOrdinalDate } from "@/lib/date";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";

const TABLE_ID = "closed-manufacturers";
const PAGE_SIZE = 50;

type ClosedManufacturer = {
    id: string;
    userId: string | null;
    firstName: string;
    lastName: string;
    companyName: string;
    email: string | null;
    avatar: { url: string } | null;
    deactivation: { at: string; byName: string | null; reason: string | null } | null;
};

type ClosedRow = {
    id: string;
    href: string;
    fullName: string;
    companyName: string;
    email: string;
    avatarUrl: string | null;
    closedAt: string;
    closedBy: string;
    reason: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Closed accounts: the manufacturers a super admin closed, newest first, with
// when, by whom and why. Each opens the manufacturer, where it can be reopened.
// Loaded from the API a page at a time (they aren't in the open list).
// ─────────────────────────────────────────────────────────────────────────────

export default function ClosedManufacturersTable() {
    const router = useRouter();
    const { getManufacturerUrl } = useStaffPlatform();
    const query = useInfiniteQuery({
        queryKey: queryKeys.manufacturers.list({ status: "deactivated" }),
        queryFn: ({ pageParam }) =>
            manufacturerService.getStaffManufacturers({ status: "deactivated", limit: PAGE_SIZE, before: pageParam ?? undefined }) as Promise<{
                manufacturers: ClosedManufacturer[];
                nextBefore: string | null;
            }>,
        initialPageParam: null as string | null,
        getNextPageParam: (last) => last.nextBefore,
    });

    const allRows: ClosedRow[] = (query.data?.pages ?? [])
        .flatMap((page) => page.manufacturers)
        .map((manufacturer) => ({
            id: manufacturer.id,
            href: getManufacturerUrl(manufacturer.userId ?? manufacturer.id),
            fullName: `${manufacturer.firstName} ${manufacturer.lastName}`.trim() || manufacturer.companyName,
            companyName: manufacturer.companyName,
            email: manufacturer.email ?? "",
            avatarUrl: manufacturer.avatar?.url ?? null,
            closedAt: manufacturer.deactivation?.at ?? "",
            closedBy: manufacturer.deactivation?.byName ?? "",
            reason: manufacturer.deactivation?.reason ?? "",
        }));

    const { rows, pagination } = useTableRows({
        tableId: TABLE_ID,
        data: allRows,
        searchFields: ["fullName", "companyName", "email"],
        rowsPerPage: 10,
    });

    const columns: ColumnDef<ClosedRow>[] = [
        {
            key: "fullName",
            header: "Manufacturer",
            cell: (row) => (
                <span className="flex items-center gap-3">
                    <UserAvatar name={row.fullName} src={row.avatarUrl} className="size-8 text-xs" />
                    <span className="flex min-w-0 flex-col">
                        <span className="font-medium text-mist-950">{row.fullName}</span>
                        <span className="text-xs text-gray-500">{row.companyName}</span>
                    </span>
                </span>
            ),
        },
        {
            key: "closedAt",
            header: "Closed",
            cell: (row) => (
                <span className="flex flex-col text-sm">
                    <span className="text-mist-800">{row.closedAt ? formatOrdinalDate(new Date(row.closedAt)) : "Unknown"}</span>
                    {row.closedBy && <span className="text-xs text-gray-500">By {row.closedBy}</span>}
                </span>
            ),
        },
        {
            key: "reason",
            header: "Reason",
            cell: (row) => <span className="line-clamp-2 text-sm text-mist-700">{row.reason || "No reason recorded"}</span>,
        },
    ];

    return (
        <div className="flex flex-col gap-4">
            <DataTable
                tableId={TABLE_ID}
                columns={columns}
                rows={rows}
                loading={query.isPending}
                pagination={pagination}
                error={query.isError ? "We couldn't load the closed accounts. Please refresh the page." : undefined}
                emptyMessage="No closed accounts."
                onRowClick={(row) => router.push(row.href)}
                toolbar={<TableToolbar search={{ placeholder: "Search by name, company or email" }} />}
            />
            {query.hasNextPage && (
                <button
                    type="button"
                    onClick={() => void query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                    className="self-center text-sm font-medium font-text text-secondary-700 hover:underline disabled:opacity-60"
                >
                    {query.isFetchingNextPage ? "Loading..." : "Load older closed accounts"}
                </button>
            )}
        </div>
    );
}
