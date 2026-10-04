import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ManufacturerBankAccount } from "@/constant/manufacturer";

/** "Demi Semande • 0233000994" — how a bank account is summarised under its bank's name. */
export function bankAccountSubtitle(bankAccount: ManufacturerBankAccount): string {
    return `${bankAccount.accountName} • ${bankAccount.accountNumber}`;
}

/** Icon in a soft red circle, with a title and an optional muted line under it — "sm" for a compact row. */
export function WalletTile({
    icon: Icon,
    title,
    subtitle,
    size = "md",
    loading = false,
}: {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
    size?: "sm" | "md";
    /** Skeletons in place of the title and subtitle, while what they show loads. */
    loading?: boolean;
}) {
    const isSmall = size === "sm";
    return (
        <div className={cn("flex min-w-0 items-center", isSmall ? "gap-3" : "gap-4")}>
            <span
                className={cn(
                    "flex shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-600",
                    isSmall ? "size-9" : "size-12",
                )}
            >
                <Icon className={isSmall ? "size-4" : "size-5"} strokeWidth={1.75} />
            </span>
            {/* Wraps rather than truncates — the account number is what people check before a payout */}
            {loading ? (
                <div className="flex min-w-0 flex-col gap-1.5">
                    <Skeleton className={isSmall ? "h-4 w-28" : "h-5 w-32"} />
                    <Skeleton className={isSmall ? "h-3 w-40" : "h-4 w-44"} />
                </div>
            ) : (
            <div className="min-w-0 text-left">
                <p
                    className={cn(
                        "wrap-break-word font-medium font-text text-mist-950",
                        isSmall ? "text-sm" : "text-base",
                    )}
                >
                    {title}
                </p>
                {subtitle && (
                    <p className={cn("wrap-break-word font-text text-mist-500", isSmall ? "text-xs" : "text-sm")}>
                        {subtitle}
                    </p>
                )}
            </div>
            )}
        </div>
    );
}

/** A WalletTile as a card-sized button, e.g. "Add your bank account". */
export function WalletActionCard({
    onClick,
    disabled = false,
    className,
    ...tile
}: Parameters<typeof WalletTile>[0] & {
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex h-full w-full items-center rounded-xl border border-border bg-white transition-colors duration-200 enabled:cursor-pointer enabled:hover:border-secondary-200 enabled:hover:bg-secondary-50/40 disabled:cursor-not-allowed disabled:opacity-60",
                tile.size === "sm" ? "px-4 py-2.5" : "px-5 py-4",
                className,
            )}
        >
            <WalletTile {...tile} />
        </button>
    );
}
