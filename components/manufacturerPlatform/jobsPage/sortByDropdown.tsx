"use client";

import { useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOutsideClickRef } from "@/hooks/useOutsideClickRef";
import type { SelectFilterItem } from "@/components/customTable/types";

// ─────────────────────────────────────────────────────────────────────────────
// SortByDropdown — same "Sort by: All ⌄" look as SelectFilter's prefixLabel
// variant, but state lives with the caller instead of the URL/table context —
// the jobs board isn't a <DataTable>, so there's no tableId to namespace by.
// ─────────────────────────────────────────────────────────────────────────────

export function SortByDropdown({
    items,
    value,
    onChange,
    placeholder = "All",
}: {
    items: SelectFilterItem[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    const ref = useOutsideClickRef<HTMLDivElement>(close);
    const activeLabel = items.find((i) => i.value === value)?.label ?? placeholder;

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-mist-500 font-text whitespace-nowrap">Sort by:</span>
            <div ref={ref} className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-button text-xs font-medium font-text cursor-pointer",
                        "border transition-all duration-300 whitespace-nowrap",
                        value
                            ? "bg-blue-50 border-blue-500 text-blue-700"
                            : "bg-gray-50 border-gray-300 text-[#0B0B0B]/50 hover:border-gray-400",
                    )}
                >
                    {activeLabel}
                    <ChevronDown
                        className={cn(
                            "size-3.5 transition-transform duration-200",
                            open && "rotate-180",
                        )}
                    />
                </button>

                {open && (
                    <div className="absolute top-full mt-1 right-0 z-50 min-w-35 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => {
                                onChange("");
                                setOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-xs font-text transition-colors cursor-pointer whitespace-nowrap",
                                !value ? "text-blue-700 bg-blue-50" : "text-gray-700 hover:bg-gray-50",
                            )}
                        >
                            {placeholder}
                        </button>
                        {items.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => {
                                    onChange(item.value);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "w-full text-left px-3 py-2 text-xs font-text transition-colors whitespace-nowrap",
                                    value === item.value
                                        ? "text-blue-700 bg-blue-50"
                                        : "text-gray-700 hover:bg-gray-50",
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
