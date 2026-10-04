import { formatPrice } from "@/lib/currency";

export type PricingFeature = {
    label: string;
    value: string;
};

/** A plan as the API sends it (see usePlans), with prices in naira. */
export type PricingPlan = {
    id: string;
    tierNumber: string;
    name: string;
    targetAudience: string;
    /** The usual price, before any offer (the API's discountPercent). */
    monthlyPrice: number;
    /** The usual yearly price, before any offer. */
    annualPrice: number;
    features: PricingFeature[];
    /**
     * How many jobs the manufacturer can have on at once — unfinished
     * assigned jobs plus open jobs they've applied for. Null for no limit.
     * Matches the "Concurrent jobs" feature.
     */
    maxConcurrentJobs: number | null;
};

export type BillingCycle = "monthly" | "annual";

/** A plan feature's value when the plan doesn't have it. */
export const NOT_INCLUDED = "Not included";

export function getPlanOfferText(discountPercent: number): string | null {
    return discountPercent > 0 ? `Every plan is ${discountPercent}% off for now` : null;
}

/** A plan's usual price, before any offer — shown struck through while an offer applies. */
export function getPlanListPrice(plan: PricingPlan, billingCycle: BillingCycle): number {
    return billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
}

/** What a plan costs now — its usual price, less the API's discountPercent. What's shown and charged. */
export function getPlanPrice(plan: PricingPlan, billingCycle: BillingCycle, discountPercent: number): number {
    return Math.round((getPlanListPrice(plan, billingCycle) * (100 - discountPercent)) / 100);
}

/** How much yearly billing saves on 12 monthly payments, e.g. 17. */
export function getAnnualSavingPercent(plan: PricingPlan): number {
    return Math.round((1 - plan.annualPrice / (plan.monthlyPrice * 12)) * 100);
}

/** "or ₦5,000 a year, saving 17%" — at the price it costs now. */
export function getAnnualSavingsText(plan: PricingPlan, discountPercent: number): string {
    return `or ${formatPrice(getPlanPrice(plan, "annual", discountPercent))} a year, saving ${getAnnualSavingPercent(plan)}%`;
}

export const SOLO_PLAN_ID = "solo";

/**
 * Solo artisans usually aren't registered businesses, so they can skip the
 * company tax number and business license number. Every other plan needs them.
 */
export function isSoloPlan(planId: string): boolean {
    return planId === SOLO_PLAN_ID;
}

export function requiresBusinessDocuments(planId: string): boolean {
    return !isSoloPlan(planId);
}
