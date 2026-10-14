"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, FileText, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";
import { formatDayAndTime } from "@/lib/date";
import { queryKeys } from "@/lib/queryKeys";
import { MandeApiError } from "@/lib/types/api";
import {
    formatMachineDuration,
    formatBookedMachine,
    formatMachineSlot,
    getMachineBookingServiceLabel,
    machineBookingService,
    type MachineBooking,
} from "@/lib/services/machineBookingService";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import { LoadError } from "../emptyState";
import AdminPageHeader from "../pageHeader";
import { MachineBookingStatusBadge, formatKobo } from "../machineBookingsPage/machineBookingParts";
import MachineBookingActions from "./machineBookingActions";

// The signed ID card link lasts 5 minutes: refetch a little sooner so the preview keeps working
const ID_CARD_REFRESH_MS = 4 * 60 * 1000;

const CARD_CLASS = "flex flex-col gap-4 rounded-xl border border-border bg-white p-5";

/** A titled card on the booking page. */
function DetailCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section className={CARD_CLASS}>
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-medium font-text text-mist-950">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

/** One labelled value in a card. `value` undefined shows a skeleton (still loading). */
function Field({ label, value, wide }: { label: string; value: ReactNode | undefined; wide?: boolean }) {
    return (
        <div className={cn("flex min-w-0 flex-col gap-1", wide && "sm:col-span-2")}>
            <dt className="text-xs font-text text-mist-500">{label}</dt>
            <dd className="min-w-0 wrap-anywhere text-sm font-text text-mist-950">
                {value === undefined ? <Skeleton className="h-4 w-32" /> : value}
            </dd>
        </div>
    );
}

/** The machines booked (each as it was at booking time), or the old service on bookings made before machines. */
function BookedMachines({ booking }: { booking: MachineBooking }) {
    const machines = booking.machines ?? [];
    if (machines.length === 0) {
        return <>{booking.service ? getMachineBookingServiceLabel(booking.service) : "No machines"}</>;
    }
    return (
        <ul className="flex flex-col gap-2">
            {machines.map((machine) => (
                <li key={machine.machineId} className="flex flex-col">
                    <span className="font-medium">{formatBookedMachine(machine)}</span>
                    <span className="text-xs text-mist-500">
                        {[machine.category, machine.type].filter(Boolean).join(", ")}
                    </span>
                </li>
            ))}
        </ul>
    );
}

