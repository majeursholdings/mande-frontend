"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Controller, useForm, useFormContext, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarIcon, XIcon } from "lucide-react";
import MainForm, { ErrorIcon, FormField } from "@/components/form";
import FormFieldsSkeleton from "./formFieldsSkeleton";
import type { FormFieldConfig, SelectOption } from "@/components/form/types";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    DEFAULT_MACHINE_BOOKING_SCHEDULE,
    DEFAULT_MAX_MACHINES_PER_BOOKING,
    WEEKDAY_LABELS,
    WEEKDAY_SHORT_LABELS,
    type MachineBookingSchedule,
    type MachineBookingSettings,
    type MachineBookingUnit,
    type UpdateMachineBookingSettingsPayload,
} from "@/lib/services/machineBookingService";
import { getMachinePrice, machineService } from "@/lib/services/machineService";
import { queryKeys } from "@/lib/queryKeys";
import { SUPER_ADMIN_MACHINES_URL } from "@/constant/superAdmin";
import { getLagosNow, minutesToTime, timeToMinutes } from "@/lib/machineBookingSchedule";
import { getErrorMessage } from "@/lib/api";

type MachineBookingValues = {
    unit: MachineBookingUnit;
    maxDuration: string;
    maxMachinesPerBooking: string;
    openDays: number[];
    openTime: string;
    closeTime: string;
    slotMinutes: string;
    closedDates: string[];
    bookingWindowDays: string;
    minNoticeHours: string;
};

const MAX_DURATION_LIMIT = 720;
const MAX_MACHINES_LIMIT = 10;
/** Enough to tell whether any active machine has a price for the unit. */
const ACTIVE_MACHINES_LIMIT = 100;
const MAX_CLOSED_DATES = 366;
const MAX_WINDOW_DAYS = 365;
const MAX_NOTICE_HOURS = 168;

const UNIT_OPTIONS = [
    { label: "Per hour", value: "hour" },
    { label: "Per day", value: "day" },
];

const SLOT_OPTIONS: SelectOption[] = [
    { label: "Every 15 minutes", value: "15" },
    { label: "Every 30 minutes", value: "30" },
    { label: "Every hour", value: "60" },
];

/** Monday first, as the week is shown here (0 = Sunday ... 6 = Saturday). */
const WEEKDAYS_MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

const pad = (value: number) => String(value).padStart(2, "0");

/** "YYYY-MM-DD" of a day picked in the calendar (its local day, as it was shown). */
const toLocalDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** A "YYYY-MM-DD" as a local midnight, for the calendar. */
function fromDateKey(key: string): Date | undefined {
    const [year, month, day] = key.split("-").map(Number);
    return year && month && day ? new Date(year, month - 1, day) : undefined;
}

/** "Thu, 25 Dec 2026". */
function formatDateKey(key: string): string {
    const [year, month, day] = key.split("-").map(Number);
    if (!year || !month || !day) return key;
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

const getLagosToday = () => getLagosNow().dateKey;

const SCHEDULE_NOTE = "Changes apply to new bookings only. Bookings already made keep their date and time.";

/** Times every 15 minutes through the day, plus `current` when it's off that grid. */
function getTimeOptions(current: string): SelectOption[] {
    const times: string[] = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += 15) times.push(minutesToTime(minutes));
    if (current && !times.includes(current)) times.push(current);
    return times.sort().map((time) => ({ label: time, value: time }));
}

const isWholeNumberIn = (value: string, min: number, max: number) =>
    value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;

function getFields(unit: MachineBookingUnit): FormFieldConfig[] {
    const units = unit === "day" ? "days" : "hours";
    return [
        {
            name: "unit",
            type: "select",
            label: "Charged",
            options: UNIT_OPTIONS,
            description: "Whether machine time is booked and charged by the hour or by the day.",
            validation: { required: "Pick how it's charged" },
        },
        {
            name: "maxDuration",
            type: "number",
            label: `Longest booking (${units})`,
            description: `The most ${units} one booking can be for.`,
            min: 1,
            max: MAX_DURATION_LIMIT,
            validation: {
                required: "Enter a number",
                validate: (value: string) =>
                    isWholeNumberIn(value, 1, MAX_DURATION_LIMIT) || `Enter a whole number from 1 to ${MAX_DURATION_LIMIT}`,
            },
        },
        {
            name: "maxMachinesPerBooking",
            type: "number",
            label: "Machines per booking (max)",
            description: "The most machines a maker can pick for one booking.",
            min: 1,
            max: MAX_MACHINES_LIMIT,
            validation: {
                required: "Enter a number",
                validate: (value: string) =>
                    isWholeNumberIn(value, 1, MAX_MACHINES_LIMIT) || `Enter a whole number from 1 to ${MAX_MACHINES_LIMIT}`,
            },
        },
    ];
}

