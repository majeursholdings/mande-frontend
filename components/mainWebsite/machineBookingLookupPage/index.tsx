"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Mail, RotateCcw } from "lucide-react";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import OtpInput from "@/components/form/otpInput";
import { DataTable, StatusBadge, useTableRows, type ColumnDef } from "@/components/customTable";
import { useCountdown } from "@/hooks/useCountdown";
import { OTP_RESEND_SECONDS } from "@/constant/global";
import { SERVICES_URL } from "@/constant/navigation";
import { MandeApiError, getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import { formatPrice, fromKobo } from "@/lib/currency";
import {
    MACHINE_BOOKING_STATUS_LABELS,
    MACHINE_BOOKING_STATUS_TONES,
    describeMachineBookingDiscount,
    formatMachineDuration,
    formatMachineSlot,
    describeBookingMachines,
    machineBookingService,
    type MachineBooking,
} from "@/lib/services/machineBookingService";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";
import { BookingSummary } from "../machineBookingCompletePage/bookingResult";

const TABLE_ID = "my-machine-bookings";
/** The lookup code is 6 digits. */
const CODE_LENGTH = 6;

const DISABLED_BUTTON = "disabled:cursor-not-allowed disabled:border-mist-300 disabled:bg-mist-300 disabled:text-mist-600";

type EmailValues = { lookupEmail: string };

const EMAIL_FIELDS: FormFieldConfig[] = [
    {
        name: "lookupEmail",
        type: "email",
        label: "Email",
        placeholder: "The email you booked with",
        autoComplete: "email",
        validation: validators.email(),
    },
];

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
                {booking.refundStatus === "refunded" && <span className="text-xs text-mist-500">Refunded</span>}
            </span>
        ),
    },
];

type Step =
    | { name: "email" }
    | { name: "code"; email: string }
    | { name: "list"; email: string; lookupToken: string; expiresAt: number };

/**
 * "My bookings" for guests: the email they booked with, then the 6 digit
 * code we email them, then a read-only list of their bookings. The lookup
 * token only lives in this page's state (gone on refresh), and the list
 * closes when the token runs out.
 */
