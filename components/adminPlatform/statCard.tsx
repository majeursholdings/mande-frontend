import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A row of StatCards — swipeable on phones, two columns from sm, and four
 * from xl unless `columns` is 2 (for a narrow spot, like beside a profile
 * card).
 */
export function StatCardRow({ children, columns = 4 }: { children: ReactNode; columns?: 2 | 4 }) {
    return (
        <div
            className={cn(
                "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0",
                columns === 4 && "xl:grid-cols-4",
            )}
        >
            {children}
        </div>
    );
}

/** A headline number — its label over it, an icon in a coloured circle beside it, and a line under both. */
export function StatCard({
    label,
    value,
    fullValue,
    valueSuffix,
    icon: Icon,
    iconClassName,
    footer,
}: {
    label: string;
    value: string;
    /** The exact figure, on hover, when `value` is rounded (e.g. "₦1.2M"). */
    fullValue?: string;
    /** Small, after the value — e.g. "/12". */
    valueSuffix?: string;
    icon: LucideIcon;
    /** The circle's colour, e.g. "bg-primary-600". */
    iconClassName: string;
    footer: ReactNode;
}) {
    return (
        <div className="flex w-65 shrink-0 snap-start flex-col justify-between gap-4 rounded-xl border border-border bg-white p-5 sm:w-auto">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm font-text leading-tight text-mist-500">{label}</p>
                    <p title={fullValue} className="text-[28px] font-semibold font-text leading-tight text-mist-950">
                        {value}
                        {valueSuffix && <span className="ml-1 text-sm font-normal text-mist-500">{valueSuffix}</span>}
                    </p>
                </div>
                <span
                    className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-full text-white",
                        iconClassName,
                    )}
                >
                    <Icon className="size-6" strokeWidth={2} aria-hidden />
                </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-text text-mist-400">{footer}</div>
        </div>
    );
}
