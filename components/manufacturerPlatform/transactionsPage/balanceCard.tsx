import { cn } from "@/lib/utils";
import { formatBalance } from "@/lib/currency";

export default function BalanceCard({
    balance,
    className,
}: {
    balance: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "relative flex flex-col justify-center gap-1 overflow-hidden rounded-xl bg-secondary-600 p-5 text-white",
                className,
            )}
        >
            <MandeMark className="absolute -top-1 right-2 size-16 text-white/15" />
            <p className="text-sm font-text text-white/75">Your balance</p>
            <p className="text-2xl font-semibold font-text">{formatBalance(balance)}</p>
        </div>
    );
}

/** The MANDE logo's mark, drawn as the card's watermark. */
function MandeMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" fill="none" aria-hidden className={className}>
            <path
                d="M8 27 18.5 9.5a2 2 0 0 1 3.4 0L30 23h8"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="39" cy="23" r="5" fill="currentColor" />
            <path d="M12 39h22" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            <circle cx="11" cy="39" r="5" fill="currentColor" />
        </svg>
    );
}
