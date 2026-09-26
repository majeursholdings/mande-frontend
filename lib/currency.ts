import { DEFAULT_CURRENCY } from "@/constant/global";

/** 450000 → "₦450,000" */
export function formatPrice(amount: number): string {
    return `${DEFAULT_CURRENCY}${amount.toLocaleString("en-NG")}`;
}
