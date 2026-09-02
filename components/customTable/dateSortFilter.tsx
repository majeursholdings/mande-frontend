"use client";

import { useState, useCallback, useContext } from "react";
import { ChevronDown } from "lucide-react";
import { TableIdContext, useTableParam } from "./tableContext";
import { useOutsideClickRef } from "./useOutsideClickRef";

// ─────────────────────────────────────────────────────────────────────────────
// DateSortFilter
//
// A toolbar toggle that writes `${tableId}_sort` = "newest" | "oldest" to the
// URL. It is intentionally a separate component from SelectFilter so TypeScript
// makes it impossible to add to a table without also declaring `sortField` on
// useTableRows — keeping the contract explicit.
//
// Usage in TableToolbar:  dateSort={true}
// ─────────────────────────────────────────────────────────────────────────────

export function DateSortFilter() {
    const tableId = useContext(TableIdContext);
    const { getParam, setParam } = useTableParam(tableId);
    const active = getParam("sort") ?? "";
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    const ref = useOutsideClickRef<HTMLDivElement>(close);

    const options = [
        { label: "Newest first", value: "newest" },
        { label: "Oldest first", value: "oldest" },
    ];

    const activeLabel =
        options.find((o) => o.value === active)?.label ?? "Sort by date";

    return (
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
                <div className="absolute top-full mt-1 left-0 z-50 min-w-37 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
                    {/* Reset option */}
                    <button
                        onClick={() => {
                            setParam("sort", "");
                            setOpen(false);
                        }}
                        className={[
                            "w-full text-left px-3 py-2 text-xs font-text transition-colors",
                            !active
                                ? "text-blue-700 bg-blue-50"
                                : "text-gray-700 hover:bg-gray-50",
                        ].join(" ")}
                    >
                        Sort by date
                    </button>
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                setParam("sort", opt.value);
                                setOpen(false);
                            }}
                            className={[
                                "w-full text-left px-3 py-2 text-xs font-text transition-colors",
                                active === opt.value
                                    ? "text-blue-700 bg-blue-50"
                                    : "text-gray-700 hover:bg-gray-50",
                            ].join(" ")}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