/** The schedule's own fields (rendered through FormField so they look like the rest of the form). */
function getScheduleFields(openTime: string, closeTime: string, unit: MachineBookingUnit): Record<string, FormFieldConfig> {
    return {
        openTime: {
            name: "openTime",
            type: "select",
            label: "Opening time",
            options: getTimeOptions(openTime),
            validation: { required: "Pick an opening time" },
        },
        closeTime: {
            name: "closeTime",
            type: "select",
            label: "Closing time",
            options: getTimeOptions(closeTime),
            validation: {
                required: "Pick a closing time",
                validate: (value: string, values: Record<string, unknown>) =>
                    timeToMinutes(value) > timeToMinutes(String(values.openTime ?? "")) ||
                    "Closing time must be after opening time",
            },
        },
        slotMinutes: {
            name: "slotMinutes",
            type: "select",
            label: "Start times",
            options: SLOT_OPTIONS,
            description:
                unit === "day"
                    ? "Day bookings always start at opening time."
                    : "How often a booking can start, counted from opening time.",
            validation: { required: "Pick how often bookings can start" },
        },
        bookingWindowDays: {
            name: "bookingWindowDays",
            type: "number",
            label: "Book up to (days ahead)",
            description: "How far ahead people can book.",
            min: 1,
            max: MAX_WINDOW_DAYS,
            validation: {
                required: "Enter a number of days",
                validate: (value: string) =>
                    isWholeNumberIn(value, 1, MAX_WINDOW_DAYS) || `Enter a whole number from 1 to ${MAX_WINDOW_DAYS}`,
            },
        },
        minNoticeHours: {
            name: "minNoticeHours",
            type: "number",
            label: "Minimum notice (hours)",
            description: "How long before the start time a booking must be made. 0 for none.",
            min: 0,
            max: MAX_NOTICE_HOURS,
            validation: {
                required: "Enter a number of hours",
                validate: (value: string) =>
                    isWholeNumberIn(value, 0, MAX_NOTICE_HOURS) || `Enter a whole number from 0 to ${MAX_NOTICE_HOURS}`,
            },
        },
    };
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <span className="flex items-center gap-1 text-xs font-normal font-text text-error-500">
            <ErrorIcon />
            {message}
        </span>
    );
}

/** Seven toggles, Monday first: the days the factory takes bookings. */
function OpenDaysField() {
    const { control } = useFormContext<MachineBookingValues>();
    return (
        <Controller
            name="openDays"
            control={control}
            rules={{ validate: (value: number[]) => value.length > 0 || "Pick at least one open day" }}
            render={({ field, fieldState }) => {
                const selected = field.value ?? [];
                const toggle = (day: number) => {
                    const next = selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day];
                    field.onChange(next.sort((a, b) => a - b));
                    field.onBlur();
                };
                return (
                    <div className="flex flex-col gap-1.5">
                        <span id="open-days-label" className="text-[#1F2937] text-sm font-medium font-text">
                            Open days
                        </span>
                        <div role="group" aria-labelledby="open-days-label" className="flex flex-wrap gap-2">
                            {WEEKDAYS_MONDAY_FIRST.map((day) => {
                                const isOpen = selected.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        aria-pressed={isOpen}
                                        aria-label={WEEKDAY_LABELS[day]}
                                        onClick={() => toggle(day)}
                                        className={cn(
                                            "h-10 min-w-14 rounded-lg border px-3 text-sm font-medium font-text transition-colors cursor-pointer",
                                            isOpen
                                                ? "border-secondary-700 bg-secondary-700 text-white hover:bg-secondary-900"
                                                : "border-gray-200 bg-white text-mist-700 hover:bg-mist-50",
                                        )}
                                    >
                                        {WEEKDAY_SHORT_LABELS[day]}
                                    </button>
                                );
                            })}
                        </div>
                        {fieldState.error ? (
                            <FieldError message={fieldState.error.message} />
                        ) : (
                            <span className="text-[#9CA3AF] text-xs font-normal font-text">
                                The days the factory takes bookings.
                            </span>
                        )}
                    </div>
                );
            }}
        />
    );
}

