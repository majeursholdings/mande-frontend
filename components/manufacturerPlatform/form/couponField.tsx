"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, TicketPercent, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/form";
import { MandeApiError, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    COUPON_ERROR_MESSAGES,
    couponService,
    formatCouponValue,
    type CouponCheckResult,
    type CouponKind,
} from "@/lib/services/couponService";

/** A coupon that passed POST /coupons/check, with the amount it was checked against. */
export type AppliedCoupon = CouponCheckResult & { checkedAmountKobo: number };

/** The friendly message for a coupon error code, or null when it isn't one. */
export function getCouponErrorMessage(err: unknown): string | null {
    if (err instanceof MandeApiError && err.code && COUPON_ERROR_MESSAGES[err.code]) {
        return COUPON_ERROR_MESSAGES[err.code];
    }
    return null;
}

/**
 * What a checked coupon takes off `amountKobo`: the API's own figure when the
 * amount hasn't changed since the check, otherwise worked out the same way
 * (the API still decides when the payment starts).
 */
export function getCouponDiscountKobo(applied: AppliedCoupon | null, amountKobo: number): number {
    if (!applied || amountKobo <= 0) return 0;
    if (applied.checkedAmountKobo === amountKobo) return Math.min(applied.discountKobo, amountKobo);
    const { type, value } = applied.coupon;
    const discount = type === "percent" ? Math.round((amountKobo * value) / 100) : value;
    return Math.max(0, Math.min(discount, amountKobo));
}

/**
 * The best one only: a coupon and another discount (a plan discount or the
 * platform plan offer) never stack, so whichever saves more is used.
 */
export function pickBestDiscount(otherDiscountKobo: number, couponDiscountKobo: number) {
    const couponWins = couponDiscountKobo > otherDiscountKobo;
    return {
        source: couponWins ? ("coupon" as const) : otherDiscountKobo > 0 ? ("other" as const) : null,
        discountKobo: couponWins ? couponDiscountKobo : otherDiscountKobo,
    };
}

/**
 * An optional coupon code with an Apply button: checks the code against
 * `amountKobo` (POST /coupons/check) and hands the result up. Once applied it
 * shows the code with a way to remove it. Enter applies the code without
 * submitting the form around it.
 */
export default function CouponField({
    kind,
    amountKobo,
    email,
    applied,
    onApply,
    onRemove,
    disabled = false,
    disabledReason,
    error: externalError,
    className,
}: {
    kind: CouponKind;
    /** The amount before any discount. */
    amountKobo: number;
    email?: string;
    applied: AppliedCoupon | null;
    onApply: (coupon: AppliedCoupon) => void;
    onRemove: () => void;
    disabled?: boolean;
    /** Shown when Apply is pressed while there's nothing to apply it to yet. */
    disabledReason?: string;
    /** An error from outside (e.g. the payment turned the coupon down). */
    error?: string | null;
    className?: string;
}) {
    const [code, setCode] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const shownError = error ?? externalError ?? null;

    const apply = async () => {
        const trimmed = code.trim().toUpperCase();
        if (!trimmed) {
            setError("Enter a coupon code.");
            return;
        }
        if (amountKobo <= 0) {
            setError(disabledReason ?? "There's nothing to apply the coupon to yet.");
            return;
        }
        setIsChecking(true);
        setError(null);
        try {
            const validEmail = email && /^\S+@\S+\.\S+$/.test(email.trim()) ? email.trim() : undefined;
            const result = await couponService.checkCoupon({ code: trimmed, kind, amountKobo, email: validEmail });
            onApply({ ...result, checkedAmountKobo: amountKobo });
            setCode("");
        } catch (err) {
            const couponMessage = getCouponErrorMessage(err);
            if (couponMessage) setError(couponMessage);
            else toast.error(getErrorMessage(err, "Couldn't check that coupon. Please try again."));
        } finally {
            setIsChecking(false);
        }
    };

    if (applied) {
        return (
            <div className={cn("flex flex-col gap-1.5", className)}>
                <span className="text-sm font-medium font-text text-zinc-700">Coupon</span>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 px-3.5 py-2.5 text-sm font-text text-primary-900">
                    <span className="flex min-w-0 items-center gap-2">
                        <TicketPercent className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                        <span className="truncate">
                            <span className="font-semibold">{applied.coupon.code}</span>{" "}
                            <span className="text-primary-800">({formatCouponValue(applied.coupon)})</span>
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setError(null);
                            onRemove();
                        }}
                        disabled={disabled}
                        className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-primary-900 transition-colors hover:bg-primary-100 cursor-pointer disabled:opacity-50"
                    >
                        <X className="size-3.5" aria-hidden />
                        Remove
                    </button>
                </div>
                {shownError && <p className="text-xs font-text text-red-600">{shownError}</p>}
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <label htmlFor={`coupon-${kind}`} className="text-sm font-medium font-text text-zinc-700">
                Coupon code <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <div className="flex gap-2">
                <Input
                    id={`coupon-${kind}`}
                    value={code}
                    onChange={(event) => {
                        setCode(event.target.value.toUpperCase());
                        if (error) setError(null);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            void apply();
                        }
                    }}
                    placeholder="e.g. SAVE10"
                    autoComplete="off"
                    maxLength={30}
                    disabled={disabled || isChecking}
                    aria-invalid={!!shownError}
                    className={cn(inputClass(shownError ?? undefined), "uppercase placeholder:normal-case")}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => void apply()}
                    disabled={disabled || isChecking}
                    className="h-11 shrink-0 rounded-lg px-4 font-text font-medium cursor-pointer"
                >
                    {isChecking ? <Loader2 className="size-4 animate-spin" aria-label="Checking" /> : "Apply"}
                </Button>
            </div>
            {shownError && <p className="text-xs font-text text-red-600">{shownError}</p>}
        </div>
    );
}
