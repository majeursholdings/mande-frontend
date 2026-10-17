"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import dayjs from "dayjs";
import { BadgePercent, LogIn } from "lucide-react";
import MainForm from "@/components/form";
import type { FormFieldConfig, SelectOption } from "@/components/form/types";
import { clearFormUploadedFiles } from "@/components/form/fileInput";
import { isPhoneNumber, validators } from "@/components/form/form.validators";
import type { CloudinaryUploadResult } from "@/lib/services/cloudinaryService";
import {
    MACHINE_BOOKING_RETURN_PATH,
    formatMachineDuration,
    machineBookingService,
    type MachineBookingPricing,
    type MachineBookingUnit,
    type PublicMachine,
} from "@/lib/services/machineBookingService";
import {
    describeSchedule,
    getLagosNow,
    getMaxHoursInDay,
    getStartTimes,
    isDateBookable,
    type LagosNow,
} from "@/lib/machineBookingSchedule";
import { formatCouponValue } from "@/lib/services/couponService";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { mapApiProfileToManufacturerProfile } from "@/lib/mappers/profileMappers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getErrorMessage } from "@/lib/api";
import { MandeApiError } from "@/lib/types/api";
import { queryKeys } from "@/lib/queryKeys";
import { formatPrice, fromKobo } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ARTISAN_LOGIN_URL, PRIVACY_POLICY_URL, getLegalDocumentUrl } from "@/constant/navigation";
import {
    EMPTY_MANUFACTURER_PROFILE,
    MANUFACTURER_MACHINE_BOOKINGS_URL,
    formatAddress,
} from "@/constant/manufacturer";
import LoadError from "../loadError";
import Notice from "../notice";
import { FormSubmitButton } from "./formButtons";
import FormFieldsSkeleton from "./formFieldsSkeleton";
import MachinePicker, { MachinePickerSkeleton } from "./machinePicker";
import CouponField, {
    getCouponDiscountKobo,
    getCouponErrorMessage,
    pickBestDiscount,
    type AppliedCoupon,
} from "./couponField";

// Named apart from other forms' fields: MainForm uses field names as input ids
type MachineBookingFormValues = {
    bookingFullName: string;
    bookingEmail: string;
    bookingPhone: string;
    bookingAddress: string;
    bookingIdCard: CloudinaryUploadResult | null;
    bookingMachineIds: string[];
    bookingDuration: string;
    bookingDate: string;
    bookingStartTime: string;
    bookingDetails: string;
    bookingMarketingOptIn: boolean;
};

const DEFAULT_VALUES: MachineBookingFormValues = {
    bookingFullName: "",
    bookingEmail: "",
    bookingPhone: "",
    bookingAddress: "",
    bookingIdCard: null,
    bookingMachineIds: [],
    bookingDuration: "",
    bookingDate: "",
    bookingStartTime: "",
    bookingDetails: "",
    bookingMarketingOptIn: false,
};

const ROW_PAIRS: [string, string][] = [
    ["bookingEmail", "bookingPhone"],
    ["bookingDate", "bookingStartTime"],
];

const MAX_DETAILS_LENGTH = 1000;
/** Longest booking offered as a dropdown; longer ones are typed in. */
const MAX_DURATION_OPTIONS = 24;

/** Images (JPG, PNG, WebP) or a PDF. */
const ID_CARD_ACCEPT = ".jpg, .jpeg, .png, .webp, .pdf, image/jpeg, image/png, image/webp, application/pdf";

/** A Lagos "YYYY-MM-DD" as a local date at midnight (what the date picker compares against). */
function dateKeyToLocalDate(dateKey: string): Date {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
}

/** The picker's value (an ISO string of a local midnight) as "YYYY-MM-DD", or null. */
function toDateKey(value: string | undefined): string | null {
    return value ? dayjs(value).format("YYYY-MM-DD") : null;
}

const unitLabel = (unit: MachineBookingUnit) => (unit === "day" ? "days" : "hours");

