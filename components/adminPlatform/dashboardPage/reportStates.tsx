import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "../statCard";

// ─────────────────────────────────────────────────────────────────────────────
// The report screens' loading and error states: a StatCard with its number
// still on the way, and a short line when a report couldn't load.
// ─────────────────────────────────────────────────────────────────────────────

/** A StatCard while its number loads: its `loading` state, for a card whose figure isn't known yet. */
export function StatCardSkeleton({
    label,
    icon,
    iconClassName,
}: {
    label: string;
    icon: LucideIcon;
    iconClassName: string;
}) {
    return <StatCard label={label} value="" icon={icon} iconClassName={iconClassName} footer={null} loading />;
}

/** A report that couldn't load: one short line where it would have been. */
export function ReportError({ message, className }: { message: string; className?: string }) {
    return (
        <p role="alert" className={cn("text-sm font-text text-error-600", className)}>
            {message}
        </p>
    );
}
