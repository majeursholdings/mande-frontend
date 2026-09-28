"use client";

import { useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOutsideClickRef } from "@/hooks/useOutsideClickRef";

/**
 * A dashboard card's pill-shaped picker, in its header — e.g. Job Statistics'
 * Monthly/Weekly, or which activity to show. `label` names it for screen
 * readers ("Range: Monthly").
 */
export default function PillSelect<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const close = useCallback(() => setIsOpen(false), []);
    const ref = useOutsideClickRef<HTMLDivElement>(close);
    const selectedLabel = options.find((option) => option.value === value)?.label;

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                type="button"
                aria-label={`${label}: ${selectedLabel}`}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-full bg-secondary-50 px-3.5 py-1.5 text-sm font-medium font-text whitespace-nowrap text-secondary-700 cursor-pointer"
            >
                {selectedLabel}
                <ChevronDown className={cn("size-4 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 z-10 mt-1.5 min-w-32 rounded-lg border border-border bg-white py-1 shadow-lg">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "block w-full px-3.5 py-2 text-left text-sm font-text whitespace-nowrap cursor-pointer",
                                option.value === value
                                    ? "bg-secondary-50 text-secondary-700"
                                    : "text-mist-600 hover:bg-mist-50",
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
