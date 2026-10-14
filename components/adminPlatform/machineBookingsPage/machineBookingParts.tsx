"use client";

import { StatusBadge, type ColumnDef, type SelectFilterItem } from "@/components/customTable";
import { formatPrice, fromKobo } from "@/lib/currency";
import {
    MACHINE_BOOKING_STATUS_LABELS,
    MACHINE_BOOKING_STATUS_TONES,
    formatMachineDuration,
    formatMachineSlot,
    describeBookingMachines,
    type MachineBooking,
    type MachineBookingStatus,
} from "@/lib/services/machineBookingService";

/** The status filter's choices, in the order a booking moves through them. */
export const MACHINE_BOOKING_STATUS_ITEMS: SelectFilterItem[] = (
    ["pending_payment", "paid", "confirmed", "completed", "cancelled"] as MachineBookingStatus[]
).map((status) => ({ label: MACHINE_BOOKING_STATUS_LABELS[status], value: status }));

/** "₦45,000" from whole kobo. */
export const formatKobo = (amountKobo: number) => formatPrice(fromKobo(amountKobo));

/** The booking's status as a badge. */
export function MachineBookingStatusBadge({ status }: { status: MachineBookingStatus }) {
    return (
        <StatusBadge
            label={MACHINE_BOOKING_STATUS_LABELS[status] ?? status}
            tone={MACHINE_BOOKING_STATUS_TONES[status] ?? "gray"}
            variant="pill"
        />
    );
}

/** The columns of the staff machine bookings table. */
export const MACHINE_BOOKING_COLUMNS: ColumnDef<MachineBooking>[] = [
    {
        key: "code",
        header: "Code",
        cell: (booking) => <span className="font-medium text-mist-950 whitespace-nowrap">{booking.code}</span>,
    },
    {
        key: "customer",
        header: "Customer",
        cell: (booking) => (
            <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-mist-950">{booking.fullName}</span>
                <span className="truncate text-xs text-mist-500">{booking.email}</span>
            </div>
        ),
    },
    {
        key: "machines",
        header: "Machines",
        cell: (booking) => {
            const label = describeBookingMachines(booking);
            return (
                <span className="block max-w-56 truncate" title={label}>
                    {label}
                </span>
            );
        },
    },
    {
        key: "slot",
        header: "Date",
        cell: (booking) => <span className="whitespace-nowrap">{formatMachineSlot(booking.date, booking.startTime)}</span>,
    },
    {
        key: "duration",
        header: "Duration",
        cell: (booking) => <span className="whitespace-nowrap">{formatMachineDuration(booking.duration, booking.unit)}</span>,
    },
    {
        key: "amount",
        header: "Amount",
        cell: (booking) => <span className="whitespace-nowrap">{formatKobo(booking.amountKobo)}</span>,
    },
    {
        key: "status",
        header: "Status",
        cell: (booking) => <MachineBookingStatusBadge status={booking.status} />,
    },
];
