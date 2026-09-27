"use client";

import { OptionsMenu } from "@/components/customTable/optionsMenu";
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
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-mist-500 font-text whitespace-nowrap">Sort by:</span>
            <OptionsMenu items={items} value={value} onChange={onChange} resetLabel={placeholder} />
        </div>
    );
}
