import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ToolbarActionButton — the solid "+ Create a job" / "+ Add a manufacturer"
// button anchored to the right of the toolbar via TableToolbar's `actions`.
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolbarActionButtonProps {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: ReactNode;
}

export function ToolbarActionButton({
    label,
    onClick,
    href,
    icon,
}: ToolbarActionButtonProps) {
    const className =
        "inline-flex items-center gap-2 px-4 py-2 rounded-button bg-secondary-700 hover:bg-secondary-800 text-white text-sm font-medium font-text transition-colors cursor-pointer whitespace-nowrap";
    const content = (
        <>
            {icon ?? <Plus className="size-4" />}
            {label}
        </>
    );

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button onClick={onClick} className={className}>
            {content}
        </button>
    );
}
