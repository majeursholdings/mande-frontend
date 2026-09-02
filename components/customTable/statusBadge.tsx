// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge — the "• Inactive" dot style and the solid "In progress" pill
// style seen across the different table variants. Use inside a ColumnDef's
// `cell` for a status column.
// ─────────────────────────────────────────────────────────────────────────────

export type StatusTone = "green" | "amber" | "red" | "gray" | "blue";

export interface StatusBadgeProps {
    label: string;
    tone?: StatusTone;
    /** "dot" (default) — small colored dot + text. "pill" — solid rounded badge. */
    variant?: "dot" | "pill";
}

const STATUS_DOT_CLASS: Record<StatusTone, string> = {
    green: "bg-primary-500",
    amber: "bg-amber-500",
    red: "bg-secondary-500",
    gray: "bg-gray-400",
    blue: "bg-blue-500",
};

const STATUS_TEXT_CLASS: Record<StatusTone, string> = {
    green: "text-primary-700",
    amber: "text-amber-600",
    red: "text-secondary-700",
    gray: "text-gray-500",
    blue: "text-blue-700",
};

const STATUS_PILL_CLASS: Record<StatusTone, string> = {
    green: "bg-primary-50 text-primary-700",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-secondary-50 text-secondary-700",
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-50 text-blue-700",
};

export function StatusBadge({
    label,
    tone = "gray",
    variant = "dot",
}: StatusBadgeProps) {
    if (variant === "pill") {
        return (
            <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-text whitespace-nowrap ${STATUS_PILL_CLASS[tone]}`}
            >
                {label}
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium font-text whitespace-nowrap ${STATUS_TEXT_CLASS[tone]}`}
        >
            <span className={`size-1.5 rounded-full shrink-0 ${STATUS_DOT_CLASS[tone]}`} />
            {label}
        </span>
    );
}
