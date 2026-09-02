import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Column / table shape
// ─────────────────────────────────────────────────────────────────────────────

export interface ColumnDef<TRow> {
    key: string;
    header?: ReactNode;
    className?: string;
    cell?: (row: TRow) => ReactNode;
}

export interface PaginationMeta {
    total: number;
    totalPages: number;
    rowsPerPage: number;
}

export interface SelectFilterItem {
    label: string;
    value: string;
}

/**
 * Describes one filterable field for useTableRows.
 * `paramKey` must match the paramKey used in the <SelectFilter> for that field.
 * `field`    is the key on TRow to compare against.
 */
export interface FilterDef<TRow> {
    paramKey: string;
    field: keyof TRow;
    /**
     * How to compare the filter value against the row field value.
     * - "exact" (default) — full string equality: "active" === "active"
     * - "floor" — Math.floor the row value then compare: Math.floor(4.8) === 4
     *             Use this for numeric ratings stored as decimal strings ("4.8").
     */
    matchMode?: "exact" | "floor";
}

/**
 * One option in a generic "Sort by" toolbar dropdown (see <SelectFilter
 * prefixLabel="Sort by:">). Unlike the date-only newest/oldest toggle,
 * this lets a table offer sorting by any number of fields — e.g.
 * "Project name" / "Date" / "Amount".
 */
export interface SortOptionDef<TRow> {
    /** Matches the `value` of the corresponding SelectFilterItem */
    value: string;
    field: keyof TRow;
    /** How to compare field values. Defaults to "string". */
    type?: "string" | "number" | "date";
    /** Sort direction. Defaults to "asc" for string/number, "desc" for date. */
    direction?: "asc" | "desc";
}

// ─────────────────────────────────────────────────────────────────────────────
// Row action types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Eye icon.
 * - "link"  → renders a Next.js <Link>; parent provides the href per row.
 * - "popup" → renders a <button>; parent fires any side-effect (sheet, modal…)
 */
export type ViewAction<TRow> =
    | { type: "link"; href: (row: TRow) => string }
    | { type: "popup"; onClick: (row: TRow) => void }
    | {
          type: "sheet";
          /** Sheet header title. Defaults to "Details" if omitted. */
          title?: (row: TRow) => ReactNode;
          /** Sheet body content. */
          content: (row: TRow) => ReactNode;
      };

/**
 * Pencil icon.
 * - "dialog" (default) → opens the built-in Edit dialog; parent owns body + onConfirm.
 * - "link"              → renders a Next.js <Link> instead, no dialog at all.
 *                          Use when editing happens on its own page/route.
 */
export type EditAction<TRow> =
    | {
          type?: "dialog";
          /** Body rendered inside the dialog. ReactNode so the parent decides layout. */
          dialogContent: (row: TRow) => ReactNode;
          onConfirm: (row: TRow) => void;
          /** Confirm button label. Defaults to "Save changes". */
          confirmLabel?: string;
      }
    | {
          type: "link";
          href: (row: TRow) => string;
      };

/**
 * Trash icon — always opens the built-in Delete dialog.
 * Header is auto-generated: "Delete <dataType>?"
 * Parent owns the body copy and the confirm handler.
 */
export interface DeleteAction<TRow> {
    /**
     * Singular noun for the record type used in the dialog header.
     * e.g. dataType="Subscriber" → "Delete Subscriber?"
     */
    dataType: string;
    /** Body rendered inside the dialog. */
    dialogContent: (row: TRow) => ReactNode;
    onConfirm: (row: TRow) => void;
}

/**
 * Plain text link in the actions cell — no icon.
 * Use for "View details", "View receipt", "View more", etc.
 * Rendered as a Next.js <Link> after the icon group.
 */
export interface LinkAction<TRow> {
    /** Visible link text */
    label: string;
    /**
     * Returns the path + any *new* params to set (e.g. "/reviews?review=R-001").
     * When mergeParams is true (default), existing URL params are preserved and
     * only the params in this href are merged in — so table state (page, filters,
     * sort) is never lost.
     */
    href: (row: TRow) => string;
    /** Optional icon rendered after the label text. */
    linkIcon?: ReactNode;
    /**
     * When true (default), merges the href params into the current URL instead of
     * replacing them — preserving table state (pagination, filters, sort).
     * Set to false to navigate to the exact href as-is.
     */
    mergeParams?: boolean;
}
