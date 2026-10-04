import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

// ─────────────────────────────────────────────────────────────────────────────
// TableSkeletonRows
// ─────────────────────────────────────────────────────────────────────────────

export function TableSkeletonRows({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j}>
                            <Skeleton className="h-5 w-3/4 rounded" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}