/** The highest % off any plan gives, or 0. */
export function getHighestMachineDiscount(pricing: Pick<MachineBookingPricing, "planDiscounts">): number {
    return pricing.planDiscounts.reduce((highest, plan) => Math.max(highest, plan.percent), 0);
}

/** The picked machines that can still be booked, in the order they're listed. */
function getSelectedMachines(machines: PublicMachine[], ids: string[] | undefined): PublicMachine[] {
    const picked = new Set(ids ?? []);
    return machines.filter((machine) => picked.has(machine.id));
}

/** The API's message about the picked machines (a 422 on `machineIds`), or null. */
function getMachineIdsError(err: unknown): string | null {
    if (!(err instanceof MandeApiError) || err.status !== 422) return null;
    const details = err.details;
    if (!details || Array.isArray(details)) return null;
    const value = (details as Record<string, unknown>).machineIds;
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
    return typeof value === "string" ? value : null;
}

const notBlank = (label: string) => (value: string) => value.trim().length > 0 || `${label} is required`;

/**
 * Books time on the factory machines: the booker's details and ID card, what
 * they need, and when. Shared by the website's booking modal and the
 * manufacturer app. A signed-in manufacturer's details are filled in and
 * their plan discount applied; the API works out the price it charges. On
 * submit it goes to the payment partner's checkout, which comes back to
 * `returnPath` with ?reference=. `initialMachineIds` starts it with those
 * machines picked (the website's machine pages pass the one being viewed).
 */
