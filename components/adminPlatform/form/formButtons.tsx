import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Submit button shared by the admin forms — maroon, greyed out while
 * disabled, and shows a spinner with `loadingLabel` while the request is in
 * flight. `icon` sits after the label, e.g. the arrow on "Create account".
 */
export function FormSubmitButton({
    label,
    loadingLabel = label,
    icon,
    isLoading,
    disabled,
    className,
}: {
    label: string;
    loadingLabel?: string;
    icon?: ReactNode;
    isLoading: boolean;
    disabled: boolean;
    className?: string;
}) {
    return (
        <Button
            type="submit"
            disabled={isLoading || disabled}
            className={cn(
                "h-11 w-full gap-2 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer transition-colors duration-300",
                // Stays red while submitting; only an idle, disabled button turns grey
                !isLoading && "disabled:bg-mist-200 disabled:opacity-100",
                className,
            )}
        >
            {isLoading ? (
                <>
                    <Loader2 className="size-4 animate-spin" />
                    {loadingLabel}
                </>
            ) : (
                <>
                    {label}
                    {icon}
                </>
            )}
        </Button>
    );
}
