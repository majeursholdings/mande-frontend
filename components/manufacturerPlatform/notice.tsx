import type { ReactNode } from "react";
import { CircleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** A small callout for something the user should read before acting — "info" or a "warning". */
export default function Notice({
    tone = "info",
    children,
    className,
}: {
    tone?: "info" | "warning";
    children: ReactNode;
    className?: string;
}) {
    const Icon = tone === "warning" ? CircleAlert : Info;

    return (
        <div
            className={cn(
                "flex gap-2.5 rounded-lg px-3.5 py-3 text-xs leading-5 font-text",
                tone === "warning"
                    ? "bg-warning-50 text-warning-800"
                    : "bg-mist-100 text-mist-800",
                className,
            )}
        >
            <Icon className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            <div>{children}</div>
        </div>
    );
}
