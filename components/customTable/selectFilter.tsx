"use client";

import { useState, useCallback, useContext } from "react";
import { ChevronDown } from "lucide-react";
import { TableIdContext, useTableParam } from "./tableContext";
import { useOutsideClickRef } from "./useOutsideClickRef";
import type { SelectFilterItem } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// SelectFilter
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectFilterProps {
    title: string;
    items: SelectFilterItem[];
    paramKey: string;
    /**
     * Renders a static label to the left of the button and swaps the
     * reset option's text to `placeholder` instead of `title` — matches
     * the "Sort by: All ⌄" pattern used for generic column sorting.
     * Omit for a regular standalone filter dropdown.
     */
    prefixLabel?: string;
    /** Idle/reset button text when prefixLabel is set. Defaults to "All". */
    placeholder?: string;
}

export function SelectFilter({
    title,
    items,
    paramKey,
    prefixLabel,
    placeholder = "All",
}: SelectFilterProps) {
    const tableId = useContext(TableIdContext);
    const { getParam, setParam } = useTableParam(tableId);
    const active = getParam(paramKey) ?? "";
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    const ref = useOutsideClickRef<HTMLDivElement>(close);

    const resetLabel = prefixLabel ? placeholder : title;
    const activeLabel = items.find((i) => i.value === active)?.label ?? resetLabel;

    const control = (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                className={[
                    "flex items-center gap-2 px-3 py-2 rounded-xs text-xs font-medium font-text cursor-pointer",
                    "border transition-all duration-300 whitespace-nowrap",
                    active
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-gray-50 border-gray-300 text-[#0B0B0B]/50 hover:border-gray-400",
                ].join(" ")}
            >
                {activeLabel}
                <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute top-full mt-1 right-0 z-50 min-w-35 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
                    <button
                        onClick={() => {
                            setParam(paramKey, "");
                            setOpen(false);
                        }}
                        className={[
                            "w-full text-left px-3 py-2 text-xs font-text transition-colors cursor-pointer whitespace-nowrap",
                            !active
                                ? "text-blue-700 bg-blue-50"
                                : "text-gray-700 hover:bg-gray-50",
                        ].join(" ")}
                    >
                        {resetLabel}
                    </button>
                    {items.map((item) => (
                        <button
                            key={item.value}
                            onClick={() => {
                                setParam(paramKey, item.value);
                                setOpen(false);
                            }}
                            className={[
                                "w-full text-left px-3 py-2 text-xs font-text transition-colors whitespace-nowrap",
                                active === item.value
                                    ? "text-blue-700 bg-blue-50"
                                    : "text-gray-700 hover:bg-gray-50",
                            ].join(" ")}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    if (!prefixLabel) return control;

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-text whitespace-nowrap">
                {prefixLabel}
            </span>
            {control}
        </div>
    );
}
