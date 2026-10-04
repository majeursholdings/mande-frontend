"use client";

import {
    useState,
    useCallback,
    type MouseEvent,
    type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { TableIdContext, useTableParam } from "./tableContext";
import { TableDialog } from "./tableDialog";
import { RowActionsMenu } from "./rowActionsMenu";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeletonRows } from "./tableSkeletonRows";
import type {
    ColumnDef,
    PaginationMeta,
    ViewAction,
    EditAction,
    DeleteAction,
    LinkAction,
    RowAction,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// getPageNumbers — windowed page list with ellipsis gaps, e.g.
// [1, 2, 3, 4, 5], [1, "…", 4, 5, 6, "…", 20]
// ─────────────────────────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | "…")[] {
    const siblingCount = 1;
    const totalSlots = siblingCount * 2 + 5; // first, last, current, 2 siblings, 2 ellipses

    if (total <= totalSlots) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const left = Math.max(current - siblingCount, 2);
    const right = Math.min(current + siblingCount, total - 1);

    const pages: (number | "…")[] = [1];
    if (left > 2) pages.push("…");
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < total - 1) pages.push("…");
    pages.push(total);

    return pages;
}

// ─────────────────────────────────────────────────────────────────────────────
// PaginationBar — "Showing 1 - 10 of 24" and the page buttons
// ─────────────────────────────────────────────────────────────────────────────

