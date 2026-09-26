import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type LinkListItem = {
    href: string;
    icon: LucideIcon;
    title: string;
    description?: string;
    /** Small muted line under the description, e.g. "Updated Mar 4th, 2026". */
    meta?: string;
};

/** A card of navigation rows — icon, title, description and a chevron. */
export default function LinkList({
    items,
    className,
}: {
    items: LinkListItem[];
    className?: string;
}) {
    return (
        <ul
            className={cn(
                "flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-white",
                className,
            )}
        >
            {items.map(({ href, icon: Icon, title, description, meta }) => (
                <li key={href}>
                    <Link
                        href={href}
                        className="group flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-mist-50 focus-visible:bg-mist-50 outline-none"
                    >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary-50 text-secondary-600">
                            <Icon className="size-5" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0 flex-1 font-text">
                            <span className="block text-sm font-medium text-mist-950">{title}</span>
                            {description && (
                                <span className="block text-xs text-mist-500">{description}</span>
                            )}
                            {meta && <span className="mt-0.5 block text-[11px] text-mist-400">{meta}</span>}
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-mist-400 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}
