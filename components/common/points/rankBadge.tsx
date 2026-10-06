import { Award, Shield, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ADMIN_RANKS,
    MANUFACTURER_RANKS,
    type RankDefinition,
} from "@/constant/points";

interface RankBadgeProps {
    rankId?: string | null;
    role?: "manufacturer" | "admin";
    size?: "sm" | "md" | "lg";
    className?: string;
    showIcon?: boolean;
}

function getRank(rankId?: string | null, role: "manufacturer" | "admin" = "manufacturer"): RankDefinition {
    const ladder = role === "manufacturer" ? MANUFACTURER_RANKS : ADMIN_RANKS;
    const found = ladder.find((r) => r.id === rankId || r.name.toLowerCase() === rankId?.toLowerCase());
    return found ?? ladder[0]!;
}

export default function RankBadge({
    rankId,
    role = "manufacturer",
    size = "md",
    className,
    showIcon = true,
}: RankBadgeProps) {
    const rank = getRank(rankId, role);

    const sizeClasses = {
        sm: "px-2 py-0.5 text-[11px] gap-1",
        md: "px-2.5 py-1 text-xs gap-1.5",
        lg: "px-3 py-1.5 text-sm gap-2 font-medium",
    }[size];

    const iconSizes = {
        sm: "size-3",
        md: "size-3.5",
        lg: "size-4",
    }[size];

    return (
        <span
            className={cn(
                "inline-flex items-center font-medium font-text rounded-full border shadow-xs transition-colors",
                rank.badgeColor,
                sizeClasses,
                className,
            )}
        >
            {showIcon && (
                <>
                    {rank.level >= 4 ? (
                        <Sparkles className={cn(iconSizes, "text-amber-500 animate-pulse")} aria-hidden />
                    ) : rank.level >= 3 ? (
                        <Award className={cn(iconSizes, "text-emerald-600")} aria-hidden />
                    ) : rank.level === 2 ? (
                        <Star className={cn(iconSizes, "text-blue-600")} aria-hidden />
                    ) : (
                        <Shield className={cn(iconSizes, "text-slate-500")} aria-hidden />
                    )}
                </>
            )}
            <span>{rank.name}</span>
        </span>
    );
}
