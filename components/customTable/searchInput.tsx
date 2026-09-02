"use client";

import { useContext } from "react";
import { Search } from "lucide-react";
import { TableIdContext, useTableParam } from "./tableContext";

// ─────────────────────────────────────────────────────────────────────────────
// SearchInput
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchInputProps {
    placeholder?: string;
    paramKey?: string;
}

export function SearchInput({
    placeholder = "Search...",
    paramKey = "search",
}: SearchInputProps) {
    const tableId = useContext(TableIdContext);
    const { getParam, setParam } = useTableParam(tableId);
    const value = getParam(paramKey) ?? "";

    return (
        <div className="relative flex items-center w-full max-w-sm">
            <Search className="absolute left-3 size-4 text-gray-400 pointer-events-none shrink-0" />
            <input
                type="text"
                value={value}
                onChange={(e) => setParam(paramKey, e.target.value)}
                placeholder={placeholder}
                className={[
                    "w-full pl-9 pr-4 py-2 rounded-xs cursor-pointer",
                    "bg-gray-50 border border-gray-300",
                    "text-xs text-[#0B0B0B]/50 placeholder:text-gray-400 font-text",
                    "outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
                    "transition-all duration-300",
                ].join(" ")}
            />
        </div>
    );
}
