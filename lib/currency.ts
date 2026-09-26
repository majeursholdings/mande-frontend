import { DEFAULT_CURRENCY } from "@/constant/global";

/** 450000 → "₦450,000" */
export function formatPrice(amount: number): string {
    return `${DEFAULT_CURRENCY}${amount.toLocaleString("en-NG")}`;
}

/** 400000 → "₦400,000.00" — balances always show kobo, prices don't. */
export function formatBalance(amount: number): string {
    return `${DEFAULT_CURRENCY}${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
