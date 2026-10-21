"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { DataTable, TableToolbar } from "@/components/customTable";
import { queryKeys } from "@/lib/queryKeys";
import {
    machineBookingService,
    type MachineBooking,
    type MachineBookingStatus,
} from "@/lib/services/machineBookingService";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import AdminPageHeader from "../pageHeader";
import { MACHINE_BOOKING_COLUMNS, MACHINE_BOOKING_STATUS_ITEMS } from "./machineBookingParts";
import SuperAdminBookingsOverview from "./superAdminBookingsOverview";

const TABLE_ID = "machineBookings";
const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Staff machine bookings, for admins and super admins alike: every booking of
// time on the factory machines, newest first, searched (code, name, email or
// phone) and filtered by status on the API. The API pages by date, so the
// table shows what has loaded and "Show older bookings" loads the next page.
// Each row opens the booking. A super admin also sees the bookings' numbers.
// ─────────────────────────────────────────────────────────────────────────────

export default function MachineBookingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { getMachineBookingUrl, key: platformKey } = useStaffPlatform();

    // The toolbar keeps its search and filter in the URL, under the table's id
    const q = (searchParams.get(`${TABLE_ID}_search`) ?? "").trim();
    const statusParam = searchParams.get(`${TABLE_ID}_status`) ?? "";
    const status = MACHINE_BOOKING_STATUS_ITEMS.some((item) => item.value === statusParam)
        ? (statusParam as MachineBookingStatus)
        : undefined;

    const query = useInfiniteQuery({
        queryKey: queryKeys.machineBookings.list({ q, status: status ?? null }),
        queryFn: ({ pageParam }) =>
            machineBookingService.listBookings({
                q: q || undefined,
                status,
                limit: PAGE_SIZE,
                before: pageParam ?? undefined,
            }),
        initialPageParam: null as string | null,
        getNextPageParam: (last) => last.nextBefore,
        staleTime: 30_000,
    });

    const rows: MachineBooking[] = query.data?.pages.flatMap((page) => page.bookings) ?? [];
    const isFiltered = !!q || !!status;

    return (
        <div className="flex flex-col gap-6">
            <AdminPageHeader
                title="Machine bookings"
                description="Time booked on the factory machines. Confirm a paid booking's slot, mark it completed once the work is done, or cancel it."
            />

            {platformKey === "super-admin" && <SuperAdminBookingsOverview />}

            <div className="flex flex-col">
                <DataTable
                    tableId={TABLE_ID}
                    columns={MACHINE_BOOKING_COLUMNS}
                    rows={rows}
                    loading={query.isPending}
                    error={query.isError ? "We couldn't load the machine bookings. Please refresh the page." : undefined}
                    emptyMessage={
                        isFiltered
                            ? "No bookings match your search."
                            : "No machine bookings yet. They show up here as soon as someone books machine time."
                    }
                    viewAction={{ type: "link", href: (booking) => getMachineBookingUrl(booking.id) }}
                    onRowClick={(booking) => router.push(getMachineBookingUrl(booking.id))}
                    toolbar={
                        <TableToolbar
                            search={{ placeholder: "Search by code, name, email or phone" }}
                            filters={[{ title: "All statuses", paramKey: "status", items: MACHINE_BOOKING_STATUS_ITEMS }]}
                        />
                    }
                />
                {query.hasNextPage && (
                    <button
                        type="button"
                        onClick={() => void query.fetchNextPage()}
                        disabled={query.isFetchingNextPage}
                        className="mt-4 self-center text-sm font-medium font-text text-secondary-700 hover:underline disabled:opacity-60 cursor-pointer"
                    >
                        {query.isFetchingNextPage ? "Loading..." : "Show older bookings"}
                    </button>
                )}
            </div>
        </div>
    );
}
