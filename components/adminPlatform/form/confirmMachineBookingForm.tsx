"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig, SelectOption } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { describeSchedule, getLagosNow, getStartTimes, isDateBookable } from "@/lib/machineBookingSchedule";
import {
    machineBookingService,
    type ConfirmMachineBookingPayload,
    type MachineBooking,
    type MachineBookingSchedule,
} from "@/lib/services/machineBookingService";
import { FormSubmitButton } from "./formButtons";

type ConfirmValues = { date: string; startTime: string; note: string };

const NOTE_MAX_LENGTH = 500;

/**
 * The start times a booking can have on a date under the current schedule
 * (the slot grid within opening hours, for its duration and unit). On the
 * booking's own date its own start time stays too: it was valid when booked,
 * and only a changed slot has to follow the schedule as it is now.
 */
function getStartTimeOptions(booking: MachineBooking, schedule: MachineBookingSchedule | null, date: string): string[] {
    if (!schedule) return [booking.startTime];
    const times = date ? getStartTimes(schedule, booking.unit, booking.duration, date, getLagosNow()) : [];
    if (date === booking.date && !times.includes(booking.startTime)) times.push(booking.startTime);
    return times.sort();
}

const toOptions = (times: string[]): SelectOption[] => times.map((time) => ({ label: time, value: time }));

/** "2026-10-14" as the date field holds it: the ISO time of that local midnight. */
function toDateFieldValue(date: string): string {
    const [year, month, day] = date.split("-").map(Number);
    if (!year || !month || !day) return "";
    return new Date(year, month - 1, day).toISOString();
}

/** The date field's value back to "YYYY-MM-DD", read in local time as it was picked. */
function fromDateFieldValue(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Confirming a paid machine booking: the slot they asked for, which staff
 * can move (a new date or start time), and an optional note for the booker.
 * A new slot follows the current booking schedule (open days, closed dates,
 * opening hours and the start-time grid); the booking's own slot can always
 * be kept. Only what changed is sent.
 */
export default function ConfirmMachineBookingForm({
    booking,
    onConfirm,
    onCancel,
}: {
    booking: MachineBooking;
    onConfirm: (payload: ConfirmMachineBookingPayload) => Promise<void>;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<ConfirmValues>({
        mode: "onTouched",
        defaultValues: { date: toDateFieldValue(booking.date), startTime: booking.startTime, note: "" },
    });

    // The schedule as it is now (the pricing carries it)
    const scheduleQuery = useQuery({
        queryKey: queryKeys.machineBookings.pricing(),
        queryFn: () => machineBookingService.getPricing(),
        staleTime: 60_000,
    });
    const schedule = scheduleQuery.data?.schedule ?? null;
    const canMove = !!schedule;

    const dateValue = useWatch({ control: methods.control, name: "date" });
    const date = dateValue ? fromDateFieldValue(dateValue) : "";
    const startTimes = getStartTimeOptions(booking, schedule, date);
    const startTimesKey = startTimes.join(",");

    // A start time the new date doesn't offer is cleared, so a valid one has to be picked
    useEffect(() => {
        const current = methods.getValues("startTime");
        if (current && !startTimesKey.split(",").includes(current)) {
            methods.setValue("startTime", "", { shouldValidate: false });
        }
    }, [startTimesKey, methods]);

    const fields: FormFieldConfig[] = [
        {
            name: "date",
            type: "date",
            label: "Date",
            disabled: !canMove,
            // The booking's own date stays pickable; any other has to be open with a start time left
            isDateDisabled: (day: Date) => {
                const key = fromDateFieldValue(day.toISOString());
                if (key === booking.date) return false;
                return !schedule || !isDateBookable(schedule, booking.unit, booking.duration, key, getLagosNow());
            },
            validation: { required: "Pick a date" },
        },
        {
            name: "startTime",
            type: "select",
            label: "Start time",
            placeholder: startTimes.length ? "Pick a time" : "No start times that day",
            disabled: !canMove,
            options: toOptions(startTimes),
            validation: {
                required: "Pick a start time",
                validate: (value: string) => startTimes.includes(value) || "Pick one of the start times",
            },
        },
        {
            name: "note",
            type: "textarea",
            label: "Note for the booker (optional)",
            placeholder: "e.g. Bring your cutting list, and ask for Tunde at the gate",
            height: 100,
            validation: {
                maxLength: { value: NOTE_MAX_LENGTH, message: `Keep it under ${NOTE_MAX_LENGTH} characters` },
            },
        },
    ];

    const handleSubmit = async (values: ConfirmValues) => {
        setIsLoading(true);
        try {
            const date = fromDateFieldValue(values.date);
            const payload: ConfirmMachineBookingPayload = {};
            if (date && date !== booking.date) payload.date = date;
            if (values.startTime && values.startTime !== booking.startTime) payload.startTime = values.startTime;
            const note = values.note.trim();
            if (note) payload.note = note;
            await onConfirm(payload);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't confirm the booking. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ConfirmValues>
            methods={methods}
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            rowPairs={[["date", "startTime"]]}
            hideRequiredMarks
            footerSlot={
                scheduleQuery.isPending ? (
                    <Skeleton className="h-4 w-64" />
                ) : schedule ? (
                    <p className="text-xs font-text text-mist-500">
                        A new slot follows the current schedule. {describeSchedule(schedule)}
                    </p>
                ) : (
                    <p className="text-xs font-text text-error-700">
                        We couldn&apos;t load the booking schedule, so the slot can&apos;t be moved right now. You can still
                        confirm the slot they booked.
                    </p>
                )
            }
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <FormSubmitButton
                        label="Confirm booking"
                        loadingLabel="Confirming..."
                        isLoading={isLoading}
                        disabled={!canSubmit}
                        className="w-auto px-5"
                    />
                </div>
            )}
        />
    );
}
