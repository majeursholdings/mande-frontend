import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ManufacturerBankAccount } from "@/constant/manufacturer";

/** "Demi Semande • 0233000994" — how a bank account is summarised under its bank's name. */
export function bankAccountSubtitle(bankAccount: ManufacturerBankAccount): string {
    return `${bankAccount.accountName} • ${bankAccount.accountNumber}`;
}

/** Icon in a soft red circle, with a title and an optional muted line under it. */
export function WalletTile({
    icon: Icon,
    title,
    subtitle,
}: {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="flex min-w-0 items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
                <Icon className="size-5" strokeWidth={1.75} />
            </span>
            {/* Wraps rather than truncates — the account number is what people check before a payout */}
            <div className="min-w-0 text-left">
                <p className="wrap-break-word text-base font-medium font-text text-mist-950">{title}</p>
                {subtitle && (
                    <p className="wrap-break-word text-sm font-text text-mist-500">{subtitle}</p>
                )}
            </div>
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
                "flex h-full w-full items-center rounded-xl border border-border bg-white px-5 py-4 transition-colors duration-200 enabled:cursor-pointer enabled:hover:border-secondary-200 enabled:hover:bg-secondary-50/40 disabled:cursor-not-allowed disabled:opacity-60",
                className,
            )}
        >
            <WalletTile {...tile} />
        </button>
    );
}
