import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A dashboard section — flat on phones, a bordered card from md up (as in
 * the design), with its title and an optional "View all" link or action.
 */
export default function DashboardCard({
    title,
    titleHidden = false,
    viewAllHref,
    action,
    children,
    className,
}: {
    title: ReactNode;
    /** Keep the title for screen readers only, e.g. the donut, whose centre label says it all. */
    titleHidden?: boolean;
    viewAllHref?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                "flex min-w-0 flex-col gap-5 md:rounded-xl md:border md:border-border md:bg-white md:p-5",
                className,
            )}
        >
            <div className={cn("flex items-start justify-between gap-4", titleHidden && "sr-only")}>
                <h2 className="text-lg font-medium font-text text-mist-950">{title}</h2>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="flex shrink-0 items-center gap-0.5 pt-0.5 text-sm font-medium font-text text-secondary-600 hover:underline"
                    >
                        View all
                        <ChevronRight className="size-4" />
                    </Link>
                )}
                {action}
            </div>
            {children}
        </section>
    );
}
