"use client";

import Link from "next/link";
import { CircleAlert, CircleCheck, Clock, RotateCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/customTable";
import { cn } from "@/lib/utils";
import { formatPrice, fromKobo } from "@/lib/currency";
import {
    MACHINE_BOOKING_STATUS_LABELS,
    MACHINE_BOOKING_STATUS_TONES,
    formatMachineDuration,
    formatBookedMachine,
    formatMachineSlot,
    getMachineBookingServiceLabel,
    type MachineBooking,
} from "@/lib/services/machineBookingService";
import { CONTACT_URL, SERVICES_URL } from "@/constant/navigation";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";

// The pieces the website's machine booking pages share: the return page after
// checkout, the private booking link and "My bookings".

export const PAID_STATUSES: MachineBooking["status"][] = ["paid", "confirmed", "completed"];

const TONE_ICON = {
    success: { icon: CircleCheck, className: "bg-primary-100 text-primary-800" },
    pending: { icon: Clock, className: "bg-amber-50 text-amber-700" },
    error: { icon: CircleAlert, className: "bg-secondary-50 text-secondary-700" },
} as const;

export function ResultCard({
    tone,
    title,
    description,
    children,
}: {
    tone: keyof typeof TONE_ICON;
    title: string;
    description: string;
    children?: React.ReactNode;
}) {
    const { icon: Icon, className } = TONE_ICON[tone];
    return (
        <div className="flex flex-col gap-6 rounded-[10px] border border-border bg-white p-6 md:p-10">
            <div className="flex flex-col gap-4">
                <span className={cn("flex size-12 items-center justify-center rounded-full", className)}>
                    <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                </span>
                <h1 className="text-2xl tracking-tight md:text-3xl">{title}</h1>
                <p className="text-base font-light text-mist-700">{description}</p>
            </div>
            {children}
        </div>
    );
}

/** "Gold plan discount (20%)", "Coupon SAVE10": the label for the discount a booking got. */
function discountLabel(booking: MachineBooking): string {
    if (booking.discountSource === "coupon" && booking.couponCode) return `Coupon ${booking.couponCode}`;
    return `${booking.planName ? `${booking.planName} plan` : "Plan"} discount (${booking.discountPercent}%)`;
}

const REFUND_LABELS: Record<NonNullable<MachineBooking["refundStatus"]>, string> = {
    refunded: "Refunded in full",
    failed: "Refund failed, we'll be in touch",
};

/**
 * A booking's details and payment breakdown. `showStatus` adds its status
 * (and refund) at the top, for pages that aren't about the payment itself.
 */
export function BookingSummary({ booking, showStatus = false }: { booking: MachineBooking; showStatus?: boolean }) {
    const money = (kobo: number) => formatPrice(fromKobo(kobo));
    const rows: [string, React.ReactNode][] = [];
    if (showStatus) {
        rows.push([
            "Status",
            <StatusBadge
                key="status"
                label={MACHINE_BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                tone={MACHINE_BOOKING_STATUS_TONES[booking.status] ?? "gray"}
                variant="pill"
            />,
        ]);
    }
    const machines = booking.machines ?? [];
    rows.push(
        ["Booking code", booking.code],
        machines.length > 0
            ? [
                  machines.length === 1 ? "Machine" : "Machines",
                  <ul key="machines" className="flex flex-col gap-1">
                      {machines.map((machine) => (
                          <li key={machine.machineId} className="flex flex-col">
                              <span>{formatBookedMachine(machine)}</span>
                              <span className="text-xs font-normal text-mist-600">
                                  {money(machine.priceKobo)} per {booking.unit}
                              </span>
                          </li>
                      ))}
                  </ul>,
              ]
            : ["Service", booking.service ? getMachineBookingServiceLabel(booking.service) : "-"],
        ["Date and time", formatMachineSlot(booking.date, booking.startTime)],
        ["Duration", formatMachineDuration(booking.duration, booking.unit)],
    );
    if (booking.discountKobo > 0) {
        rows.push(
            [`${formatMachineDuration(booking.duration, booking.unit)} x ${money(booking.rateKobo)}`, money(booking.subtotalKobo)],
            [discountLabel(booking), `-${money(booking.discountKobo)}`],
        );
    }
    if (showStatus && booking.status === "cancelled" && booking.cancelReason) {
        rows.push(["Cancelled because", booking.cancelReason]);
    }
    if (showStatus && booking.refundStatus) {
        rows.push(["Refund", REFUND_LABELS[booking.refundStatus]]);
    }
    return (
        <dl className="flex flex-col rounded-lg bg-mist-100 px-4 py-2 text-sm">
            {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-mist-200 py-2.5">
                    <dt className="text-mist-600">{label}</dt>
                    <dd className="text-right font-medium text-mist-950">{value}</dd>
                </div>
            ))}
            <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="font-semibold text-mist-950">
                    {PAID_STATUSES.includes(booking.status) || booking.refundStatus ? "Amount paid" : "Amount"}
                </dt>
                <dd className="text-base font-semibold text-mist-950">{money(booking.amountKobo)}</dd>
            </div>
        </dl>
    );
}

export function RetryButton({
    onClick,
    isRetrying,
    label = "Try again",
}: {
    onClick: () => void;
    isRetrying: boolean;
    label?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isRetrying}
            className={cn(WEBSITE_PRIMARY_BUTTON, "cursor-pointer disabled:cursor-default disabled:opacity-60")}
        >
            <RotateCw className={cn("size-4", isRetrying && "animate-spin")} aria-hidden />
            {isRetrying ? "Checking..." : label}
        </button>
    );
}

/** "Back to services" and "Contact us", after any `children` (more links in the same row). */
export function BackLinks({ children }: { children?: React.ReactNode }) {
    return (
        <div className="flex flex-wrap gap-3">
            {children}
            <Link href={SERVICES_URL} className={WEBSITE_OUTLINE_BUTTON}>
                Back to services
            </Link>
            <Link href={CONTACT_URL} className={WEBSITE_OUTLINE_BUTTON}>
                Contact us
            </Link>
        </div>
    );
}

export function ResultSkeleton() {
    return (
        <div aria-busy className="flex flex-col gap-6 rounded-[10px] border border-border bg-white p-6 md:p-10">
            <div className="flex flex-col gap-4">
                <Skeleton className="size-12 rounded-full" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-full max-w-96" />
            </div>
            <div className="flex flex-col gap-3 rounded-lg bg-mist-100 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                ))}
            </div>
        </div>
    );
}
