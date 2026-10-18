import { DEFAULT_CURRENCY } from "@/constant/global";
import { formatCompactNumber } from "@/lib/number";

/** The API sends whole kobo (₦1 = 100 kobo): 500000 → 5000. */
export function fromKobo(amountKobo: number): number {
    return amountKobo / 100;
}

/** 450000 → "₦450,000", 42000.5 → "₦42,000.50": kobo only when there are some, then always two places. */
export function formatPrice(amount: number): string {
    const fractionDigits = Number.isInteger(amount) ? 0 : 2;
    return `${DEFAULT_CURRENCY}${amount.toLocaleString("en-NG", { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
}

/** 1800000 → "₦1.8M", 500000 → "₦500k" — for tight spots where the exact amount isn't needed. */
export function formatCompactPrice(amount: number): string {
    return `${DEFAULT_CURRENCY}${formatCompactNumber(amount)}`;
}

/** 400000 → "₦400,000.00" — balances always show kobo, prices don't. */
export function formatBalance(amount: number): string {
    return `${DEFAULT_CURRENCY}${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
