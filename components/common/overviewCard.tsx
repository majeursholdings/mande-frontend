import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// OverviewCard — every overview (stat) card's design: an icon tile beside a
// label and the big number, a line under it with a coloured dot (a second
// figure, in the dot's colour), and "See in details" to where the numbers
// come from. On a light grey ground: the white part lifts off the footer.
// The label and footer show while loading; only the numbers are skeletons.
// ─────────────────────────────────────────────────────────────────────────────

export type OverviewTone = "green" | "blue" | "amber" | "red" | "gray";

const TONE: Record<OverviewTone, { dot: string; text: string }> = {
    green: { dot: "bg-emerald-500", text: "text-emerald-600" },
    blue: { dot: "bg-sky-400", text: "text-sky-600" },
    amber: { dot: "bg-amber-400", text: "text-amber-600" },
    red: { dot: "bg-error-500", text: "text-error-600" },
    gray: { dot: "bg-mist-400", text: "text-mist-600" },
};

export type OverviewCardProps = {
    icon: LucideIcon;
    label: string;
    /** The big number, formatted. */
    value: ReactNode;
    /** Its full form, for a shortened value (e.g. ₦1.2M): shown on hover. */
    fullValue?: string;
    /** The line under it: a second figure. */
    detail?: { label: string; value: ReactNode; tone: OverviewTone };
    /** Beside the label, e.g. a rank badge. */
    badge?: ReactNode;
    /** "See in details": where the numbers come from. Without it, no footer. */
    href?: string;
    linkLabel?: string;
    loading?: boolean;
};

export default function OverviewCard({
    icon: Icon,
    label,
    value,
    fullValue,
    detail,
    badge,
    href,
    linkLabel = "See in details",
    loading = false,
}: OverviewCardProps) {
    const tone = detail ? TONE[detail.tone] : null;

    return (
        <section className="flex flex-col rounded-2xl border border-mist-200 bg-mist-50 font-text">
            <div className="flex flex-col rounded-2xl border-b border-mist-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <div className="flex items-center gap-4 p-5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-mist-200 bg-white text-mist-500 shadow-[0_1px_3px_rgba(16,24,40,0.08)]">
                        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate text-sm text-mist-600">{label}</h3>
                            {!loading && badge}
                        </div>
                        {loading ? (
                            <Skeleton className="mt-1 h-7 w-24" />
                        ) : (
                            <p className="truncate text-2xl font-semibold tabular-nums text-mist-950" title={fullValue}>
                                {value}
                            </p>
                        )}
                    </div>
                </div>
                {detail && tone && (
                    <div className="flex items-center justify-between gap-3 border-t border-mist-100 px-5 py-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-mist-600">
                            <span className={cn("size-2 shrink-0 rounded-full", tone.dot)} aria-hidden />
                            <span className="truncate">{detail.label}</span>
                        </span>
                        {loading ? (
                            <Skeleton className="h-4 w-12" />
                        ) : (
                            <span className={cn("shrink-0 font-semibold tabular-nums", tone.text)}>{detail.value}</span>
                        )}
                    </div>
                )}
            </div>
            {href && (
                <Link
                    href={href}
                    className="group flex items-center justify-between rounded-b-2xl px-5 py-3 text-sm text-mist-600 outline-none transition-colors hover:text-mist-950 focus-visible:ring-2 focus-visible:ring-secondary-300"
                >
                    {linkLabel}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
            )}
        </section>
    );
}

/** A row of overview cards: one column on phones, two on tablets, up to four. */
export function OverviewCardGrid({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 gap-4 sm:grid-cols-2",
                columns === 3 && "xl:grid-cols-3",
                columns === 4 && "xl:grid-cols-4",
            )}
        >
            {children}
        </div>
    );
}
