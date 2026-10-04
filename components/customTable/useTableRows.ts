"use client";

import { useDeferredValue, useMemo, useState } from "react";

import type { PaginationMeta, FilterDef, SortOptionDef } from "./types";
import { useTableParam } from "./tableContext";

// ─────────────────────────────────────────────────────────────────────────────
// useTableRows
//
// Client-side filtering + pagination driven entirely by the namespaced URL
// params of a given tableId. Use this when data lives in the client (already
// fetched). For server-side data, skip this and re-fetch on param
// change instead.
//
// Usage:
//   const { rows, pagination } = useTableRows({
//     tableId: "subscribers",
//     data: subscribers,
//     searchFields: ["organization", "ownerEmail", "id"],
//     filters: [
//       { paramKey: "status", field: "status" },
//       { paramKey: "plan",   field: "plan"   },
//     ],
//     rowsPerPage: 10,
//   });
// ─────────────────────────────────────────────────────────────────────────────

export interface UseTableRowsOptions<TRow> {
    tableId: string;
    /** Full unfiltered dataset */
    data: TRow[];
    /** Row fields to match the search query against (case-insensitive substring) */
    searchFields?: (keyof TRow)[];
    /** Select-filter bindings */
    filters?: FilterDef<TRow>[];
    rowsPerPage?: number;
    /**
     * The date field to sort by when a <DateSortFilter> is present in the
     * toolbar. Only provide this for tables that have date data.
     * The field value must be parseable by `new Date()`.
     * e.g. sortField: "joinedDate"
     */
    sortField?: keyof TRow;
    /**
     * Field-to-value mapping for a generic "Sort by" <SelectFilter
     * prefixLabel="Sort by:"> dropdown (e.g. sort by project name / date /
     * amount). Keyed off the `sortBy` URL param. Independent of sortField —
     * a table can use either mechanism, but not both.
     */
    sortOptions?: SortOptionDef<TRow>[];
}

export function useTableRows<TRow extends { id: string }>({
    tableId,
    data,
    searchFields = [],
    filters = [],
    rowsPerPage = 10,
    sortField,
    sortOptions,
}: UseTableRowsOptions<TRow>): { rows: TRow[]; pagination: PaginationMeta } {
    const { getParam } = useTableParam(tableId);

    const search = (getParam("search") ?? "").toLowerCase().trim();
    const page = Math.max(1, Number(getParam("page") ?? 1));
    // "newest" | "oldest" | "" — only applied when sortField is provided
    const sort = sortField ? (getParam("sort") ?? "") : "";
    // Generic "sort by field" value — only applied when sortOptions is provided
    const sortBy = sortOptions ? (getParam("sortBy") ?? "") : "";
    const filterValues = filters.map(({ paramKey }) => getParam(paramKey) ?? "");

    // Callers pass these as inline arrays (new every render): kept as one
    // object that only changes when what's in them does, for the memo below
    const optionsKey = [
        searchFields.map(String).join(","),
        filters.map(({ paramKey, field, matchMode }) => `${paramKey}:${String(field)}:${matchMode ?? ""}`).join(","),
        (sortOptions ?? []).map(({ value, field, type, direction }) => `${value}:${String(field)}:${type ?? ""}:${direction ?? ""}`).join(","),
    ].join("|");
    const [stableOptions, setStableOptions] = useState({ key: optionsKey, options: { searchFields, filters, sortOptions } });
    if (stableOptions.key !== optionsKey) {
        setStableOptions({ key: optionsKey, options: { searchFields, filters, sortOptions } });
    }
    const options = stableOptions.options;
    const filterKey = filterValues.join("\u0000");

    // A long list stays responsive while typing: the search applies once React has a moment
    const deferredSearch = useDeferredValue(search);

    // Filtered and sorted only when the rows or what's asked of them change
    const sorted = useMemo(() => {
        const { searchFields, filters, sortOptions } = options;
        const values = filterKey.split("\u0000");

        // 1. Search filter
        let result = data;
        if (deferredSearch && searchFields.length > 0) {
            result = result.filter((row) =>
                searchFields.some((field) =>
                    String(row[field] ?? "")
                        .toLowerCase()
                        .includes(deferredSearch),
                ),
            );
        }

        // 2. Select filters
        filters.forEach(({ field, matchMode = "exact" }, index) => {
            const value = values[index] ?? "";
            if (!value) return;
            result = result.filter((row) => {
                if (matchMode === "includes") {
                    const list = row[field];
                    return Array.isArray(list) && list.map(String).includes(value);
                }
                const raw = String(row[field] ?? "");
                if (matchMode === "floor") {
                    return String(Math.floor(parseFloat(raw))) === value;
                }
                return raw === value;
            });
        });

        // 3. Date sort — only runs when sortField is declared on useTableRows
        if (sortField && sort) {
            result = [...result].sort((a, b) => {
                const da = new Date(a[sortField] as string).getTime();
                const db = new Date(b[sortField] as string).getTime();
                return sort === "oldest" ? da - db : db - da; // default: newest first
            });
        }

        // 3b. Generic "sort by field" — only runs when sortOptions is declared
        const opt = sortOptions && sortBy ? sortOptions.find((o) => o.value === sortBy) : undefined;
        if (opt) {
            const { field, type = "string", direction } = opt;
            const dir = direction ?? (type === "date" ? "desc" : "asc");
            result = [...result].sort((a, b) => {
                const av = a[field];
                const bv = b[field];
                let cmp: number;
                if (type === "number") {
                    cmp = parseFloat(String(av)) - parseFloat(String(bv));
                } else if (type === "date") {
                    cmp = new Date(String(av)).getTime() - new Date(String(bv)).getTime();
                } else {
                    cmp = String(av ?? "").localeCompare(String(bv ?? ""));
                }
                return dir === "desc" ? -cmp : cmp;
            });
        }
        return result;
    }, [data, deferredSearch, filterKey, sortField, sort, sortBy, options]);

    const result = sorted;

    // 4. Pagination
    const total = result.length;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * rowsPerPage;
    const rows = result.slice(start, start + rowsPerPage);

    return { rows, pagination: { total, totalPages, rowsPerPage } };
}