export default function MachineBookingForm({
    returnPath = MACHINE_BOOKING_RETURN_PATH,
    loginNextPath = MANUFACTURER_MACHINE_BOOKINGS_URL,
    className,
    initialMachineIds,
}: {
    returnPath?: string;
    /** Where the "Log in" link lands after logging in (a /manufacturer/ path). */
    loginNextPath?: string;
    className?: string;
    /** Machines picked to start with; any that can't be booked now are left out. */
    initialMachineIds?: string[];
}) {
    const pricingQuery = useQuery({
        queryKey: queryKeys.machineBookings.pricing(),
        queryFn: () => machineBookingService.getPricing(),
        staleTime: 60_000,
        retry: 1,
    });
    const { data: currentUser, isPending: isUserPending } = useCurrentUser();
    const isManufacturer = currentUser?.role === "manufacturer";
    const profileQuery = useQuery({
        queryKey: queryKeys.profile.details(),
        queryFn: () => manufacturerService.getProfile(),
        enabled: isManufacturer,
        staleTime: 60_000,
    });

    const methods = useForm<MachineBookingFormValues>({
        mode: "onTouched",
        defaultValues: { ...DEFAULT_VALUES, bookingMachineIds: initialMachineIds ?? [] },
    });
    const [isLoading, setIsLoading] = useState(false);
    // "Now" in Lagos, taken once: the API checks the notice again when the booking is made
    const [now] = useState<LagosNow>(() => getLagosNow());
    const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [watchedDate, watchedDuration, watchedMachineIds] = useWatch({
        control: methods.control,
        name: ["bookingDate", "bookingDuration", "bookingMachineIds"],
    });
    // The key each ID card upload is tied to, by its public id (the API needs both)
    const uploadKeys = useRef(new Map<string, string>());

    // Fills in the signed-in user's details, leaving anything already typed
    useEffect(() => {
        if (!currentUser) return;
        const { getValues, setValue } = methods;
        const fill = (name: keyof MachineBookingFormValues, value: string) => {
            if (value && !getValues(name)) setValue(name, value, { shouldDirty: false });
        };
        if (isManufacturer && profileQuery.data) {
            const profile = mapApiProfileToManufacturerProfile(profileQuery.data, EMPTY_MANUFACTURER_PROFILE);
            fill("bookingFullName", `${profile.firstName} ${profile.lastName}`.trim());
            fill("bookingEmail", profile.email || currentUser.email);
            fill("bookingPhone", profile.phoneNumber);
            fill("bookingAddress", formatAddress(profile.companyAddress));
            return;
        }
        const profile = (currentUser.profile ?? {}) as { firstName?: string; lastName?: string; phone?: string };
        fill("bookingFullName", [profile.firstName, profile.lastName].filter(Boolean).join(" "));
        fill("bookingEmail", currentUser.email);
        fill("bookingPhone", profile.phone ?? "");
    }, [currentUser, isManufacturer, profileQuery.data, methods]);

    const pricing = pricingQuery.data;
    // Open while at least one machine can be booked (prices live on the machines)
    const isOpen = !!pricing && pricing.machines.length > 0;
    const selectedMachines = useMemo(
        () => getSelectedMachines(pricing?.machines ?? [], watchedMachineIds),
        [pricing, watchedMachineIds],
    );
    /** Per unit: the picked machines' prices added up. */
    const rateKobo = selectedMachines.reduce((sum, machine) => sum + machine.priceKobo, 0);
    const schedule = pricing?.schedule;
    const unit = pricing?.unit ?? "hour";
    const durationValue = Number(watchedDuration) || 0;
    const dateKey = toDateKey(watchedDate);

    // The start times for the chosen date and duration (all of them before a date is picked)
    const startTimes = useMemo(
        () => (schedule ? getStartTimes(schedule, unit, durationValue, dateKey, now) : []),
        [schedule, unit, durationValue, dateKey, now],
    );

    // Keeps the date and start time valid as the duration and date change: a
    // date with no start time left is cleared, a start time that no longer
    // fits is cleared, and day bookings always start at opening time
    useEffect(() => {
        if (!schedule) return;
        const { getValues, setValue } = methods;
        if (dateKey && !isDateBookable(schedule, unit, durationValue, dateKey, now)) {
            setValue("bookingDate", "", { shouldValidate: false });
        }
        const current = getValues("bookingStartTime");
        if (unit === "day") {
            if (current !== schedule.openTime) setValue("bookingStartTime", schedule.openTime);
        } else if (current && !startTimes.includes(current)) {
            setValue("bookingStartTime", "");
        }
    }, [schedule, unit, durationValue, dateKey, now, startTimes, methods]);

    const fields = useMemo<FormFieldConfig[]>(() => {
        if (!pricing) return [];
        const unitWord = unitLabel(pricing.unit);
        const { schedule } = pricing;
        // An hour booking has to end by closing time on the same day
        const maxDuration = Math.max(
            1,
            pricing.unit === "hour" ? Math.min(pricing.maxDuration, getMaxHoursInDay(schedule)) : pricing.maxDuration,
        );
        const startTimeOptions: SelectOption[] = startTimes.map((time) => ({ value: time, label: time }));
        const durationField: FormFieldConfig =
            maxDuration <= MAX_DURATION_OPTIONS
                ? {
                      name: "bookingDuration",
                      type: "select",
                      label: `Duration (${unitWord})`,
                      placeholder: `How many ${unitWord}?`,
                      options: Array.from({ length: maxDuration }, (_, i) => ({
                          value: String(i + 1),
                          label: formatMachineDuration(i + 1, pricing.unit),
                      })),
                      validation: { required: "Choose how long you need" },
                  }
                : {
                      name: "bookingDuration",
                      type: "number",
                      label: `Duration (${unitWord})`,
                      placeholder: `1 to ${maxDuration}`,
                      inputMode: "numeric",
                      min: 1,
                      max: maxDuration,
                      step: 1,
                      validation: {
                          required: "Enter how long you need",
                          validate: (value: string) => {
                              const n = Number(value);
                              return (
                                  (Number.isInteger(n) && n >= 1 && n <= maxDuration) ||
                                  `Enter a whole number from 1 to ${maxDuration}`
                              );
                          },
                      },
                  };

        return [
            {
                name: "bookingFullName",
                type: "text",
                label: "Full name",
                placeholder: "e.g. Ada Okafor",
                autoComplete: "name",
                maxLength: 120,
                validation: { required: "Full name is required", validate: notBlank("Full name") },
            },
            {
                name: "bookingEmail",
                type: "email",
                label: "Email",
                placeholder: "you@example.com",
                autoComplete: "email",
                validation: validators.email(),
            },
            {
                name: "bookingPhone",
                type: "tel",
                label: "Phone number",
                placeholder: "e.g. 0801 234 5678",
                autoComplete: "tel",
                validation: {
                    required: "Phone number is required",
                    validate: (value: string) => isPhoneNumber(value) || "Enter a valid phone number",
                },
            },
            {
                name: "bookingAddress",
                type: "text",
                label: "Address",
                placeholder: "Street, city and state",
                autoComplete: "street-address",
                maxLength: 300,
                validation: { required: "Address is required", validate: notBlank("Address") },
            },
            {
                name: "bookingIdCard",
                type: "file",
                label: "ID card",
                description: "A photo or scan of a government ID (NIN card, passport or driver's licence). JPG, PNG, WebP or PDF, up to 5MB.",
                accept: ID_CARD_ACCEPT,
                acceptImages: true,
                maxFiles: 1,
                maxSizeMB: 5,
                upload: async (file, onProgress, signal) => {
                    const result = await machineBookingService.uploadIdCard(file, onProgress, signal);
                    uploadKeys.current.set(result.publicId, result.uploadKey);
                    return result;
                },
                validation: { required: "Add your ID card" },
            },
            durationField,
            {
                name: "bookingDate",
                type: "date",
                label: "Date",
                placeholder: "Pick a date",
                description: describeSchedule(schedule),
                minDate: dateKeyToLocalDate(now.dateKey),
                maxDate: dayjs(dateKeyToLocalDate(now.dateKey)).add(schedule.bookingWindowDays, "day").toDate(),
                isDateDisabled: (date: Date) =>
                    !isDateBookable(schedule, pricing.unit, durationValue, dayjs(date).format("YYYY-MM-DD"), now),
                validation: { required: "Pick a date" },
            },
            pricing.unit === "day"
                ? {
                      name: "bookingStartTime",
                      type: "select",
                      label: "Start time",
                      options: [{ value: schedule.openTime, label: schedule.openTime }],
                      disabled: true,
                      description: `Day bookings start at ${schedule.openTime}.`,
                      validation: { required: "Choose a start time" },
                  }
                : {
                      name: "bookingStartTime",
                      type: "select",
                      label: "Start time",
                      placeholder: startTimeOptions.length > 0 ? "Choose a time" : "No times left that day",
                      options: startTimeOptions,
                      description:
                          durationValue > 0
                              ? `Times that finish by ${schedule.closeTime}.`
                              : `Every ${schedule.slotMinutes} minutes from ${schedule.openTime}.`,
                      validation: { required: "Choose a start time" },
                  },
            {
                name: "bookingDetails",
                type: "textarea",
                label: "What you're making or cutting",
                placeholder: "e.g. Cutting 12 sheets of 18mm plywood into wardrobe panels, then edge banding.",
                rows: 4,
                validation: {
                    required: "Tell us what you're making or cutting",
                    validate: notBlank("This"),
                    maxLength: { value: MAX_DETAILS_LENGTH, message: `Keep it to ${MAX_DETAILS_LENGTH} characters` },
                },
            },
            {
                name: "bookingMarketingOptIn",
                type: "checkbox",
                label: "Email me news and offers from MANDE. You can unsubscribe at any time.",
            },
        ];
    }, [pricing, now, startTimes, durationValue]);

    const handleSubmit = async (values: MachineBookingFormValues) => {
        if (!pricing || !isOpen) return;
        setIsLoading(true);
        let redirecting = false;
        try {
            const card = values.bookingIdCard;
            const uploadKey = card ? uploadKeys.current.get(card.publicId) : undefined;
            if (!card || !uploadKey) {
                toast.error("Add your ID card, then try again.");
                return;
            }
            const machineIds = getSelectedMachines(pricing.machines, values.bookingMachineIds).map((machine) => machine.id);
            if (machineIds.length === 0) {
                methods.setError("bookingMachineIds", { message: "Pick at least one machine" });
                toast.error("Pick at least one machine, then try again.");
                return;
            }
            const { checkoutUrl } = await machineBookingService.createBooking({
                fullName: values.bookingFullName.trim(),
                email: values.bookingEmail.trim(),
                phone: values.bookingPhone.trim(),
                address: values.bookingAddress.trim(),
                machineIds,
                details: values.bookingDetails.trim(),
                date: dayjs(values.bookingDate).format("YYYY-MM-DD"),
                startTime: pricing.unit === "day" ? pricing.schedule.openTime : values.bookingStartTime,
                duration: Number(values.bookingDuration),
                idCard: { publicId: card.publicId, uploadKey, name: card.originalName },
                ...(coupon ? { couponCode: coupon.coupon.code } : {}),
                marketingOptIn: values.bookingMarketingOptIn,
                returnPath,
            });
            clearFormUploadedFiles("bookingIdCard");
            redirecting = true;
            window.location.assign(checkoutUrl);
        } catch (err) {
            const couponMessage = getCouponErrorMessage(err);
            const machinesMessage = getMachineIdsError(err);
            if (couponMessage) {
                setCouponError(couponMessage);
                toast.error(couponMessage);
            } else if (err instanceof MandeApiError && err.code === "BOOKING_NOT_OPEN") {
                toast.error(getErrorMessage(err, "Machine booking isn't open right now. Please try again later."));
                void pricingQuery.refetch();
            } else if (machinesMessage) {
                methods.setError("bookingMachineIds", { message: machinesMessage });
                toast.error(machinesMessage);
                // A machine may have just been changed or taken off: show what can be booked now
                void pricingQuery.refetch();
            } else {
                toast.error(getErrorMessage(err, "Couldn't start your booking. Please try again."));
            }
        } finally {
            // Stays busy while the checkout opens, so it can't be sent twice
            if (!redirecting) setIsLoading(false);
        }
    };

    if (pricingQuery.isError) {
        return (
            <LoadError className={className}>
                We couldn&apos;t load machine booking right now. Please refresh the page to try again.
            </LoadError>
        );
    }

    if (!pricing) {
        return (
            <div className={cn("flex flex-col gap-5", className)}>
                <Skeleton className="h-11 w-full rounded-lg" />
                <MachinePickerSkeleton />
                <FormFieldsSkeleton
                    fields={[
                        { name: "bookingFullName", label: "Full name" },
                        { name: "bookingEmail", label: "Email" },
                        { name: "bookingPhone", label: "Phone number" },
                        { name: "bookingAddress", label: "Address" },
                        { name: "bookingDuration", label: "Duration" },
                        { name: "bookingDate", label: "Date" },
                        { name: "bookingStartTime", label: "Start time" },
                    ]}
                    rowPairs={ROW_PAIRS}
                    submitLabel="Continue to payment"
                />
            </div>
        );
    }

    const highestDiscount = getHighestMachineDiscount(pricing);
    const yourDiscount = pricing.yourDiscountPercent;
    const loginHref = `${ARTISAN_LOGIN_URL}?next=${encodeURIComponent(loginNextPath)}`;

    if (!isOpen) {
        return (
            <div className={cn("flex flex-col gap-5", className)}>
                <Notice tone="warning" className="text-sm">
                    <p className="font-medium">Machine booking isn&apos;t open right now</p>
                    <p>
                        There are no machines to book at the moment. Please check back soon, or contact us to arrange time on
                        the machines.
                    </p>
                </Notice>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-5", className)}>
            {yourDiscount && yourDiscount > 0 ? (
                <DiscountBanner>
                    Your {pricing.yourPlanName ?? "MANDE"} plan saves you {yourDiscount}% on this booking.
                </DiscountBanner>
            ) : yourDiscount === null && !currentUser && !isUserPending && highestDiscount > 0 ? (
                <Link
                    href={loginHref}
                    className="group flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-text text-primary-900 transition-colors hover:bg-primary-100"
                >
                    <LogIn className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                    <span>
                        <span className="font-semibold underline-offset-2 group-hover:underline">
                            Log in to get up to {highestDiscount}% off
                        </span>
                        <span className="text-primary-800"> with a MANDE plan. Anyone can book at the standard prices.</span>
                    </span>
                </Link>
            ) : yourDiscount === 0 && highestDiscount > 0 ? (
                <Notice>
                    Your plan doesn&apos;t include a machine discount. Plans with one save up to {highestDiscount}% on every booking.
                </Notice>
            ) : null}

            <Controller
                name="bookingMachineIds"
                control={methods.control}
                rules={{
                    validate: (ids: string[]) =>
                        getSelectedMachines(pricing.machines, ids).length > 0 || "Pick at least one machine",
                }}
                render={({ field, fieldState }) => (
                    <MachinePicker
                        machines={pricing.machines}
                        max={Math.max(1, pricing.maxMachines)}
                        unit={pricing.unit}
                        value={field.value ?? []}
                        onChange={(ids) => {
                            field.onChange(ids);
                            if (ids.length > 0) methods.clearErrors("bookingMachineIds");
                        }}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                        disabled={isLoading}
                        initialMachineIds={initialMachineIds}
                    />
                )}
            />

            <MainForm<MachineBookingFormValues>
                methods={methods}
                fields={fields}
                rowPairs={ROW_PAIRS}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                footerSlot={(values) => {
                    const duration = Number(values.bookingDuration) || 0;
                    return (
                        <div className="flex flex-col gap-4">
                            <CouponField
                                kind="booking"
                                amountKobo={rateKobo * duration}
                                email={values.bookingEmail}
                                applied={coupon}
                                onApply={(applied) => {
                                    setCoupon(applied);
                                    setCouponError(null);
                                }}
                                onRemove={() => {
                                    setCoupon(null);
                                    setCouponError(null);
                                }}
                                disabled={isLoading}
                                disabledReason={
                                    selectedMachines.length === 0
                                        ? "Pick your machines first."
                                        : `Choose how many ${unitLabel(pricing.unit)} you need first.`
                                }
                                error={couponError}
                            />
                            <PriceSummary
                                pricing={pricing}
                                machines={selectedMachines}
                                duration={duration}
                                coupon={coupon}
                            />
                        </div>
                    );
                }}
                renderFooter={({ isLoading, canSubmit }) => (
                    <div className="flex flex-col gap-3">
                        <FormSubmitButton
                            label="Continue to payment"
                            loadingLabel="Opening checkout..."
                            isLoading={isLoading}
                            disabled={!canSubmit || selectedMachines.length === 0}
                            className="w-full"
                        />
                        <p className="text-center text-xs font-text text-mist-500">
                            By booking, you agree to our{" "}
                            <Link href={getLegalDocumentUrl("machine-booking-policy")} target="_blank" rel="noreferrer" className="font-medium text-mist-700 underline underline-offset-2 hover:text-mist-950">
                                Machine booking policy
                            </Link>{" "}
                            and{" "}
                            <Link href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer" className="font-medium text-mist-700 underline underline-offset-2 hover:text-mist-950">
                                Privacy policy
                            </Link>
                            .
                        </p>
                    </div>
                )}
            />
        </div>
    );
}

function DiscountBanner({ children }: { children: React.ReactNode }) {
    return (
        <p className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium font-text text-primary-900">
            <BadgePercent className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {children}
        </p>
    );
}

/**
 * What the booking costs: each picked machine's price per unit, their sum x
 * the duration, then the plan discount or the coupon (the best one only, they
 * never stack) and the total. The API works out the same price when the
 * booking is made.
 */
function PriceSummary({
    pricing,
    machines,
    duration,
    coupon,
}: {
    pricing: MachineBookingPricing;
    /** The picked machines. */
    machines: PublicMachine[];
    duration: number;
    coupon: AppliedCoupon | null;
}) {
    const unit = pricing.unit;
    const percent = pricing.yourDiscountPercent ?? 0;
    const rateKobo = machines.reduce((sum, machine) => sum + machine.priceKobo, 0);
    const subtotalKobo = rateKobo * duration;
    const isPriced = subtotalKobo > 0;
    const planDiscountKobo = Math.round((subtotalKobo * percent) / 100);
    const couponDiscountKobo = getCouponDiscountKobo(coupon, subtotalKobo);
    const best = pickBestDiscount(planDiscountKobo, couponDiscountKobo);
    const totalKobo = subtotalKobo - best.discountKobo;
    const money = (kobo: number) => formatPrice(fromKobo(kobo));
    const planLabel = `${pricing.yourPlanName ? `${pricing.yourPlanName} plan discount` : "Plan discount"} (${percent}%)`;

    // Before machines and a duration are picked there's nothing to compare: show what each would take off
    const couponWins = isPriced ? best.source === "coupon" : !!coupon && percent === 0;
    const planShown = percent > 0 && !couponWins;

    let note: string | null = null;
    if (coupon && isPriced) {
        if (best.source === "coupon") note = `Coupon ${coupon.coupon.code} applied.`;
        else if (planDiscountKobo > couponDiscountKobo) note = "Your plan discount is bigger, so it's used instead.";
        else note = "Your plan discount saves the same, so it's used instead.";
    }

    return (
        <dl className="flex flex-col gap-2 rounded-lg bg-mist-100 p-4 text-sm font-text text-mist-700" aria-live="polite">
            {machines.length === 0 ? (
                <div className="flex items-center justify-between gap-4">
                    <dt>Machines</dt>
                    <dd className="font-medium text-mist-950">Pick up to {pricing.maxMachines}</dd>
                </div>
            ) : (
                machines.map((machine) => (
                    <div key={machine.id} className="flex items-baseline justify-between gap-4">
                        <dt className="min-w-0 wrap-anywhere">{machine.name}</dt>
                        <dd className="shrink-0 font-medium text-mist-950">
                            {money(machine.priceKobo)} per {unit}
                        </dd>
                    </div>
                ))
            )}
            {machines.length > 1 && (
                <div className="flex items-center justify-between gap-4 border-t border-mist-200 pt-2">
                    <dt>Combined rate</dt>
                    <dd className="font-medium text-mist-950">
                        {money(rateKobo)} per {unit}
                    </dd>
                </div>
            )}
            <div className="flex items-center justify-between gap-4">
                <dt>
                    {duration > 0 && machines.length > 0
                        ? `${formatMachineDuration(duration, unit)} x ${money(rateKobo)}`
                        : "Duration"}
                </dt>
                <dd className="font-medium text-mist-950">
                    {duration > 0
                        ? machines.length > 0
                            ? money(subtotalKobo)
                            : formatMachineDuration(duration, unit)
                        : `Choose ${unitLabel(unit)}`}
                </dd>
            </div>
            {planShown && (
                <div className="flex items-center justify-between gap-4 text-primary-800">
                    <dt>{planLabel}</dt>
                    <dd className="font-medium">{isPriced ? `-${money(planDiscountKobo)}` : `${percent}% off`}</dd>
                </div>
            )}
            {coupon && couponWins && (
                <div className="flex items-center justify-between gap-4 text-primary-800">
                    <dt>Coupon {coupon.coupon.code}</dt>
                    <dd className="font-medium">
                        {isPriced ? `-${money(couponDiscountKobo)}` : formatCouponValue(coupon.coupon)}
                    </dd>
                </div>
            )}
            {note && <p className="text-xs text-mist-700">{note}</p>}
            <div className="mt-1 flex items-center justify-between gap-4 border-t border-mist-200 pt-3">
                <dt className="font-semibold text-mist-950">Total</dt>
                <dd className="text-base font-semibold text-mist-950">{isPriced ? money(totalKobo) : "-"}</dd>
            </div>
        </dl>
    );
}