function PaginationBar({
    page,
    pagination,
    onPageChange,
    loading = false,
}: {
    page: number;
    pagination: PaginationMeta;
    onPageChange: (page: number) => void;
    /** The rows are still loading: the count is a skeleton and the buttons are off. */
    loading?: boolean;
}) {
    const totalPages = Math.max(1, pagination.totalPages);
    const { rowsPerPage, total } = pagination;

    const label =
        total === 0
            ? "0 results"
            : `Showing ${(page - 1) * rowsPerPage + 1} - ${Math.min(page * rowsPerPage, total)} of ${total}`;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200">
            {loading ? (
                <Skeleton className="h-4 w-32 rounded" />
            ) : (
                <span className="text-sm text-gray-500 font-text">{label}</span>
            )}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={loading || page <= 1}
                    className="p-1.5 rounded-button border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    <ChevronLeft className="size-4 text-gray-600" />
                </button>
                {getPageNumbers(page, totalPages).map((p, i) =>
                    p === "…" ? (
                        <span
                            key={`ellipsis-${i}`}
                            className="px-2 text-sm text-gray-400 select-none"
                        >
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={[
                                "min-w-8 h-8 px-2 rounded-button text-sm font-text transition-colors cursor-pointer",
                                p === page
                                    ? "bg-gray-100 text-neutral-900 font-medium"
                                    : "text-gray-500 hover:bg-gray-50",
                            ].join(" ")}
                        >
                            {p}
                        </button>
                    ),
                )}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={loading || page >= totalPages}
                    className="p-1.5 rounded-button border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    <ChevronRight className="size-4 text-gray-600" />
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DataTable
// ─────────────────────────────────────────────────────────────────────────────

export interface DataTableProps<TRow extends { id: string }> {
    tableId: string;
    columns: ColumnDef<TRow>[];
    rows: TRow[];
    /**
     * Omit for a short, fixed list (e.g. a dashboard preview): no pagination
     * bar, and the table never reads the URL — so it needs no Suspense
     * boundary on a static page.
     */
    pagination?: PaginationMeta;
    toolbar?: ReactNode;
    loading?: boolean;
    /** The rows couldn't load: shown in place of the rows, under the real headers. */
    error?: ReactNode;
    emptyMessage?: string;
    /** Eye icon — "link" navigates, "popup" fires onClick */
    viewAction?: ViewAction<TRow>;
    /** Pencil icon — opens Edit dialog with parent-supplied body */
    editAction?: EditAction<TRow>;
    /** Trash icon — opens Delete confirmation dialog */
    deleteAction?: DeleteAction<TRow>;
    /** Plain text link in the actions cell — no icon */
    linkAction?: LinkAction<TRow>;
    /** Custom items in the row's "..." menu, e.g. "Suspend" */
    rowActions?: RowAction<TRow>[];
    /** Adds a leading "#" column numbered from the current page's offset */
    showIndex?: boolean;
    /** Adds a leading checkbox column for row selection */
    selectable?: boolean;
    /** Controlled selection — pass together with onSelectionChange */
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
    /**
     * Controlled page — pass together with onPageChange when the page lives
     * in the parent's state. Otherwise it's read from the `<tableId>_page`
     * URL param.
     */
    page?: number;
    onPageChange?: (page: number) => void;
    /** Makes the whole row clickable. Checkbox and actions cells don't trigger it. */
    onRowClick?: (row: TRow) => void;
    /** Tighter cell padding, for a table inside a card (e.g. a dashboard preview). */
    compact?: boolean;
}

export function DataTable<TRow extends { id: string }>(
    props: DataTableProps<TRow>,
) {
    // Only a paginated table that doesn't control its own page reads the
    // URL (useSearchParams), so the others work on static pages as-is
    return props.pagination && !props.onPageChange ? (
        <UrlPagedDataTable {...props} />
    ) : (
        <DataTableContent {...props} />
    );
}

function UrlPagedDataTable<TRow extends { id: string }>(
    props: DataTableProps<TRow>,
) {
    const { getParam, setParam } = useTableParam(props.tableId);
    return (
        <DataTableContent
            {...props}
            page={Number(getParam("page") ?? 1)}
            onPageChange={(p) => setParam("page", String(p))}
        />
    );
}

function DataTableContent<TRow extends { id: string }>({
    tableId,
    columns,
    rows,
    pagination,
    toolbar,
    viewAction,
    editAction,
    deleteAction,
    linkAction,
    rowActions,
    showIndex = false,
    selectable = false,
    selectedIds,
    onSelectionChange,
    page: rawPage = 1,
    onPageChange,
    onRowClick,
    compact = false,
    loading = false,
    error,
    emptyMessage = "No results match your filters.",
}: DataTableProps<TRow>) {
    const page = Math.max(1, rawPage);
    // Horizontal cell padding
    const px = compact ? "px-3" : "px-3 md:px-6";
    // Index of the first row on this page, for the "#" column
    const offset = pagination ? (page - 1) * pagination.rowsPerPage : 0;

    // Keeps checkbox / actions clicks from also firing onRowClick
    const stopRowClick = (event: MouseEvent) => event.stopPropagation();

    // ── Dialog state ────────────────────────────────────────────────────────
    type PanelKind = "edit" | "delete" | "sheet" | null;
    const [activeRow, setActiveRow] = useState<TRow | null>(null);
    const [panelKind, setPanelKind] = useState<PanelKind>(null);

    // Memoized so TableDialog's Escape-key callback ref (which keys its
    // listener lifecycle off `onClose`'s identity) doesn't detach/reattach
    // on every DataTable re-render while a dialog is open.
    const openPanel = useCallback(
        (kind: Exclude<PanelKind, null>, row: TRow) => {
            setActiveRow(row);
            setPanelKind(kind);
        },
        [],
    );
    const closePanel = useCallback(() => {
        setPanelKind(null);
        setActiveRow(null);
    }, []);

    const handleEditConfirm = () => {
        if (activeRow && editAction && editAction.type !== "link") {
            editAction.onConfirm(activeRow);
            closePanel();
        }
    };
    const handleDeleteConfirm = () => {
        if (activeRow && deleteAction) {
            deleteAction.onConfirm(activeRow);
            closePanel();
        }
    };

    // ── Selection state ─────────────────────────────────────────────────────
    const [internalSelected, setInternalSelected] = useState<Set<string>>(
        new Set(),
    );
    const selected = selectedIds ? new Set(selectedIds) : internalSelected;

    const updateSelection = (next: Set<string>) => {
        if (!selectedIds) setInternalSelected(next);
        onSelectionChange?.(Array.from(next));
    };

    const toggleRow = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        updateSelection(next);
    };

    const allSelectedOnPage =
        rows.length > 0 && rows.every((r) => selected.has(r.id));
    const someSelectedOnPage =
        !allSelectedOnPage && rows.some((r) => selected.has(r.id));

    const toggleAllOnPage = () => {
        const next = new Set(selected);
        if (allSelectedOnPage) rows.forEach((r) => next.delete(r.id));
        else rows.forEach((r) => next.add(r.id));
        updateSelection(next);
    };

    const hasActions = Boolean(
        viewAction || editAction || deleteAction || linkAction || rowActions?.length,
    );

    const colCount =
        columns.length +
        (hasActions ? 1 : 0) +
        (showIndex ? 1 : 0) +
        (selectable ? 1 : 0);

    return (
        <TableIdContext.Provider value={tableId}>
            {toolbar}

            <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            {selectable && (
                                <TableHead className={`w-10 ${px}`}>
                                    <Checkbox
                                        checked={allSelectedOnPage}
                                        indeterminate={someSelectedOnPage}
                                        onCheckedChange={toggleAllOnPage}
                                        aria-label="Select all rows on this page"
                                    />
                                </TableHead>
                            )}
                            {showIndex && (
                                <TableHead
                                    className={`w-10 ${px} text-gray-500 text-xs font-semibold font-text uppercase`}
                                >
                                    #
                                </TableHead>
                            )}
                            {columns.map((col) => (
                                <TableHead
                                    key={col.key}
                                    className={`${px} text-gray-500 text-xs font-semibold font-text uppercase ${col.className}`}
                                >
                                    {col.header ?? col.key}
                                </TableHead>
                            ))}
                            {hasActions && (
                                <TableHead className={`w-14 ${px}`} />
                            )}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading ? (
                            <TableSkeletonRows cols={colCount} />
                        ) : error ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colCount}
                                    role="alert"
                                    className={`text-center ${px} py-8 md:py-16 text-error-600 text-sm`}
                                >
                                    {error}
                                </TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colCount}
                                    className={`text-center ${px} py-8 md:py-16 text-gray-400 text-sm`}
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, i) => (
                                <TableRow
                                    key={row.id}
                                    onClick={
                                        onRowClick
                                            ? () => onRowClick(row)
                                            : undefined
                                    }
                                    className={
                                        onRowClick ? "cursor-pointer" : undefined
                                    }
                                >
                                    {selectable && (
                                        <TableCell
                                            className={`w-10 ${px}`}
                                            onClick={stopRowClick}
                                        >
                                            <Checkbox
                                                checked={selected.has(row.id)}
                                                onCheckedChange={() =>
                                                    toggleRow(row.id)
                                                }
                                                aria-label="Select row"
                                            />
                                        </TableCell>
                                    )}
                                    {showIndex && (
                                        <TableCell className={`w-10 ${px} text-sm font-text text-gray-500`}>
                                            {offset + i + 1}
                                        </TableCell>
                                    )}
                                    {columns.map((col) => (
                                        <TableCell
                                            key={col.key}
                                            className={`${px} py-4 text-sm font-text leading-5 ${col.className}`}
                                        >
                                            {col.cell
                                                ? col.cell(row)
                                                : String(
                                                      (
                                                          row as Record<
                                                              string,
                                                              unknown
                                                          >
                                                      )[col.key] ?? "",
                                                  )}
                                        </TableCell>
                                    ))}
                                    {/* ── Actions cell — single "..." kebab menu ─────────── */}
                                    {hasActions && (
                                        <TableCell
                                            className={px}
                                            onClick={stopRowClick}
                                        >
                                            <RowActionsMenu
                                                row={row}
                                                viewAction={viewAction}
                                                editAction={editAction}
                                                deleteAction={deleteAction}
                                                linkAction={linkAction}
                                                rowActions={rowActions}
                                                onOpenSheet={() =>
                                                    openPanel("sheet", row)
                                                }
                                                onOpenEdit={() =>
                                                    openPanel("edit", row)
                                                }
                                                onOpenDelete={() =>
                                                    openPanel("delete", row)
                                                }
                                            />
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {pagination && (
                    <PaginationBar
                        page={page}
                        pagination={pagination}
                        onPageChange={(p) => onPageChange?.(p)}
                        loading={loading}
                    />
                )}
            </div>

            {/* Edit dialog — only rendered when editAction is the dialog variant */}
            {editAction && editAction.type !== "link" && (
                <TableDialog
                    open={panelKind === "edit"}
                    onClose={closePanel}
                    onConfirm={handleEditConfirm}
                    variant="edit"
                    title="Edit details"
                    confirmLabel={editAction.confirmLabel ?? "Save changes"}
                >
                    {activeRow ? editAction.dialogContent(activeRow) : null}
                </TableDialog>
            )}

            {/* Delete dialog */}
            {deleteAction && (
                <TableDialog
                    open={panelKind === "delete"}
                    onClose={closePanel}
                    onConfirm={handleDeleteConfirm}
                    variant="delete"
                    title={`Delete ${deleteAction.dataType}?`}
                    confirmLabel="Delete"
                >
                    {activeRow ? deleteAction.dialogContent(activeRow) : null}
                </TableDialog>
            )}

            {/* View sheet — shadcn Sheet sliding in from the right */}
            {viewAction && viewAction.type === "sheet" && (
                <Sheet
                    open={panelKind === "sheet"}
                    onOpenChange={(open) => {
                        if (!open) closePanel();
                    }}
                >
                    <SheetContent
                        side="right"
                        className="md:min-w-xl overflow-y-auto"
                    >
                        <SheetHeader className="sticky top-0 bg-white">
                            <SheetTitle className="text-neutral-950 text-base font-bold font-text">
                                {activeRow
                                    ? (viewAction.title?.(activeRow) ??
                                      "Details")
                                    : "Details"}
                            </SheetTitle>
                        </SheetHeader>
                        <div className="px-4 pb-6">
                            {activeRow ? viewAction.content(activeRow) : null}
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </TableIdContext.Provider>
    );
}
