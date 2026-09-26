import { ArrowLeftIcon, ArrowRightIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type StepFooterProps = {
    isLoading: boolean;
    canSubmit: boolean;
    submitLabel: string;
    onBack?: () => void;
};

export default function StepFooter({
    isLoading,
    canSubmit,
    submitLabel,
    onBack,
}: StepFooterProps) {
    const submitButton = (
        <Button
            type="submit"
            disabled={isLoading || !canSubmit}
            className={cn(
                "bg-secondary-700 hover:bg-secondary-900 text-white font-medium font-text rounded-button cursor-pointer transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none",
                onBack ? "px-8" : "w-full",
            )}
        >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    {submitLabel}...
                </span>
            ) : (
                <span className="flex items-center gap-2">
                    {submitLabel}
                    <ArrowRightIcon className="size-4" />
                </span>
            )}
        </Button>
    );

    if (!onBack) return submitButton;

    return (
        <div className="flex items-center justify-between gap-4">
            <button
                type="button"
                onClick={onBack}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-sm font-medium font-text text-[#1F2937] hover:text-secondary-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
                <ArrowLeftIcon className="size-4" />
                Back
            </button>
            {submitButton}
        </div>
    );
}
