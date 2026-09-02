"use client";

// ─────────────────────────────────────────────────────────────────────────────
// customTable — public barrel
//
// The implementation lives split across sibling files in this directory
// (types, hooks, toolbar pieces, cell helpers, the DataTable shell itself).
// Import everything from "@/components/customTable" as before; this file
// just re-exports the public surface so call sites don't need to know how
// it's organized internally.
// ─────────────────────────────────────────────────────────────────────────────

export type {
    ColumnDef,
    PaginationMeta,
    SelectFilterItem,
    FilterDef,
    SortOptionDef,
    ViewAction,
    EditAction,
    DeleteAction,
    LinkAction,
} from "./types";

export type { UseTableRowsOptions } from "./useTableRows";
export { useTableRows } from "./useTableRows";

export type { ExportCSVOptions } from "./exportToCsv";
export { exportToCSV } from "./exportToCsv";

export type { SearchInputProps } from "./searchInput";
export { SearchInput } from "./searchInput";

export type { SelectFilterProps } from "./selectFilter";
export { SelectFilter } from "./selectFilter";

export type { TableToolbarProps } from "./tableToolbar";
export { TableToolbar } from "./tableToolbar";

export type { StatusTone, StatusBadgeProps } from "./statusBadge";
export { StatusBadge } from "./statusBadge";

export type { AvatarCellProps } from "./avatarCell";
export { AvatarCell } from "./avatarCell";

export { RatingStars } from "./ratingStars";

export type { ToolbarActionButtonProps } from "./toolbarActionButton";
export { ToolbarActionButton } from "./toolbarActionButton";

export type { DataTableProps } from "./dataTable";
export { DataTable } from "./dataTable";
