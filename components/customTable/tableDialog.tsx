"use client";

import { useCallback, type ReactNode } from "react";
import { X, AlertTriangle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TableDialog — internal shared dialog shell
// Used for both Edit and Delete. Renders a backdrop + card with:
//   • Fixed header (title from DataTable, X close button)
//   • Scrollable body (ReactNode from parent via action config)
//   • Fixed footer (Cancel + Confirm; styles differ by variant) — omitted
//     when no onConfirm is passed, e.g. when the body is a form with its own
//     submit button
// ─────────────────────────────────────────────────────────────────────────────

export interface TableDialogProps {
    open: boolean;
    onClose: () => void;
    /** Omit to hide the footer entirely (X icon stays for closing). */
    onConfirm?: () => void;
    title: string;
    confirmLabel?: string;
    /** "edit" = blue confirm, "delete" = red confirm */
    variant: "edit" | "delete";
    children: ReactNode;
    /** Disables the confirm button (e.g. until a required field is filled in). */
    confirmDisabled?: boolean;
}

export function TableDialog({
    open,
    onClose,
    onConfirm,
    title,
    confirmLabel,
    variant,
    children,
    confirmDisabled = false,
}: TableDialogProps) {
    // Close on Escape. Attached via callback ref on the backdrop below —
    // that element only exists in the DOM while `open` is true, so its
    // mount/unmount lifecycle is exactly the "attach while open" behavior
    // useEffect(..., [open]) used to provide, with no effect needed. Relies
    // on the caller passing a referentially stable `onClose` (DataTable
    // memoizes closePanel via useCallback) so this doesn't detach/reattach
    // the listener on every re-render while the dialog stays open.
    const backdropRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (!node) return;
            const handler = (e: KeyboardEvent) => {
                if (e.key === "Escape") onClose();
            };
            document.addEventListener("keydown", handler);
            return () => document.removeEventListener("keydown", handler);
        },
        [onClose],
    );

    if (!open) return null;

    const confirmClass =
        variant === "delete"
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white";

    return (
        /* Backdrop */
        <div
            ref={backdropRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Card */}
            <div className="relative w-full max-w-md bg-white rounded-[10px] shadow-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div
                    className={[
                        "flex items-center justify-between px-6 py-4 border-b border-gray-100",
                        variant === "delete" ? "bg-red-50" : "bg-white",
                    ].join(" ")}
                >
                    <div className="flex items-center gap-2">
                        {variant === "delete" && (
                            <span className="flex items-center justify-center size-6 rounded-full bg-red-100">
                                <AlertTriangle className="size-3 text-red-600" />
                            </span>
                        )}
                        <h2
                            className={[
                                "text-sm font-semibold font-text",
                                variant === "delete"
                                    ? "text-red-500"
                                    : "text-neutral-800",
                            ].join(" ")}
                        >
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 duration-300 transition-colors cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Body — parent-supplied ReactNode */}
                <div className="px-6 py-5 text-sm text-gray-600 font-text leading-relaxed">
                    {children}
                </div>

                {/* Footer — Cancel + Confirm, only when there's a confirm action */}
                {onConfirm && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-button text-sm font-medium font-text text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={confirmDisabled}
                            className={`px-5 py-2 rounded-button text-sm font-medium font-text transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${confirmClass}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
