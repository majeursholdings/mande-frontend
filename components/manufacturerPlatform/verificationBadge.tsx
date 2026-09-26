import { BadgeCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** Whether an admin has reviewed the manufacturer's NIN card and verified them. */
export default function VerificationBadge({
    isVerified,
    className,
}: {
    isVerified: boolean;
    className?: string;
}) {
    const Icon = isVerified ? BadgeCheck : ShieldAlert;

    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium font-text",
                isVerified ? "bg-primary-50 text-primary-700" : "bg-warning-50 text-warning-700",
                className,
            )}
        >
            <Icon className="size-3.5" strokeWidth={2} aria-hidden />
            {isVerified ? "Verified" : "Not verified"}
        </span>
    );
}
