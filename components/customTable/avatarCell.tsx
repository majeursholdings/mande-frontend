import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// AvatarCell — avatar/icon + primary text, with an optional subtitle line
// underneath (e.g. "Latade Dipe" / job title, or "Vava Furniture" / "First
// installment"). Use inside a ColumnDef's `cell`.
// ─────────────────────────────────────────────────────────────────────────────

export interface AvatarCellProps {
    name: ReactNode;
    subtitle?: ReactNode;
    /** Photo URL. Omit to fall back to an initial, or pass `icon` instead. */
    src?: string;
    /** Renders inside a colored circle instead of a photo/initial. */
    icon?: ReactNode;
    /** Background/text classes for the icon circle. Defaults to a green tint. */
    iconClassName?: string;
}

export function AvatarCell({
    name,
    subtitle,
    src,
    icon,
    iconClassName,
}: AvatarCellProps) {
    return (
        <div className="flex items-center gap-3">
            {icon ? (
                <span
                    className={`flex items-center justify-center size-8 rounded-full shrink-0 ${iconClassName ?? "bg-primary-100 text-primary-600"}`}
                >
                    {icon}
                </span>
            ) : src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt=""
                    className="size-8 rounded-full object-cover shrink-0"
                />
            ) : (
                <span className="flex items-center justify-center size-8 rounded-full bg-gray-100 text-gray-500 text-xs font-medium font-text shrink-0">
                    {typeof name === "string" ? name.slice(0, 1).toUpperCase() : ""}
                </span>
            )}
            <div className="min-w-0">
                <div className="text-sm font-medium font-text text-neutral-800 truncate">
                    {name}
                </div>
                {subtitle && (
                    <div className="text-xs text-gray-400 font-text truncate">
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    );
}
