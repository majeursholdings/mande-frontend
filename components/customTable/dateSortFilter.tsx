"use client";

import { useContext } from "react";
import { TableIdContext, useTableParam } from "./tableContext";
import { OptionsMenu } from "./optionsMenu";

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

const OPTIONS = [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
];

export function DateSortFilter() {
    const tableId = useContext(TableIdContext);
    const { getParam, setParam } = useTableParam(tableId);

    return (
        <OptionsMenu
            items={OPTIONS}
            value={getParam("sort") ?? ""}
            onChange={(value) => setParam("sort", value)}
            resetLabel="Sort by date"
            align="start"
        />
    );
}