export default function MachineBookingLookupPage() {
    const [step, setStep] = useState<Step>({ name: "email" });
    const reset = () => setStep({ name: "email" });

    return (
        <SectionWrapper className="bg-mist-100" containerClassName="flex justify-center">
            <div className={cn("w-full", step.name === "list" ? "max-w-5xl" : "max-w-140")}>
                <div className="flex flex-col gap-6 rounded-[10px] border border-border bg-white p-6 md:p-10">
                    <div className="flex flex-col gap-3">
                        <h1 className="text-2xl tracking-tight md:text-3xl">My machine bookings</h1>
                        <p className="text-base font-light text-mist-700">
                            {step.name === "email" &&
                                "Booked machine time without an account? Enter the email you booked with and we'll send you a code to see your bookings."}
                            {step.name === "code" && (
                                <>
                                    If there are bookings for <span className="font-medium text-mist-950">{step.email}</span>,
                                    we&apos;ve emailed a {CODE_LENGTH} digit code. Enter it below.
                                </>
                            )}
                            {step.name === "list" && (
                                <>
                                    Bookings made with <span className="font-medium text-mist-950">{step.email}</span>, newest
                                    first.
                                </>
                            )}
                        </p>
                    </div>

                    {step.name === "email" && (
                        <EmailStep onSent={(email) => setStep({ name: "code", email })} />
                    )}
                    {step.name === "code" && (
                        <CodeStep
                            email={step.email}
                            onVerified={(lookupToken, expiresInSeconds) =>
                                setStep({
                                    name: "list",
                                    email: step.email,
                                    lookupToken,
                                    expiresAt: Date.now() + expiresInSeconds * 1000,
                                })
                            }
                            onChangeEmail={reset}
                        />
                    )}
                    {step.name === "list" && (
                        <BookingsStep lookupToken={step.lookupToken} expiresAt={step.expiresAt} onReset={reset} />
                    )}
                </div>
            </div>
        </SectionWrapper>
    );
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<EmailValues>({ mode: "onTouched", defaultValues: { lookupEmail: "" } });

    const handleSubmit = async ({ lookupEmail }: EmailValues) => {
        setIsLoading(true);
        try {
            const email = lookupEmail.trim();
            await machineBookingService.sendLookupCode(email);
            onSent(email);
        } catch (err) {
            toast.error(
                err instanceof MandeApiError && err.status === 429
                    ? "Too many tries. Please wait a few minutes and try again."
                    : getErrorMessage(err, "Couldn't send the code. Please try again."),
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<EmailValues>
            methods={methods}
            fields={EMAIL_FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            renderFooter={({ isLoading, canSubmit }) => (
                <button
                    type="submit"
                    disabled={isLoading || !canSubmit}
                    className={cn(WEBSITE_PRIMARY_BUTTON, "w-full cursor-pointer py-2.5 sm:w-auto", DISABLED_BUTTON)}
                >
                    {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Mail className="size-4" aria-hidden />}
                    {isLoading ? "Sending..." : "Email me a code"}
                </button>
            )}
        />
    );
}

function CodeStep({
    email,
    onVerified,
    onChangeEmail,
}: {
    email: string;
    onVerified: (lookupToken: string, expiresInSeconds: number) => void;
    onChangeEmail: () => void;
}) {
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { secondsLeft, restart } = useCountdown(OTP_RESEND_SECONDS);

    const verify = async (value: string) => {
        if (value.length !== CODE_LENGTH || isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const { lookupToken, expiresInSeconds } = await machineBookingService.verifyLookupCode(email, value);
            onVerified(lookupToken, expiresInSeconds);
        } catch (err) {
            const message = getErrorMessage(err, "Couldn't check the code. Please try again.");
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const resend = async () => {
        if (secondsLeft > 0) return;
        restart();
        try {
            await machineBookingService.sendLookupCode(email);
            setCode("");
            setError(null);
            toast.success(`If there are bookings for ${email}, a new code is on its way.`);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't send a new code. Please try again."));
        }
    };

    return (
        <form
            className="flex flex-col items-center gap-6"
            onSubmit={(event) => {
                event.preventDefault();
                void verify(code);
            }}
        >
            <OtpInput
                length={CODE_LENGTH}
                value={code}
                onChange={(value) => {
                    setCode(value);
                    if (error) setError(null);
                    // Checks it as soon as the last digit is in
                    if (value.length === CODE_LENGTH) void verify(value);
                }}
                disabled={isLoading}
                error={!!error}
                name="lookupCode"
                autoFocus
            />
            {error && <p className="-mt-3 text-center text-sm text-secondary-700">{error}</p>}
            <button
                type="submit"
                disabled={isLoading || code.length !== CODE_LENGTH}
                className={cn(WEBSITE_PRIMARY_BUTTON, "w-full cursor-pointer py-2.5", DISABLED_BUTTON)}
            >
                {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {isLoading ? "Checking..." : "See my bookings"}
            </button>
            <div className="flex flex-col items-center gap-2 text-sm">
                {secondsLeft > 0 ? (
                    <span className="text-mist-500">
                        Didn&apos;t get it? You can ask for a new code in 0:{secondsLeft.toString().padStart(2, "0")}
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={() => void resend()}
                        className="cursor-pointer font-medium text-primary-800 underline-offset-4 hover:underline"
                    >
                        Send a new code
                    </button>
                )}
                <button
                    type="button"
                    onClick={onChangeEmail}
                    className="cursor-pointer text-mist-600 underline-offset-4 hover:text-mist-950 hover:underline"
                >
                    Use a different email
                </button>
            </div>
        </form>
    );
}

function BookingsStep({
    lookupToken,
    expiresAt,
    onReset,
}: {
    lookupToken: string;
    expiresAt: number;
    onReset: () => void;
}) {
    const [isExpired, setIsExpired] = useState(() => Date.now() >= expiresAt);
    const query = useQuery({
        queryKey: queryKeys.machineBookings.lookup(lookupToken),
        queryFn: () => machineBookingService.getLookupBookings(lookupToken),
        enabled: !isExpired,
        retry: false,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });
    const { rows, pagination } = useTableRows({
        tableId: TABLE_ID,
        data: isExpired ? [] : (query.data ?? []),
        rowsPerPage: 10,
    });

    // The list closes when the lookup token runs out
    useEffect(() => {
        const timer = window.setTimeout(() => setIsExpired(true), Math.max(0, expiresAt - Date.now()));
        return () => window.clearTimeout(timer);
    }, [expiresAt]);

    const tokenRejected = query.error instanceof MandeApiError && [401, 403].includes(query.error.status);

    const resetButton = (
        <button type="button" onClick={onReset} className={cn(WEBSITE_OUTLINE_BUTTON, "cursor-pointer")}>
            <RotateCcw className="size-4" aria-hidden />
            Check another email
        </button>
    );

    if (isExpired || tokenRejected) {
        return (
            <div className="flex flex-col items-start gap-4 rounded-lg bg-mist-100 p-5">
                <p className="text-sm text-mist-700">
                    For your privacy, this list closes after a while. Enter your email again to get a new code.
                </p>
                {resetButton}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <DataTable
                tableId={TABLE_ID}
                columns={COLUMNS}
                rows={rows}
                pagination={pagination}
                loading={query.isPending}
                error={query.isError ? "Couldn't load your bookings. Please try again." : undefined}
                emptyMessage="No bookings found for this email."
                viewAction={{
                    type: "sheet",
                    title: (booking) => `Booking ${booking.code}`,
                    content: (booking) => <BookingSummary booking={booking} showStatus />,
                }}
            />
            <div className="flex flex-wrap gap-3">
                {resetButton}
                {query.isError && (
                    <button
                        type="button"
                        onClick={() => void query.refetch()}
                        className={cn(WEBSITE_OUTLINE_BUTTON, "cursor-pointer")}
                    >
                        Try again
                    </button>
                )}
                <Link href={SERVICES_URL} className={WEBSITE_OUTLINE_BUTTON}>
                    Book machine time
                </Link>
            </div>
        </div>
    );
}
