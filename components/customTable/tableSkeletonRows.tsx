import { TableRow, TableCell } from "@/components/ui/table";

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
                            <div className="h-8 bg-gray-100 rounded animate-pulse w-3/4" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}
