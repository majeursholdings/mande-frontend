import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A titled block on a settings-style page, divided from the one before it
 * (the first one in its parent has no divider).
 */
export default function SettingsSection({
    title,
    description,
    action,
    children,
    className,
    headingLevel: Heading = "h2",
}: {
    title: string;
    description?: ReactNode;
    /** Right-aligned beside the title, e.g. a status badge. */
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    /** "h3" when the page already has an h2 above these sections (e.g. inside a tab). */
    headingLevel?: "h2" | "h3";
}) {
    return (
        <section
            className={cn(
                "flex flex-col gap-4 border-t border-border pt-6 first-of-type:border-t-0 first-of-type:pt-0",
                className,
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <Heading className="text-base font-medium font-text text-mist-950">{title}</Heading>
                    {description && (
                        <p className="text-sm font-text text-mist-500">{description}</p>
                    )}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}