/** Dates the factory is shut (e.g. holidays): added from a calendar, listed soonest first. */
function ClosedDatesField() {
    const { control } = useFormContext<MachineBookingValues>();
    const [isOpen, setIsOpen] = useState(false);
    const today = getLagosToday();
    return (
        <Controller
            name="closedDates"
            control={control}
            render={({ field }) => {
                const dates = [...(field.value ?? [])].sort();
                const isFull = dates.length >= MAX_CLOSED_DATES;
                const add = (date: Date | undefined) => {
                    if (!date) return;
                    const key = toLocalDateKey(date);
                    if (key < today || dates.includes(key)) return;
                    field.onChange([...dates, key].sort());
                    setIsOpen(false);
                };
                const remove = (key: string) => field.onChange(dates.filter((d) => d !== key));
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[#1F2937] text-sm font-medium font-text">Closed dates</span>
                                <span className="text-[#9CA3AF] text-xs font-normal font-text">
                                    Days the factory is shut, e.g. public holidays. Nobody can book them.
                                </span>
                            </div>
                            <Popover open={isOpen} onOpenChange={setIsOpen}>
                                <PopoverTrigger
                                    render={
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isFull}
                                            className="h-10 gap-2 rounded-lg border-gray-200 px-3 text-sm font-medium font-text text-mist-950 cursor-pointer"
                                        >
                                            <CalendarIcon className="size-4 text-mist-500" />
                                            Add a closed date
                                        </Button>
                                    }
                                />
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={undefined}
                                        defaultMonth={fromDateKey(today)}
                                        onSelect={add}
                                        disabled={(date: Date) => {
                                            const key = toLocalDateKey(date);
                                            return key < today || dates.includes(key);
                                        }}
                                        autoFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        {dates.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-sm font-text text-mist-500">
                                No closed dates. The factory follows its open days.
                            </p>
                        ) : (
                            <ul className="flex flex-wrap gap-2">
                                {dates.map((key) => (
                                    <li
                                        key={key}
                                        className="inline-flex items-center gap-1 rounded-full bg-mist-100 py-1 pr-1 pl-3 text-sm font-text text-mist-950"
                                    >
                                        {formatDateKey(key)}
                                        <button
                                            type="button"
                                            onClick={() => remove(key)}
                                            aria-label={`Remove ${formatDateKey(key)}`}
                                            className="flex size-6 items-center justify-center rounded-full text-mist-500 hover:bg-mist-200 hover:text-mist-950 cursor-pointer"
                                        >
                                            <XIcon className="size-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {isFull && (
                            <span className="text-xs font-text text-mist-500">
                                That&apos;s the most closed dates there can be ({MAX_CLOSED_DATES}). Remove one to add another.
                            </span>
                        )}
                    </div>
                );
            }}
        />
    );
}

/** The booking schedule: open days, hours, start-time grid, closed dates, how far ahead and the notice needed. */
function ScheduleSection() {
    const methods = useFormContext<MachineBookingValues>();
    const { register, control, getValues, setValue } = methods;
    const { errors } = methods.formState;
    const [openTime, closeTime, unit] = useWatch({ control, name: ["openTime", "closeTime", "unit"] });
    const fields = getScheduleFields(openTime ?? "", closeTime ?? "", unit ?? "hour");

    // Closing has to stay after opening: check it again when opening moves
    useEffect(() => {
        if (methods.getFieldState("closeTime").isTouched) void methods.trigger("closeTime");
    }, [openTime, methods]);
    const renderField = (name: string) => (
        <FormField<MachineBookingValues>
            field={fields[name]}
            register={register}
            control={control}
            getValues={getValues}
            setValue={setValue}
            errors={errors}
            hideRequiredMark
        />
    );

    return (
        <div className="flex flex-col gap-4 border-t border-border pt-5">
            <div className="flex flex-col gap-1">
                <h4 className="text-base font-medium font-text text-mist-950">Booking schedule</h4>
                <p className="text-sm font-text text-mist-500">When people can book time on the machines.</p>
            </div>
            <p className="rounded-lg bg-mist-50 px-4 py-3 text-sm font-text text-mist-700">{SCHEDULE_NOTE}</p>
            <OpenDaysField />
            <div className="flex flex-col gap-4 md:flex-row">
                {renderField("openTime")}
                {renderField("closeTime")}
            </div>
            {renderField("slotMinutes")}
            <ClosedDatesField />
            <div className="flex flex-col gap-4 md:flex-row">
                {renderField("bookingWindowDays")}
                {renderField("minNoticeHours")}
            </div>
        </div>
    );
}

function toValues(settings: MachineBookingSettings): MachineBookingValues {
    const schedule: MachineBookingSchedule = settings.schedule ?? DEFAULT_MACHINE_BOOKING_SCHEDULE;
    const today = getLagosToday();
    return {
        unit: settings.unit,
        maxDuration: String(settings.maxDuration),
        maxMachinesPerBooking: String(settings.maxMachinesPerBooking ?? DEFAULT_MAX_MACHINES_PER_BOOKING),
        openDays: [...schedule.openDays].sort((a, b) => a - b),
        openTime: schedule.openTime,
        closeTime: schedule.closeTime,
        slotMinutes: String(schedule.slotMinutes),
        // Past closed dates no longer matter, so they're left off
        closedDates: [...new Set(schedule.closedDates)].filter((date) => date >= today).sort(),
        bookingWindowDays: String(schedule.bookingWindowDays),
        minNoticeHours: String(schedule.minNoticeHours),
    };
}

/**
 * "Bookings are closed until a machine has a price per hour": shown while no
 * active machine is priced for the chosen unit (prices live on the machines).
 */
function NoPricedMachineNotice({ unit }: { unit: MachineBookingUnit }) {
    const machinesQuery = useQuery({
        queryKey: queryKeys.machines.list({ status: "active", limit: ACTIVE_MACHINES_LIMIT }),
        queryFn: () => machineService.listMachines({ status: "active", limit: ACTIVE_MACHINES_LIMIT }),
        staleTime: 30_000,
    });
    const machines = machinesQuery.data?.machines;
    if (!machines || machines.some((machine) => getMachinePrice(machine, unit) !== null)) return null;
    return (
        <p className="rounded-lg bg-warning-50 px-4 py-3 text-sm font-text text-warning-800">
            Bookings are closed until a machine has a price per {unit}.{" "}
            <Link href={SUPER_ADMIN_MACHINES_URL} className="font-medium underline underline-offset-2">
                Go to Machines
            </Link>
        </p>
    );
}

/**
 * How machine time is booked (by the hour or day, the longest booking and
 * the most machines per booking) and when it can be booked (the schedule).
 * Prices live on each machine. Saved together: the whole object, schedule
 * included.
 */
export default function MachineBookingSettingsForm({
    settings,
    onSave,
}: {
    settings: MachineBookingSettings;
    onSave: (settings: UpdateMachineBookingSettingsPayload) => Promise<void>;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<MachineBookingValues>({
        mode: "onTouched",
        defaultValues: toValues(settings),
    });
    const unit = useWatch({ control: methods.control, name: "unit" }) ?? settings.unit;
    const { isDirty } = methods.formState;

    const handleSubmit = async (values: MachineBookingValues) => {
        setIsLoading(true);
        try {
            await onSave({
                unit: values.unit,
                maxDuration: Number(values.maxDuration),
                maxMachinesPerBooking: Number(values.maxMachinesPerBooking),
                schedule: {
                    openDays: [...values.openDays].sort((a, b) => a - b),
                    openTime: values.openTime,
                    closeTime: values.closeTime,
                    slotMinutes: Number(values.slotMinutes) as MachineBookingSchedule["slotMinutes"],
                    closedDates: [...values.closedDates].sort(),
                    bookingWindowDays: Number(values.bookingWindowDays),
                    minNoticeHours: Number(values.minNoticeHours),
                },
            });
            methods.reset(values);
            toast.success("Machine booking saved");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't save the machine booking settings. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <NoPricedMachineNotice unit={unit} />
            <p className="rounded-lg bg-mist-50 px-4 py-3 text-sm font-text text-mist-700">
                Prices are set on each machine, per hour and per day.{" "}
                <Link href={SUPER_ADMIN_MACHINES_URL} className="font-medium text-secondary-700 hover:underline">
                    Manage machines and prices
                </Link>
            </p>
            <MainForm<MachineBookingValues>
                methods={methods}
                fields={getFields(unit)}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                rowPairs={[["maxDuration", "maxMachinesPerBooking"]]}
                hideRequiredMarks
                footerSlot={<ScheduleSection />}
                renderFooter={({ isLoading, canSubmit }) => (
                    <div className="flex justify-end">
                        <FormSubmitButton
                            label="Save machine booking"
                            loadingLabel="Saving..."
                            isLoading={isLoading}
                            disabled={!canSubmit || !isDirty}
                            className="w-auto px-6"
                        />
                    </div>
                )}
            />
        </div>
    );
}

/** This form while the settings load: the labels show, the values are skeletons. */
export function MachineBookingSettingsFormSkeleton() {
    const schedule = getScheduleFields("", "", "hour");
    return (
        <FormFieldsSkeleton
            fields={[
                ...getFields("hour"),
                { name: "openDays", label: "Open days", description: "The days the factory takes bookings." },
                schedule.openTime,
                schedule.closeTime,
                schedule.slotMinutes,
                {
                    name: "closedDates",
                    label: "Closed dates",
                    description: "Days the factory is shut, e.g. public holidays. Nobody can book them.",
                },
                schedule.bookingWindowDays,
                schedule.minNoticeHours,
            ].map(({ name, label, description }) => ({
                name,
                label: String(label ?? ""),
                description: typeof description === "string" ? description : undefined,
            }))}
            rowPairs={[
                ["maxDuration", "maxMachinesPerBooking"],
                ["openTime", "closeTime"],
                ["bookingWindowDays", "minNoticeHours"],
            ]}
            submitLabel="Save machine booking"
        />
    );
}
