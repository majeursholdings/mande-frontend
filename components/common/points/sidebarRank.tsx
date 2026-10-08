"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useMyPoints } from "@/hooks/usePoints";
import RankBadge from "./rankBadge";

/**
 * "Your rank" and its badge, for a sidebar's foot (between Logout and the
 * platform's name): a manufacturer's or a project lead's present rank. A
 * skeleton while it loads, and nothing if it can't.
 */
export default function SidebarRank({ role, enabled = true }: { role: "manufacturer" | "admin"; enabled?: boolean }) {
    const { summary, isError } = useMyPoints({ enabled });
    if (!enabled || isError) return null;
    return (
        <div className="flex items-center justify-between gap-2 text-xs font-text text-mist-500">
            <span>Your rank</span>
            {summary ? <RankBadge rankId={summary.rank} role={role} size="sm" /> : <Skeleton className="h-5 w-24 rounded-full" />}
        </div>
    );
}
