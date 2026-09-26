import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmptyState({
    title = "No Jobs",
    description = "There are no recent jobs to display",
    /** Smaller icon/padding — for use inside a single kanban column or the mobile accordion. */
    compact = false,
}: {
    title?: string;
    description?: string;
    compact?: boolean;
}) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-3 text-center",
                compact ? "py-8" : "py-16",
            )}
        >
            <span
                className={cn(
                    "flex items-center justify-center rounded-full bg-mist-100",
                    compact ? "size-10" : "size-14",
                )}
            >
                <ClipboardList
                    className={compact ? "size-4.5 text-mist-400" : "size-6 text-mist-400"}
                    strokeWidth={1.5}
                />
            </span>
            <h4 className="text-sm font-semibold font-text text-mist-900">{title}</h4>
            <p className="text-xs font-text text-mist-500 max-w-56">{description}</p>
        </div>
    );
}
