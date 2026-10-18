"use client";

import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { EXPORT_FORMATS, type ExportFormat } from "./exportRows";

// ─────────────────────────────────────────────────────────────────────────────
// ExportMenu: the toolbar's "Export ⌄" button, with a choice of CSV, Excel,
// OpenDocument and PDF. `onExport` loads the rows and saves the file (see
// exportRows); the button shows it's working until that's done, and a
// failure is a toast.
// ─────────────────────────────────────────────────────────────────────────────

export interface ExportMenuProps {
    onExport: (format: ExportFormat) => Promise<void>;
    label?: string;
    disabled?: boolean;
    /** Leave some formats out of the menu. */
    formats?: ExportFormat[];
}

export function ExportMenu({ onExport, label = "Export", disabled = false, formats }: ExportMenuProps) {
    const [busy, setBusy] = useState(false);
    const options = EXPORT_FORMATS.filter((option) => !formats || formats.includes(option.value));

    const run = async (format: ExportFormat) => {
        setBusy(true);
        try {
            await onExport(format);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't export the table. Please try again."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Menu.Root modal={false}>
            <Menu.Trigger
                disabled={disabled || busy}
                className={cn(
                    "group inline-flex items-center gap-2 px-4 py-2 rounded-button border border-gray-300 bg-white text-sm font-medium font-text text-mist-950",
                    "cursor-pointer whitespace-nowrap outline-none transition-colors hover:bg-mist-50 focus-visible:ring-2 focus-visible:ring-blue-200",
                    "disabled:cursor-not-allowed disabled:text-mist-500",
                )}
            >
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
                {busy ? "Exporting..." : label}
                <ChevronDown className="size-3.5 transition-transform duration-200 group-data-popup-open:rotate-180" aria-hidden />
            </Menu.Trigger>
            <Menu.Portal>
                <Menu.Positioner side="bottom" align="end" sideOffset={4} collisionPadding={16} className="z-50 outline-none">
                    <Menu.Popup className="min-w-44 origin-(--transform-origin) rounded-lg border border-gray-200 bg-white py-1 shadow-lg outline-none transition-[opacity,scale] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                        {options.map((option) => (
                            <Menu.Item
                                key={option.value}
                                onClick={() => void run(option.value)}
                                className="w-full px-3 py-2 text-left text-sm font-text whitespace-nowrap text-gray-700 outline-none transition-colors cursor-pointer data-highlighted:bg-gray-50"
                            >
                                {option.label}
                            </Menu.Item>
                        ))}
                    </Menu.Popup>
                </Menu.Positioner>
            </Menu.Portal>
        </Menu.Root>
    );
}
