"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MandeApiError, getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { machineBookingService, type MachineBooking } from "@/lib/services/machineBookingService";
import { MACHINE_BOOKING_MY_BOOKINGS_URL } from "@/constant/navigation";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_OUTLINE_BUTTON } from "../common/buttonStyles";
import { BackLinks, BookingSummary, ResultCard, ResultSkeleton, RetryButton } from "../machineBookingCompletePage/bookingResult";

const STATUS_COPY: Record<MachineBooking["status"], { tone: "success" | "pending" | "error"; title: string; description: string }> = {
    pending_payment: {
        tone: "pending",
        title: "Waiting for payment",
        description: "We haven't received the payment for this booking. If you've paid, it can take a minute to come through.",
    },
    paid: {
        tone: "pending",
        title: "Paid, waiting for confirmation",
        description: "We've received your payment. We'll confirm your slot at the factory by email.",
    },
    confirmed: {
        tone: "success",
        title: "Your slot is confirmed",
        description: "See you at the MANDE factory in Lagos. Bring the ID card you booked with.",
    },
    completed: {
        tone: "success",
        title: "Booking completed",
        description: "Thanks for working with us. We hope to see you again.",
    },
    cancelled: {
        tone: "error",
        title: "This booking was cancelled",
        description: "Contact us if you have any questions about it.",
    },
};

/** One machine booking, from the private link in a booking email (?token=). Read only. */
export default function MachineBookingViewPage({ token }: { token: string | null }) {
    const query = useQuery({
        queryKey: queryKeys.machineBookings.view(token ?? ""),
        queryFn: () => machineBookingService.getBookingByViewToken(token as string),
        enabled: !!token,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const allBookingsLink = (
        <Link href={MACHINE_BOOKING_MY_BOOKINGS_URL} className={WEBSITE_OUTLINE_BUTTON}>
            See all your bookings
        </Link>
    );

    let body: React.ReactNode;
    if (!token) {
        body = (
            <ResultCard
                tone="error"
                title="This link isn't complete"
                description="Open the link from your booking email again, or look up your bookings with your email."
            >
                <div className="flex flex-wrap gap-3">{allBookingsLink}</div>
            </ResultCard>
        );
    } else if (query.isPending) {
        body = <ResultSkeleton />;
    } else if (query.isError) {
        const notFound = query.error instanceof MandeApiError && [400, 404].includes(query.error.status);
        body = (
            <ResultCard
                tone="error"
                title={notFound ? "We couldn't find this booking" : "We couldn't load this booking"}
                description={
                    notFound
                        ? "This link may be wrong or out of date. Look up your bookings with your email instead."
                        : getErrorMessage(query.error, "Something went wrong while loading your booking.")
                }
            >
                <div className="flex flex-wrap gap-3">
                    {!notFound && <RetryButton onClick={() => void query.refetch()} isRetrying={query.isFetching} />}
                    {allBookingsLink}
                </div>
            </ResultCard>
        );
    } else {
        const booking = query.data;
        const copy = STATUS_COPY[booking.status] ?? STATUS_COPY.paid;
        body = (
            <ResultCard
                tone={copy.tone}
                title={copy.title}
                description={copy.description}
            >
                <BookingSummary booking={booking} showStatus />
                {booking.staffNote && (
                    <p className="rounded-lg border border-border px-4 py-3 text-sm text-mist-700">
                        <span className="font-medium text-mist-950">Note from MANDE: </span>
                        {booking.staffNote}
                    </p>
                )}
                <BackLinks>{allBookingsLink}</BackLinks>
            </ResultCard>
        );
    }

    return (
        <SectionWrapper className="bg-mist-100" containerClassName="flex justify-center">
            <div className="w-full max-w-160">{body}</div>
        </SectionWrapper>
    );
}