/** A line of the payment breakdown. */
function PaymentRow({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
    return (
        <div className={cn("flex items-baseline justify-between gap-4 text-sm font-text", strong ? "font-semibold text-mist-950" : "text-mist-700")}>
            <span className="min-w-0">{label}</span>
            <span className="shrink-0">{value}</span>
        </div>
    );
}

const isPdf = (value: string) => /\.pdf($|\?)/i.test(value);
const isImage = (value: string) => /\.(png|jpe?g|webp|gif|avif)($|\?)/i.test(value) || /\/image\/upload\//.test(value);

/** Whether the ID card can be drawn inline (images, not PDFs). */
function canPreviewIdCard(idCard: MachineBooking["idCard"]): boolean {
    const { name, url } = idCard;
    if (!url) return false;
    if ((name && isPdf(name)) || isPdf(url)) return false;
    return (!!name && isImage(name)) || isImage(url);
}

/** What happened to the money on a cancelled booking. */
function RefundNote({ booking }: { booking: MachineBooking }) {
    if (booking.status !== "cancelled") return null;
    if (!booking.paidAt) {
        return <p className="text-sm font-text text-mist-500">Cancelled before payment, so there was nothing to refund.</p>;
    }
    if (booking.refundStatus === "refunded") {
        return <p className="text-sm font-text text-primary-700">Refunded in full ({formatKobo(booking.amountKobo)}).</p>;
    }
    if (booking.refundStatus === "failed") {
        return (
            <p className="rounded-lg border border-error-200 bg-error-50/60 px-3 py-2 text-sm font-text text-error-700">
                The refund didn&apos;t go through. Refund {formatKobo(booking.amountKobo)} by hand on the payment platform.
            </p>
        );
    }
    return <p className="text-sm font-text text-mist-500">The refund is on its way.</p>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MachineBookingDetailPage — one machine booking, for admins and super
// admins: who booked, the slot and what they're making, the payment
// breakdown, what's happened so far, the ID card they uploaded (through a
// 5 minute signed link, fetched fresh when opened), and the actions its
// status allows: confirm (optionally moving the slot), mark completed, or
// cancel (refunding a paid booking in full).
// ─────────────────────────────────────────────────────────────────────────────

export default function MachineBookingDetailPage({ bookingId }: { bookingId: string }) {
    const { machineBookingsUrl, getManufacturerUrl } = useStaffPlatform();
    const queryClient = useQueryClient();
    const [isOpeningIdCard, setIsOpeningIdCard] = useState(false);
    const [previewFailed, setPreviewFailed] = useState(false);

    const query = useQuery({
        queryKey: queryKeys.machineBookings.detail(bookingId),
        queryFn: () => machineBookingService.getBooking(bookingId),
        staleTime: 0,
        refetchInterval: ID_CARD_REFRESH_MS,
        retry: (count, error) => !(error instanceof MandeApiError && error.status === 404) && count < 1,
    });
    const booking = query.data;

    const backLink = { href: machineBookingsUrl, label: "Machine bookings" };

    if (query.isError && !booking) {
        const isNotFound = query.error instanceof MandeApiError && query.error.status === 404;
        return (
            <div className="flex flex-col gap-6">
                <AdminPageHeader title="Machine booking" backLink={backLink} />
                <LoadError
                    message={
                        isNotFound
                            ? "We couldn't find this booking. It may have been removed."
                            : "We couldn't load this booking. Please refresh the page."
                    }
                />
            </div>
        );
    }

    /** Puts what an action answered with into the cache (keeping the signed ID card link), and refreshes the lists. */
    const applyUpdate = (updated: MachineBooking) => {
        queryClient.setQueryData<MachineBooking>(queryKeys.machineBookings.detail(bookingId), (old) => ({
            ...updated,
            idCard: updated.idCard?.url ? updated.idCard : (old?.idCard ?? updated.idCard),
        }));
        void queryClient.invalidateQueries({ queryKey: [...queryKeys.machineBookings.all, "list"] });
        void queryClient.invalidateQueries({ queryKey: queryKeys.machineBookings.mine() });
    };

    /** Fetches a fresh signed link (the last one may have expired) and opens it in a new tab. */
    const openIdCard = async () => {
        // Opened straight away, so the browser doesn't block it as a popup once the link arrives
        const tab = window.open("", "_blank");
        setIsOpeningIdCard(true);
        try {
            const result = await query.refetch();
            if (result.isError) throw result.error;
            const url = result.data?.idCard.url;
            if (!url) throw new Error("The ID card link is missing");
            setPreviewFailed(false);
            if (tab) {
                tab.opener = null;
                tab.location.href = url;
            } else {
                window.open(url, "_blank", "noopener,noreferrer");
            }
        } catch (err) {
            tab?.close();
            toast.error(getErrorMessage(err, "Couldn't open the ID card. Please try again."));
        } finally {
            setIsOpeningIdCard(false);
        }
    };

    // A coupon and a plan discount never stack: the booking says which one was applied
    const isCouponDiscount = booking?.discountSource === "coupon";
    const discountLabel = booking
        ? isCouponDiscount
            ? `Coupon ${booking.couponCode ?? ""}`.trim()
            : booking.planName
              ? `${booking.planName} discount (${booking.discountPercent}%)`
              : `Discount (${booking.discountPercent}%)`
        : "";

    const timeline: { label: string; at: string | null }[] = booking
        ? [
              { label: "Booked", at: booking.createdAt },
              { label: "Paid", at: booking.paidAt },
              { label: "Confirmed", at: booking.confirmedAt },
              { label: "Completed", at: booking.completedAt },
              { label: "Cancelled", at: booking.cancelledAt },
          ].filter((event) => event.label === "Booked" || !!event.at)
        : [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <AdminPageHeader title={booking?.code ?? "Machine booking"} backLink={backLink} />
                    {booking ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <MachineBookingStatusBadge status={booking.status} />
                            <span className="text-sm font-text text-mist-500">
                                {formatMachineSlot(booking.date, booking.startTime)}
                            </span>
                        </div>
                    ) : (
                        <Skeleton className="h-6 w-56" />
                    )}
                </div>
                {booking && <MachineBookingActions booking={booking} onUpdated={applyUpdate} />}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
                <div className="flex min-w-0 flex-col gap-6">
                    <DetailCard
                        title="Customer"
                        action={
                            booking?.manufacturerId ? (
                                <Link
                                    href={getManufacturerUrl(booking.manufacturerId)}
                                    className="text-sm font-medium font-text text-secondary-700 hover:underline"
                                >
                                    View manufacturer
                                </Link>
                            ) : undefined
                        }
                    >
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Full name" value={booking?.fullName} />
                            <Field
                                label="Email"
                                value={
                                    booking && (
                                        <a href={`mailto:${booking.email}`} className="text-secondary-700 hover:underline">
                                            {booking.email}
                                        </a>
                                    )
                                }
                            />
                            <Field
                                label="Phone"
                                value={
                                    booking && (
                                        <a href={`tel:${booking.phone}`} className="text-secondary-700 hover:underline">
                                            {booking.phone}
                                        </a>
                                    )
                                }
                            />
                            <Field
                                label="Account"
                                value={booking && (booking.manufacturerId ? "Manufacturer on MANDE" : "Guest")}
                            />
                            <Field label="Address" value={booking?.address} wide />
                        </dl>
                    </DetailCard>

                    <DetailCard title="Booking">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field
                                label={booking && (booking.machines ?? []).length === 0 ? "Service" : "Machines"}
                                value={booking && <BookedMachines booking={booking} />}
                                wide
                            />
                            <Field label="Date and start time" value={booking && formatMachineSlot(booking.date, booking.startTime)} />
                            <Field label="Duration" value={booking && formatMachineDuration(booking.duration, booking.unit)} />
                            <Field label="Booking code" value={booking?.code} />
                            <Field
                                label="What they're making"
                                value={booking && <span className="whitespace-pre-line">{booking.details}</span>}
                                wide
                            />
                            {booking?.staffNote && (
                                <Field label="Note to the booker" value={<span className="whitespace-pre-line">{booking.staffNote}</span>} wide />
                            )}
                            {booking?.cancelReason && (
                                <Field
                                    label="Why it was cancelled"
                                    value={<span className="whitespace-pre-line">{booking.cancelReason}</span>}
                                    wide
                                />
                            )}
                        </dl>
                    </DetailCard>

                    <DetailCard
                        title="ID card"
                        action={
                            booking?.idCard.url ? (
                                <button
                                    type="button"
                                    onClick={() => void openIdCard()}
                                    disabled={isOpeningIdCard}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium font-text text-secondary-700 hover:underline disabled:opacity-60 cursor-pointer"
                                >
                                    {isOpeningIdCard ? <RefreshCw className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
                                    Open in new tab
                                </button>
                            ) : undefined
                        }
                    >
                        {!booking ? (
                            <Skeleton className="h-40 w-full max-w-sm rounded-lg" />
                        ) : !booking.idCard.url ? (
                            <p className="text-sm font-text text-mist-500">No ID card on this booking.</p>
                        ) : canPreviewIdCard(booking.idCard) && !previewFailed ? (
                            <button
                                type="button"
                                onClick={() => void openIdCard()}
                                className="self-start cursor-pointer"
                                aria-label="Open the ID card in a new tab"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element -- a short-lived signed upload with no fixed size */}
                                <img
                                    src={booking.idCard.url}
                                    alt={booking.idCard.name ? `ID card: ${booking.idCard.name}` : "ID card"}
                                    onError={() => setPreviewFailed(true)}
                                    className="max-h-72 w-auto rounded-lg border border-border object-contain"
                                />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => void openIdCard()}
                                className="flex items-center gap-3 self-start rounded-lg border border-border px-4 py-3 text-left hover:bg-mist-50 cursor-pointer"
                            >
                                <FileText className="size-5 shrink-0 text-mist-500" />
                                <span className="text-sm font-medium font-text text-mist-950 wrap-anywhere">
                                    {booking.idCard.name || "ID card"}
                                </span>
                            </button>
                        )}
                        {booking?.idCard.url && (
                            <p className="text-xs font-text text-mist-400">
                                For privacy, the link to the ID card only works for a few minutes. Opening it always gets a fresh one.
                            </p>
                        )}
                    </DetailCard>
                </div>

                <div className="flex min-w-0 flex-col gap-6">
                    <DetailCard title="Payment">
                        {!booking ? (
                            <div className="flex flex-col gap-3" aria-busy="true">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-5 w-full" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {(booking.machines ?? []).map((machine) => (
                                    <PaymentRow
                                        key={machine.machineId}
                                        label={machine.name}
                                        value={`${formatKobo(machine.priceKobo)} per ${booking.unit}`}
                                    />
                                ))}
                                <PaymentRow
                                    label={`${formatKobo(booking.rateKobo)} per ${booking.unit} x ${formatMachineDuration(booking.duration, booking.unit)}`}
                                    value={formatKobo(booking.subtotalKobo)}
                                />
                                {booking.discountKobo > 0 && (
                                    <PaymentRow label={discountLabel} value={`-${formatKobo(booking.discountKobo)}`} />
                                )}
                                <div className="border-t border-border pt-3">
                                    <PaymentRow label="Total" value={formatKobo(booking.amountKobo)} strong />
                                </div>
                                {booking.couponCode && (
                                    <p className="text-xs font-text text-mist-500">
                                        {isCouponDiscount && booking.discountKobo > 0
                                            ? `Coupon ${booking.couponCode} was used on this booking.`
                                            : booking.discountSource === "plan"
                                              ? `Coupon ${booking.couponCode} was entered, but the plan discount saved more, so that was applied instead.`
                                              : `Coupon ${booking.couponCode} was entered, but no discount was applied.`}
                                    </p>
                                )}
                                {booking.discountKobo === 0 && !booking.couponCode && (
                                    <p className="text-xs font-text text-mist-400">No discount on this booking.</p>
                                )}
                                <RefundNote booking={booking} />
                            </div>
                        )}
                    </DetailCard>

                    <DetailCard title="Timeline">
                        {!booking ? (
                            <div className="flex flex-col gap-3" aria-busy="true">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ) : (
                            <ol className="flex flex-col">
                                {timeline.map((event, index) => {
                                    const isLast = index === timeline.length - 1;
                                    return (
                                        <li key={event.label} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <span
                                                    className={cn(
                                                        "mt-1.5 size-2.5 shrink-0 rounded-full",
                                                        event.label === "Cancelled" ? "bg-error-500" : "bg-primary-500",
                                                    )}
                                                />
                                                {!isLast && <span className="my-1 w-px flex-1 bg-mist-200" />}
                                            </div>
                                            <div className={cn("flex min-w-0 flex-col gap-0.5", !isLast && "pb-4")}>
                                                <span className="text-sm font-medium font-text text-mist-950">{event.label}</span>
                                                {event.at && (
                                                    <span className="text-xs font-text text-mist-500">
                                                        {formatDayAndTime(new Date(event.at))}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </DetailCard>
                </div>
            </div>
        </div>
    );
}
