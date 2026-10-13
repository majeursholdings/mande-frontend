import {
    formatOpenDays,
    type MachineBookingSchedule,
    type MachineBookingUnit,
} from "@/lib/services/machineBookingService";

// ─────────────────────────────────────────────────────────────────────────────
// The booking schedule rules, the same ones the API checks: a date within
// today..today+bookingWindowDays (Lagos), on an open day and not a closed
// date; a start on the slot grid from openTime that ends by closeTime (hour
// bookings) or exactly openTime (day bookings); and at least minNoticeHours
// from now. Dates are "YYYY-MM-DD" and times "HH:mm", both Lagos time.
// ─────────────────────────────────────────────────────────────────────────────

/** "Now" in Lagos: today's date and the minutes since midnight. */
export type LagosNow = { dateKey: string; minutes: number };

/** "08:30" -> 510. */
export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
}

/** 510 -> "08:30". */
export function minutesToTime(total: number): string {
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function getLagosNow(at: Date = new Date()): LagosNow {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-CA", {
            timeZone: "Africa/Lagos",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
        })
            .formatToParts(at)
            .map((part) => [part.type, part.value]),
    );
    return {
        dateKey: `${parts.year}-${parts.month}-${parts.day}`,
        minutes: Number(parts.hour) * 60 + Number(parts.minute),
    };
}

function dateKeyToUtc(dateKey: string): number {
    const [year, month, day] = dateKey.split("-").map(Number);
    return Date.UTC(year, (month || 1) - 1, day || 1);
}

/** Whole days from `fromKey` to `toKey`. */
export function daysBetween(fromKey: string, toKey: string): number {
    return Math.round((dateKeyToUtc(toKey) - dateKeyToUtc(fromKey)) / 86_400_000);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekdayOf(dateKey: string): number {
    return new Date(dateKeyToUtc(dateKey)).getUTCDay();
}

/** Open on that date: within the booking window, an open day and not a closed date. */
export function isDateOpen(schedule: MachineBookingSchedule, dateKey: string, now: LagosNow): boolean {
    const ahead = daysBetween(now.dateKey, dateKey);
    if (ahead < 0 || ahead > schedule.bookingWindowDays) return false;
    if (!schedule.openDays.includes(weekdayOf(dateKey))) return false;
    return !schedule.closedDates.includes(dateKey);
}

/** The longest hour booking that fits in one day's opening hours. */
export function getMaxHoursInDay(schedule: MachineBookingSchedule): number {
    return Math.floor((timeToMinutes(schedule.closeTime) - timeToMinutes(schedule.openTime)) / 60);
}

/**
 * The start times that can be booked: every slot from openTime that ends by
 * closeTime (hour bookings), or openTime alone (day bookings). With a date,
 * times sooner than the notice allows are left out.
 */
export function getStartTimes(
    schedule: MachineBookingSchedule,
    unit: MachineBookingUnit,
    duration: number,
    dateKey: string | null,
    now: LagosNow,
): string[] {
    const open = timeToMinutes(schedule.openTime);
    const close = timeToMinutes(schedule.closeTime);
    const starts: number[] = [];
    if (unit === "day") {
        starts.push(open);
    } else {
        const length = Math.max(1, duration) * 60;
        const step = Math.max(1, schedule.slotMinutes);
        for (let start = open; start + length <= close; start += step) starts.push(start);
    }
    if (!dateKey) return starts.map(minutesToTime);
    const earliest = now.minutes + schedule.minNoticeHours * 60;
    const dayOffset = daysBetween(now.dateKey, dateKey) * 24 * 60;
    return starts.filter((start) => dayOffset + start >= earliest).map(minutesToTime);
}

/** The date is open and still has a start time that can be booked. */
export function isDateBookable(
    schedule: MachineBookingSchedule,
    unit: MachineBookingUnit,
    duration: number,
    dateKey: string,
    now: LagosNow,
): boolean {
    return isDateOpen(schedule, dateKey, now) && getStartTimes(schedule, unit, duration, dateKey, now).length > 0;
}

/** "Open Mon to Sat, 08:00 to 17:00. Book at least 2 hours ahead." */
export function describeSchedule(schedule: MachineBookingSchedule): string {
    const hours = `Open ${formatOpenDays(schedule.openDays)}, ${schedule.openTime} to ${schedule.closeTime}.`;
    if (schedule.minNoticeHours <= 0) return hours;
    const notice = schedule.minNoticeHours;
    return `${hours} Book at least ${notice} hour${notice === 1 ? "" : "s"} ahead.`;
}
