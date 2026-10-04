"use client";

import { useCallback, useState } from "react";
import { MoreHorizontal, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOutsideClickRef } from "@/hooks/useOutsideClickRef";

const MENU_ITEM_CLASS =
    "w-full flex items-center px-3 py-2 text-xs font-medium font-text text-left hover:bg-mist-50 transition-colors cursor-pointer whitespace-nowrap";

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailHeaderActions — "Mark as done" + the "..." kebab (Report Delay /
// Cancel Job). Cancel Job is off once they're past the
// Materials step. Hidden entirely for pending jobs, which use Accept/Decline
// instead (see jobDetailContent.tsx).
// ─────────────────────────────────────────────────────────────────────────────

export default function JobDetailHeaderActions({
    canMarkAsDone,
    onMarkAsDoneClick,
    onReportDelay,
    onCancelJob,
    canCancel,
}: {
    canMarkAsDone: boolean;
    /** False once they're past the Materials step. */
    canCancel: boolean;
    onMarkAsDoneClick: () => void;
    onReportDelay: () => void;
    onCancelJob: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = useCallback(() => setMenuOpen(false), []);
    const menuRef = useOutsideClickRef<HTMLDivElement>(closeMenu);

    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                disabled={!canMarkAsDone}
                onClick={onMarkAsDoneClick}
                title={canMarkAsDone ? undefined : "Complete all production steps first"}
                className={cn(
                    "flex items-center gap-1.5 text-sm font-medium font-text",
                    canMarkAsDone
                        ? "text-secondary-700 hover:text-secondary-900 cursor-pointer"
                        : "text-mist-300 cursor-not-allowed",
                )}
            >
                <CheckCircle2 className="size-4" />
                Mark as done
            </button>

            <div ref={menuRef} className="relative">
                <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    className="p-1 rounded-button hover:bg-mist-100 transition-colors cursor-pointer"
                    aria-label="More actions"
                >
                    <MoreHorizontal className="size-4.5 text-mist-500" />
                </button>

                {menuOpen && (
                    <div className="absolute top-full left-0 mt-1 z-40 min-w-40 bg-white border border-border rounded-lg shadow-lg py-1 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false);
                                onReportDelay();
                            }}
                            className={cn(MENU_ITEM_CLASS, "text-mist-700")}
                        >
                            Report Delay
                        </button>
                        <button
                            type="button"
                            disabled={!canCancel}
                            onClick={() => {
                                setMenuOpen(false);
                                onCancelJob();
                            }}
                            className={cn(
                                MENU_ITEM_CLASS,
                                "flex-col items-start",
                                canCancel ? "text-secondary-600" : "cursor-not-allowed text-mist-300 hover:bg-transparent",
                            )}
                        >
                            Cancel Job
                            {!canCancel && (
                                <span className="text-[11px] font-normal text-mist-400">
                                    Not after the Materials step
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
