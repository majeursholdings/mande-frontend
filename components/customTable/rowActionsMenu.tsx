"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import type { ViewAction, EditAction, DeleteAction, LinkAction, RowAction } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// LinkActionMenuItem
// Separate component so it can call useSearchParams (a hook) inside a row
// render without violating the rules-of-hooks ordering in DataTable itself.
// Renders as a full-width row inside the "..." actions dropdown.
// ─────────────────────────────────────────────────────────────────────────────

export const MENU_ITEM_CLASS =
    "w-full flex items-center gap-2 px-3 py-2 text-xs font-text text-left text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap";

// The menu's items also light up when reached with the arrow keys
const ITEM_CLASS = `${MENU_ITEM_CLASS} outline-none data-highlighted:bg-gray-50`;
const DANGER_ITEM_CLASS = `${ITEM_CLASS} text-red-600 hover:bg-red-50 data-highlighted:bg-red-50`;

function LinkActionMenuItem<TRow extends { id: string }>({
    row,
    action,
}: {
    row: TRow;
    action: LinkAction<TRow>;
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
        <Menu.LinkItem render={<Link href={finalHref} />} closeOnClick className={ITEM_CLASS}>
            {linkIcon ?? <Eye className="size-3.5 text-gray-400" />}
            {action.label}
        </Menu.LinkItem>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// RowActionsMenu — the "..." kebab menu used in every table variant. Groups
// the view/edit/delete/link actions, and any custom row actions, into a
// single dropdown instead of a row of separate icon buttons. The dropdown is
// placed against the button, outside the table, so the table's edges don't
// cut it off — on the last row it opens upwards.
// ─────────────────────────────────────────────────────────────────────────────

export function RowActionsMenu<TRow extends { id: string }>({
    row,
    viewAction,
    editAction,
    deleteAction,
    linkAction,
    rowActions = [],
    onOpenSheet,
    onOpenEdit,
    onOpenDelete,
}: {
    row: TRow;
    viewAction?: ViewAction<TRow>;
    editAction?: EditAction<TRow>;
    deleteAction?: DeleteAction<TRow>;
    linkAction?: LinkAction<TRow>;
    rowActions?: RowAction<TRow>[];
    onOpenSheet: () => void;
    onOpenEdit: () => void;
    onOpenDelete: () => void;
}) {
    return (
        <div className="flex justify-end">
            <Menu.Root modal={false}>
                <Menu.Trigger
                    className="p-1.5 rounded-button hover:bg-gray-100 data-popup-open:bg-gray-100 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                    title="Actions"
                >
                    <MoreHorizontal className="size-4 text-gray-500" />
                    <span className="sr-only">Actions</span>
                </Menu.Trigger>
                <Menu.Portal>
                    <Menu.Positioner side="bottom" align="end" sideOffset={4} collisionPadding={16} className="z-50 outline-none">
                        <Menu.Popup className="min-w-40 origin-(--transform-origin) overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg outline-none transition-[opacity,scale] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                            {viewAction &&
                                (viewAction.type === "link" ? (
                                    <Menu.LinkItem render={<Link href={viewAction.href(row)} />} closeOnClick className={ITEM_CLASS}>
                                        <Eye className="size-3.5 text-gray-400" />
                                        View
                                    </Menu.LinkItem>
                                ) : (
                                    <Menu.Item
                                        onClick={() => {
                                            if (viewAction.type === "sheet") {
                                                onOpenSheet();
                                            } else {
                                                viewAction.onClick(row);
                                            }
                                        }}
                                        className={ITEM_CLASS}
                                    >
                                        <Eye className="size-3.5 text-gray-400" />
                                        View
                                    </Menu.Item>
                                ))}

                            {editAction &&
                                (editAction.type === "link" ? (
                                    <Menu.LinkItem render={<Link href={editAction.href(row)} />} closeOnClick className={ITEM_CLASS}>
                                        <Pencil className="size-3.5 text-gray-400" />
                                        Edit
                                    </Menu.LinkItem>
                                ) : (
                                    <Menu.Item onClick={onOpenEdit} className={ITEM_CLASS}>
                                        <Pencil className="size-3.5 text-gray-400" />
                                        Edit
                                    </Menu.Item>
                                ))}

                            {linkAction && <LinkActionMenuItem row={row} action={linkAction} />}

                            {rowActions
                                .filter((action) => !action.hidden?.(row))
                                .map((action) => {
                                    const disabledReason = action.disabledReason?.(row) ?? null;
                                    return (
                                        <Menu.Item
                                            key={action.label}
                                            disabled={!!disabledReason}
                                            title={disabledReason ?? undefined}
                                            onClick={() => action.onSelect(row)}
                                            className={
                                                disabledReason
                                                    ? `${ITEM_CLASS} cursor-not-allowed text-gray-300 hover:bg-transparent data-highlighted:bg-transparent`
                                                    : action.tone === "danger"
                                                      ? DANGER_ITEM_CLASS
                                                      : ITEM_CLASS
                                            }
                                        >
                                            {action.icon}
                                            {action.label}
                                        </Menu.Item>
                                    );
                                })}

                            {deleteAction && (
                                <Menu.Item onClick={onOpenDelete} className={DANGER_ITEM_CLASS}>
                                    <Trash2 className="size-3.5 text-red-400" />
                                    Delete
                                </Menu.Item>
                            )}
                        </Menu.Popup>
                    </Menu.Positioner>
                </Menu.Portal>
            </Menu.Root>
        </div>
    );
}
