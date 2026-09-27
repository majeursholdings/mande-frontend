"use client";

import { useContext } from "react";
import { TableIdContext, useTableParam } from "./tableContext";
import { OptionsMenu } from "./optionsMenu";
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

    const control = (
        <OptionsMenu
            items={items}
            value={getParam(paramKey) ?? ""}
            onChange={(value) => setParam(paramKey, value)}
            resetLabel={prefixLabel ? placeholder : title}
        />
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
