import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** A short inline message for data that couldn't load from the API. */
export default function LoadError({
    children = "Couldn't load this. Please refresh the page to try again.",
    className,
}: {
    children?: React.ReactNode;
    className?: string;
}) {
    return (
        <p role="alert" className={cn("flex items-center gap-1.5 text-sm font-text text-error-600", className)}>
            <CircleAlert className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <span>{children}</span>
        </p>
    );
}
