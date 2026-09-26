import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Submit button shared by the manufacturer forms (profile sections, bank
 * account, withdrawal) — greyed out while disabled, and shows a spinner with
 * `loadingLabel` while the request is in flight.
 */
export function FormSubmitButton({
    label,
    loadingLabel = label,
    isLoading,
    disabled,
    className,
}: {
    label: string;
    loadingLabel?: string;
    isLoading: boolean;
    disabled: boolean;
    className?: string;
}) {
    return (
        <Button
            type="submit"
            disabled={isLoading || disabled}
            className={cn(
                "h-11 px-5 bg-secondary-700 hover:bg-secondary-900 text-white font-medium font-text rounded-button cursor-pointer transition-colors duration-300",
                // Stays red while submitting; only an idle, disabled button turns grey
                !isLoading && "disabled:bg-mist-200 disabled:opacity-100",
                className,
            )}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    {loadingLabel}
                </span>
            ) : (
                label
            )}
        </Button>
    );
}

/** Grey secondary button that sits beside a FormSubmitButton. */
export function FormCancelButton({
    onClick,
    disabled = false,
    children = "Cancel",
}: {
    onClick: () => void;
    disabled?: boolean;
    children?: ReactNode;
}) {
    return (
        <Button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer transition-colors duration-300"
        >
            {children}
        </Button>
    );
}
