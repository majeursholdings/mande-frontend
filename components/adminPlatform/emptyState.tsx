import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Nothing to show yet — a big muted icon, a title, a line of explanation and an optional action. */
export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <span className="mb-2 flex size-22 items-center justify-center rounded-full bg-mist-100">
                <Icon className="size-9 text-mist-400" strokeWidth={1.25} />
            </span>
            <h3 className="text-sm font-medium font-text text-mist-950">{title}</h3>
            <p className="max-w-48 text-sm font-text text-mist-500">{description}</p>
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

/**
 * Couldn't load it — a short inline error where the server data would be,
 * in place of an empty state (never sample data). `message` says what didn't
 * load, e.g. "We couldn't load the jobs. Please refresh the page."
 */
export function LoadError({ message, className }: { message: string; className?: string }) {
    return (
        <p
            role="alert"
            className={cn(
                "rounded-lg border border-error-200 bg-error-50/60 px-4 py-6 text-center text-sm font-text text-error-700",
                className,
            )}
        >
            {message}
        </p>
    );
}
