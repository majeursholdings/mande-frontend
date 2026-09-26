/** "3 days left" / "1 week left" / "Past due" — relative-time label for a due date, used where a full date is too much (e.g. the mobile job detail countdown). */
export function getCountdownLabel(dueDate: Date, from: Date = new Date()): string {
    const diffDays = Math.ceil((dueDate.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Past due";
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} left`;

    const weeks = Math.round(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} left`;
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
