import {
    BadgeCheck,
    ScanSearch,
    ShieldAlert,
    ShieldEllipsis,
    ShieldX,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/constant/manufacturer";

const BADGES: Record<VerificationStatus, { label: string; icon: LucideIcon; className: string }> = {
    pending: { label: "Not verified", icon: ShieldAlert, className: "bg-warning-50 text-warning-700" },
    processing: { label: "Verifying", icon: ShieldEllipsis, className: "bg-mist-100 text-mist-700" },
    manual_review: { label: "In review", icon: ScanSearch, className: "bg-mist-100 text-mist-700" },
    verified: { label: "Verified", icon: BadgeCheck, className: "bg-primary-50 text-primary-700" },
    rejected: { label: "Rejected", icon: ShieldX, className: "bg-error-50 text-error-700" },
};

/** Where a document (NIN card, tax number, business license number) is in verification. */
export default function VerificationBadge({
    status,
    rejectedLabel,
    className,
}: {
    status: VerificationStatus;
    /**
     * Replaces "Rejected" — e.g. "ID rejected" beside the manufacturer's
     * name, so it doesn't read as the whole account being rejected.
     */
    rejectedLabel?: string;
    className?: string;
}) {
    const { label, icon: Icon, className: toneClassName } = BADGES[status];

    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium font-text",
                toneClassName,
                className,
            )}
        >
            <Icon className="size-3.5" strokeWidth={2} aria-hidden />
            {status === "rejected" && rejectedLabel ? rejectedLabel : label}
        </span>
    );
}
