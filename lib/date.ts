/** "3 days left" / "1 week left" / "Past due" — relative-time label for a due date, used where a full date is too much (e.g. the mobile job detail countdown). */
export function getCountdownLabel(dueDate: Date, from: Date = new Date()): string {
    const diffDays = Math.ceil((dueDate.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Past due";
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} left`;

    const weeks = Math.round(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} left`;
}

/** "today" / "yesterday" / "3 days ago" / "2 weeks ago" — how long ago a past date was, e.g. when a job was posted. */
export function getTimeAgoLabel(date: Date, from: Date = new Date()): string {
    const diffDays = Math.floor((from.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    const weeks = Math.round(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

/** "just now" / "5 mins ago" / "2 hrs ago" / "yesterday" / "3 days ago" — for recent activity, down to the minute. */
export function getRelativeTimeLabel(date: Date, from: Date = new Date()): string {
    const diffMinutes = Math.floor((from.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;

    return getTimeAgoLabel(date, from);
}

/** "in 20 mins" / "in 5 hrs" / "in 2 days" — how long until a coming moment, e.g. an auto-approval. */
export function getTimeUntilLabel(date: Date, from: Date = new Date()): string {
    const diffMinutes = Math.max(1, Math.ceil((date.getTime() - from.getTime()) / (1000 * 60)));
    if (diffMinutes < 60) return `in ${diffMinutes} min${diffMinutes === 1 ? "" : "s"}`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 48) return `in ${diffHours} hr${diffHours === 1 ? "" : "s"}`;

    const diffDays = Math.floor(diffHours / 24);
    return `in ${diffDays} days`;
}

/**
 * "1 month 2 weeks and 5 days" — how long from `start` to `end`, in whole
 * calendar days (years and months first, then weeks and days).
 */
export function formatDuration(start: Date, end: Date): string {
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const to = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    if (to <= from) return "0 days";

    // `from` moved on by whole months — the day kept, or the month's last if it's shorter
    const addMonths = (count: number) => {
        const lastDay = new Date(from.getFullYear(), from.getMonth() + count + 1, 0).getDate();
        return new Date(from.getFullYear(), from.getMonth() + count, Math.min(from.getDate(), lastDay));
    };
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (addMonths(months) > to) months -= 1;
    const days = Math.round((to.getTime() - addMonths(months).getTime()) / (1000 * 60 * 60 * 24));

    const parts = (
        [
            [Math.floor(months / 12), "year"],
            [months % 12, "month"],
            [Math.floor(days / 7), "week"],
            [days % 7, "day"],
        ] as const
    )
        .filter(([count]) => count > 0)
        .map(([count, unit]) => `${count} ${unit}${count === 1 ? "" : "s"}`);
    return parts.length > 1 ? `${parts.slice(0, -1).join(" ")} and ${parts.at(-1)}` : parts[0];
}

/**
 * "10 days" / "4 weeks" / "2 months" — roughly how long from `start` to
 * `end`, in one unit, for a quick read (e.g. on a job card). See
 * formatDuration for the exact length.
 */
export function formatShortDuration(start: Date, end: Date): string {
    const from = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const to = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
    const [count, unit] =
        days < 14 ? [days, "day"] : days < 60 ? [Math.round(days / 7), "week"] : [Math.round(days / 30.44), "month"];
    return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

/** "Today • 2:04 PM" / "Yesterday • 1:20 PM" / "Mar 4th, 2022 • 11:26 AM" — when a note or message was posted. */
export function formatDayAndTime(date: Date, now: Date = new Date()): string {
    const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
    const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / (1000 * 60 * 60 * 24));
    const day = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : formatOrdinalDate(date);
    const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${day} • ${time}`;
}

function ordinalSuffix(day: number): string {
    if (day % 100 >= 11 && day % 100 <= 13) return "th";
    switch (day % 10) {
        case 1:
            return "st";
        case 2:
            return "nd";
        case 3:
            return "rd";
        default:
            return "th";
    }
}

/** "January 2022" */
export function formatMonthYear(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** "Mar 4th, 2022" */
export function formatOrdinalDate(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${month} ${day}${ordinalSuffix(day)}, ${year}`;
}
