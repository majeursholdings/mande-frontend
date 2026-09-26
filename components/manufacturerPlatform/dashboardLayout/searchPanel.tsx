import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RECENT_SEARCHES } from "@/constant/manufacturer";

export default function SearchPanel({
    onSelect,
    className,
}: {
    onSelect?: (term: string) => void;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium font-text text-mist-500">
                    Recent searches
                </span>
                <button
                    type="button"
                    className="text-mist-400 hover:text-mist-700 transition-colors cursor-pointer"
                    aria-label="Clear recent searches"
                >
                    <X className="size-3.5" />
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {RECENT_SEARCHES.map((term) => (
                    <button
                        key={term}
                        type="button"
                        onClick={() => onSelect?.(term)}
                        className="px-3 py-1.5 rounded-full bg-mist-100 text-xs font-text text-mist-700 hover:bg-mist-200 transition-colors cursor-pointer"
                    >
                        {term}
                    </button>
                ))}
            </div>
        </div>
    );
}
