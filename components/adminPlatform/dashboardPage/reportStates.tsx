import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// The report screens' error state: a short line when a report couldn't load.
// (Numbers still loading are OverviewCard's own loading state.)
// ─────────────────────────────────────────────────────────────────────────────

/** A report that couldn't load: one short line where it would have been. */
export function ReportError({ message, className }: { message: string; className?: string }) {
    return (
        <p role="alert" className={cn("text-sm font-text text-error-600", className)}>
            {message}
        </p>
    );
}
