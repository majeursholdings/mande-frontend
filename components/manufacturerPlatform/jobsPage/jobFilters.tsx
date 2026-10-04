"use client";

import { useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutsideClickRef } from "@/hooks/useOutsideClickRef";

export type FilterOption<T extends string> = {
    value: T;
    label: string;
    /** Null while the list it counts is loading: a skeleton shows in its place. */
    count: number | null;
    /** A status colour dot before the label. */
    dotClass?: string;
};

type FilterProps<T extends string> = {
    options: FilterOption<T>[];
    value: T;
    onChange: (value: T) => void;
    /** Names the group for screen readers, e.g. "Job status". */
    label: string;
    className?: string;
};

function Count({ count, isActive }: { count: number | null; isActive: boolean }) {
    if (count === null) {
        return <Skeleton aria-hidden className="h-5 w-5 rounded-full" />;
    }
    return (
        <span
            className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-medium",
                isActive ? "bg-white/20 text-white" : "bg-mist-100 text-mist-600",
            )}
        >
            {count}
        </span>
    );
}

/**
 * A row of filter chips with counts — sits under the jobs page's tabs, so
 * it's styled apart from them.
 */
export function FilterChips<T extends string>({
    options,
    value,
    onChange,
    label,
    className,
}: FilterProps<T>) {
    return (
        <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
            {options.map((option) => {
                const isActive = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "flex items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-3 text-sm font-medium font-text whitespace-nowrap transition-colors cursor-pointer",
                            isActive
                                ? "border-mist-900 bg-mist-900 text-white"
                                : "border-border bg-white text-mist-600 hover:border-mist-300 hover:text-mist-900",
                        )}
                    >
                        {option.dotClass && (
                            <span className={cn("size-2 shrink-0 rounded-full", option.dotClass)} />
                        )}
                        {option.label}
                        <Count count={option.count} isActive={isActive} />
                    </button>
                );
            })}
        </div>
    );
}

/**
 * The same filter as a dropdown, for phones — where a row of chips would
 * fight the swipe between the jobs page's tabs.
 */
export function FilterDropdown<T extends string>({
    options,
    value,
    onChange,
    label,
    className,
}: FilterProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const close = useCallback(() => setIsOpen(false), []);
    const ref = useOutsideClickRef<HTMLDivElement>(close);
    const active = options.find((option) => option.value === value) ?? options[0];

    return (
        <div ref={ref} className={cn("relative", className)}>
            <button
                type="button"
                aria-label={`${label}: ${active.label}`}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-2 rounded-button border border-border bg-white px-4 py-2.5 cursor-pointer"
            >
                <span className="flex min-w-0 items-center gap-2">
                    {active.dotClass && (
                        <span className={cn("size-2 shrink-0 rounded-full", active.dotClass)} />
                    )}
                    <span className="truncate text-xs font-semibold tracking-wide text-mist-900 uppercase">
                        {active.label}
                    </span>
                    <Count count={active.count} isActive={false} />
                </span>
                <ChevronDown
                    className={cn(
                        "size-4 shrink-0 text-mist-500 transition-transform duration-200",
                        isOpen && "rotate-180",
                    )}
                />
            </button>

            {isOpen && (
                <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-white shadow-lg">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "flex w-full items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm font-text last:border-b-0 cursor-pointer",
                                option.value === value
                                    ? "font-semibold text-mist-950"
                                    : "text-mist-500",
                            )}
                        >
                            {option.label}
                            {option.count === null ? (
                                <Skeleton aria-hidden className="h-3 w-4" />
                            ) : (
                                <span className="text-xs text-mist-400">{option.count}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
