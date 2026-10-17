"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable, StatusBadge, useTableRows, type ColumnDef } from "@/components/customTable";
import MachineBookingForm from "@/components/manufacturerPlatform/form/machineBookingForm";
import { queryKeys } from "@/lib/queryKeys";
import { fetchAllPages } from "@/lib/pagination";
import { formatPrice, fromKobo } from "@/lib/currency";
import {
    MACHINE_BOOKING_RETURN_PATH,
    MACHINE_BOOKING_STATUS_LABELS,
    MACHINE_BOOKING_STATUS_TONES,
    describeMachineBookingDiscount,
    formatMachineDuration,
    formatMachineSlot,
    describeBookingMachines,
    machineBookingService,
    type MachineBooking,
} from "@/lib/services/machineBookingService";
import { MANUFACTURER_MACHINE_BOOKINGS_URL } from "@/constant/manufacturer";
import PageHeader from "../pageHeader";

const TABLE_ID = "machine-bookings";
/** The most bookings the table lists (newest first). */
const MAX_BOOKINGS = 200;

const COLUMNS: ColumnDef<MachineBooking>[] = [
    {
        key: "code",
        header: "Booking",
        cell: (booking) => (
            <span className="flex flex-col">
                <span className="font-medium text-mist-950">{booking.code}</span>
                <span className="max-w-56 truncate text-xs text-mist-500">{describeBookingMachines(booking)}</span>
            </span>
        ),
    },
    {
        key: "slot",
        header: "Date and time",
        cell: (booking) => <span className="whitespace-nowrap">{formatMachineSlot(booking.date, booking.startTime)}</span>,
    },
    {
        key: "duration",
        header: "Duration",
        cell: (booking) => formatMachineDuration(booking.duration, booking.unit),
    },
    {
        key: "amount",
        header: "Amount",
        cell: (booking) => {
            const discount = describeMachineBookingDiscount(booking);
            return (
                <span className="flex flex-col">
                    <span className="font-semibold text-mist-950">{formatPrice(fromKobo(booking.amountKobo))}</span>
                    {discount && <span className="text-xs text-primary-700">{discount}</span>}
                </span>
            );
        },
    },
    {
        key: "status",
        header: "Status",
        cell: (booking) => (
            <span className="flex flex-col gap-1">
                <StatusBadge
                    label={MACHINE_BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                    tone={MACHINE_BOOKING_STATUS_TONES[booking.status] ?? "gray"}
                    variant="pill"
                />
                {booking.status === "cancelled" && booking.refundStatus === "refunded" && (
                    <span className="text-xs text-mist-500">Refunded</span>
                )}
            </span>
        ),
    },
];

/**
 * Machine time for a signed-in manufacturer: the booking form (their details
 * filled in, their plan discount applied) and the bookings they've made.
 */
export default function ManufacturerMachineBookingsPage() {
    const bookingsQuery = useQuery({
        queryKey: queryKeys.machineBookings.mine(),
        queryFn: () =>
            fetchAllPages(async (before) => {
                const page = await machineBookingService.getMyBookings({ limit: 50, before });
                return { items: page.bookings, nextBefore: page.nextBefore };
            }, MAX_BOOKINGS),
    });
    const { rows, pagination } = useTableRows({
        tableId: TABLE_ID,
        data: bookingsQuery.data ?? [],
        rowsPerPage: 10,
    });

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Machine time"
                description="Book time on the furniture machines at the MANDE factory in Lagos. You pay when you book, then we confirm your slot by email."
            />

            <section className="flex flex-col gap-5 rounded-xl border border-border bg-white p-5 lg:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold font-text text-mist-950">Book machine time</h2>
                    <p className="text-sm font-text text-mist-500">
                        Your details are filled in from your profile. Change them here if this booking is for someone else.
                    </p>
                </div>
                <MachineBookingForm
                    className="max-w-3xl"
                    returnPath={MACHINE_BOOKING_RETURN_PATH}
                    loginNextPath={MANUFACTURER_MACHINE_BOOKINGS_URL}
                />
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold font-text text-mist-950">Your bookings</h2>
                <DataTable
                    tableId={TABLE_ID}
                    columns={COLUMNS}
                    rows={rows}
                    pagination={pagination}
                    loading={bookingsQuery.isPending}
                    error={
                        bookingsQuery.isError
                            ? "Couldn't load your bookings. Please refresh the page to try again."
                            : undefined
                    }
                    emptyMessage="No bookings yet. When you book machine time, it shows here."
                />
            </section>
        </div>
    );
}
