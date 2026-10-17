"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { trackEvent } from "@/lib/consent";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { machineBookingService } from "@/lib/services/machineBookingService";
import { MACHINE_BOOKING_MY_BOOKINGS_URL, SERVICES_URL } from "@/constant/navigation";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_OUTLINE_BUTTON } from "../common/buttonStyles";
import { BackLinks, BookingSummary, PAID_STATUSES, ResultCard, ResultSkeleton, RetryButton } from "./bookingResult";

/**
 * Back from the payment partner's checkout: confirms the booking's payment
 * (by its reference) and shows how it went. Paid: the booking's summary.
 * Not paid yet: a way to check again. Failed or cancelled: a way back.
 */
export default function MachineBookingCompletePage({ reference }: { reference: string | null }) {
    const query = useQuery({
        queryKey: [...queryKeys.machineBookings.all, "confirm", reference],
        queryFn: async () => {
            const booking = await machineBookingService.confirmPayment(reference as string);
            // A paid booking is a conversion for the ad and analytics tools (only if the visitor allowed them)
            if (PAID_STATUSES.includes(booking.status)) {
                trackEvent({ event: "machine_booking_purchase", transaction_id: booking.code, value: booking.amountKobo / 100, currency: "NGN" });
            }
            return booking;
        },
        enabled: !!reference,
        retry: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });

    let body: React.ReactNode;
    if (!reference) {
        body = (
            <ResultCard
                tone="error"
                title="We couldn't find your payment"
                description="This link is missing its payment reference. If you paid, check your email for a receipt, or contact us with your booking details."
            >
                <BackLinks />
            </ResultCard>
        );
    } else if (query.isPending) {
        body = <ResultSkeleton />;
    } else if (query.isError) {
        body = (
            <ResultCard
                tone="error"
                title="We couldn't check your payment"
                description={getErrorMessage(query.error, "Something went wrong while checking your payment.")}
            >
                <RetryButton onClick={() => void query.refetch()} isRetrying={query.isFetching} />
                <BackLinks />
            </ResultCard>
        );
    } else {
        const booking = query.data;
        if (PAID_STATUSES.includes(booking.status)) {
            body = (
                <ResultCard
                    tone="success"
                    title="Payment received"
                    description={`Thanks, ${booking.fullName.split(" ")[0] || "there"}. We'll confirm your slot at the factory by email (to ${booking.email}).`}
                >
                    <BookingSummary booking={booking} />
                    <div className="flex flex-wrap gap-3">
                        <Link href={MACHINE_BOOKING_MY_BOOKINGS_URL} className={WEBSITE_OUTLINE_BUTTON}>
                            See all your bookings
                        </Link>
                        <Link href={SERVICES_URL} className={WEBSITE_OUTLINE_BUTTON}>
                            Back to services
                        </Link>
                    </div>
                </ResultCard>
            );
        } else if (booking.status === "pending_payment") {
            body = (
                <ResultCard
                    tone="pending"
                    title="We haven't received your payment yet"
                    description="Payments can take a minute to come through. Check again shortly. If you cancelled the checkout, you can book again."
                >
                    <BookingSummary booking={booking} />
                    <div className="flex flex-wrap gap-3">
                        <RetryButton onClick={() => void query.refetch()} isRetrying={query.isFetching} label="Check again" />
                        <Link href={SERVICES_URL} className={WEBSITE_OUTLINE_BUTTON}>
                            Book again
                        </Link>
                    </div>
                </ResultCard>
            );
        } else {
            body = (
                <ResultCard
                    tone="error"
                    title="This booking was cancelled"
                    description={
                        booking.cancelReason
                            ? `Reason: ${booking.cancelReason}`
                            : "Contact us if you have any questions about it."
                    }
                >
                    <BookingSummary booking={booking} />
                    <BackLinks />
                </ResultCard>
            );
        }
    }

    return (
        <SectionWrapper className="bg-mist-100" containerClassName="flex justify-center">
            <div className="w-full max-w-160">{body}</div>
        </SectionWrapper>
    );
}

