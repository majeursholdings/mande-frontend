"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { useOutsideClickRef } from "@/hooks/useOutsideClickRef";
import type { ViewAction, EditAction, DeleteAction, LinkAction } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// LinkActionMenuItem
// Separate component so it can call useSearchParams (a hook) inside a row
// render without violating the rules-of-hooks ordering in DataTable itself.
// Renders as a full-width row inside the "..." actions dropdown.
// ─────────────────────────────────────────────────────────────────────────────

export const MENU_ITEM_CLASS =
    "w-full flex items-center gap-2 px-3 py-2 text-xs font-text text-left text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap";

function LinkActionMenuItem<TRow extends { id: string }>({
    row,
    action,
    onNavigate,
}: {
    row: TRow;
    action: LinkAction<TRow>;
    onNavigate: () => void;
}) {
    const searchParams = useSearchParams();
    const { mergeParams = true, linkIcon } = action;

    const rawHref = action.href(row);

    const finalHref = (() => {
        if (!mergeParams) return rawHref;
        // Parse the href the parent gave us
        const [rawPath, rawQuery] = rawHref.split("?");
        // Start from the current URL params to preserve table state
        const merged = new URLSearchParams(searchParams.toString());
        // Overlay the params from the parent href
        new URLSearchParams(rawQuery ?? "").forEach((v, k) => merged.set(k, v));
        const qs = merged.toString();
        return qs ? `${rawPath}?${qs}` : rawPath;
    })();

    return (
        <Link href={finalHref} onClick={onNavigate} className={MENU_ITEM_CLASS}>
            {linkIcon ?? <Eye className="size-3.5 text-gray-400" />}
            {action.label}
        </Link>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// RowActionsMenu — the "..." kebab menu used in every table variant. Groups
// the view/edit/delete/link actions into a single dropdown instead of a row
// of separate icon buttons.
// ─────────────────────────────────────────────────────────────────────────────

export function RowActionsMenu<TRow extends { id: string }>({
    row,
    viewAction,
    editAction,
    deleteAction,
    linkAction,
    onOpenSheet,
    onOpenEdit,
    onOpenDelete,
}: {
    row: TRow;
    viewAction?: ViewAction<TRow>;
    editAction?: EditAction<TRow>;
    deleteAction?: DeleteAction<TRow>;
    linkAction?: LinkAction<TRow>;
    onOpenSheet: () => void;
    onOpenEdit: () => void;
    onOpenDelete: () => void;
}) {
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    const ref = useOutsideClickRef<HTMLDivElement>(close);

    return (
        <div ref={ref} className="relative flex justify-end">
            <button
                onClick={() => setOpen((o) => !o)}
                className="p-1.5 rounded-button hover:bg-gray-100 transition-colors cursor-pointer"
                title="Actions"
            >
                <MoreHorizontal className="size-4 text-gray-500" />
            </button>

            {open && (
                <div className="absolute top-full right-0 mt-1 z-40 min-w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 overflow-hidden">
                    {viewAction &&
                        (viewAction.type === "link" ? (
                            <Link
                                href={viewAction.href(row)}
                                onClick={() => setOpen(false)}
                                className={MENU_ITEM_CLASS}
                            >
                                <Eye className="size-3.5 text-gray-400" />
                                View
                            </Link>
                        ) : (
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    if (viewAction.type === "sheet") {
                                        onOpenSheet();
                                    } else {
                                        viewAction.onClick(row);
                                    }
                                }}
                                className={MENU_ITEM_CLASS}
                            >
                                <Eye className="size-3.5 text-gray-400" />
                                View
                            </button>
                        ))}

                    {editAction &&
                        (editAction.type === "link" ? (
                            <Link
                                href={editAction.href(row)}
                                onClick={() => setOpen(false)}
                                className={MENU_ITEM_CLASS}
                            >
                                <Pencil className="size-3.5 text-gray-400" />
                                Edit
                            </Link>
                        ) : (
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    onOpenEdit();
                                }}
                                className={MENU_ITEM_CLASS}
                            >
                                <Pencil className="size-3.5 text-gray-400" />
                                Edit
                            </button>
                        ))}

                    {linkAction && (
                        <LinkActionMenuItem
                            row={row}
                            action={linkAction}
                            onNavigate={() => setOpen(false)}
                        />
                    )}

                    {deleteAction && (
                        <button
                            onClick={() => {
                                setOpen(false);
                                onOpenDelete();
                            }}
                            className={`${MENU_ITEM_CLASS} text-red-600 hover:bg-red-50`}
                        >
                            <Trash2 className="size-3.5 text-red-400" />
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
