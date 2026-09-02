"use client";

import type { ReactNode } from "react";
import { SearchInput, type SearchInputProps } from "./searchInput";
import { SelectFilter, type SelectFilterProps } from "./selectFilter";
import { DateSortFilter } from "./dateSortFilter";

// ─────────────────────────────────────────────────────────────────────────────
// TableToolbar
// ─────────────────────────────────────────────────────────────────────────────

export interface TableToolbarProps {
    search?: SearchInputProps;
    /** Up to 3 select filters */
    filters?: SelectFilterProps[];
    /**
     * Enable the "Sort by date" toggle.
     * Only meaningful when `sortField` is also declared on useTableRows.
     */
    dateSort?: boolean;
    /**
     * Generic "Sort by: <field> ⌄" dropdown — e.g. sort by project name,
     * date, or amount. Only meaningful when `sortOptions` is also declared
     * on useTableRows. Renders right-aligned, before `actions`.
     */
    sortBy?: Omit<SelectFilterProps, "paramKey"> & { paramKey?: string };
    actions?: ReactNode;
}

export function TableToolbar({
    search,
    filters = [],
    dateSort = false,
    sortBy,
    actions,
}: TableToolbarProps) {
    return (
        <div className="p-4 my-4 mt-4 md:mb-6 bg-white rounded-[10px] border border-gray-200">
            <div className="flex flex-wrap gap-4 items-center">
                {search && <SearchInput {...search} />}
                {filters.slice(0, 3).map((f) => (
                    <SelectFilter key={f.paramKey} {...f} />
                ))}
                {dateSort && <DateSortFilter />}
                {(sortBy || actions) && (
                    <div className="flex items-center gap-3 ml-auto">
                        {sortBy && (
                            <SelectFilter
                                {...sortBy}
                                paramKey={sortBy.paramKey ?? "sortBy"}
                                prefixLabel={sortBy.prefixLabel ?? "Sort by:"}
                            />
                        )}
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
