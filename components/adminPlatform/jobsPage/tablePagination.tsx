import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page numbers to show — all of them when there are few, else a window with gaps: 1 … 4 5 6 … 20. */
function getPageNumbers(current: number, total: number): (number | "gap")[] {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
    const pages: (number | "gap")[] = [1];
    const from = Math.max(2, current - 1);
    const to = Math.min(total - 1, current + 1);
    if (from > 2) pages.push("gap");
    for (let page = from; page <= to; page++) pages.push(page);
    if (to < total - 1) pages.push("gap");
    pages.push(total);
    return pages;
}

/** "Showing 1 - 10 of 24" and the page buttons under a table. */
export default function TablePagination({
    page,
    pageSize,
    total,
    onPageChange,
}: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}) {
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);

    return (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-text text-mist-700">
                Showing {first} - {last} of {total}
            </p>
            {pageCount > 1 && (
                <div className="flex items-center gap-1">
                    <PageButton
                        label="Previous page"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                    >
                        <ChevronLeft className="size-4" />
                    </PageButton>
                    {getPageNumbers(page, pageCount).map((entry, index) =>
                        entry === "gap" ? (
                            <span key={`gap-${index}`} className="px-1 text-sm text-mist-400" aria-hidden>
                                …
                            </span>
                        ) : (
                            <button
                                key={entry}
                                type="button"
                                onClick={() => onPageChange(entry)}
                                aria-current={entry === page ? "page" : undefined}
                                className={cn(
                                    "flex size-8 items-center justify-center rounded-md text-sm font-text transition-colors cursor-pointer",
                                    entry === page
                                        ? "bg-mist-100 font-medium text-mist-950"
                                        : "text-mist-600 hover:bg-mist-50",
                                )}
                            >
                                {entry}
                            </button>
                        ),
                    )}
                    <PageButton
                        label="Next page"
                        disabled={page >= pageCount}
                        onClick={() => onPageChange(page + 1)}
                    >
                        <ChevronRight className="size-4" />
                    </PageButton>
                </div>
            )}
        </nav>
    );
}

function PageButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className="flex size-8 items-center justify-center rounded-md text-mist-900 transition-colors enabled:hover:bg-mist-50 enabled:cursor-pointer disabled:text-mist-300"
        >
            {children}
        </button>
    );
}
