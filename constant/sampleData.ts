import { ARTISAN_SIGNUP_URL } from "@/constant/navigation";
import { formatPrice } from "@/lib/currency";

export type PricingFeature = {
    label: string;
    value: string;
};

export type PricingPlan = {
    id: string;
    tierNumber: string;
    name: string;
    targetAudience: string;
    /** The usual price, before any offer (see PLAN_DISCOUNT_PERCENT). */
    monthlyPrice: number;
    /** The usual yearly price, before any offer. */
    annualPrice: number;
    features: PricingFeature[];
    buttonText: string;
    ctaUrl: string;
    /** The STAFF_RANGE_OPTIONS value that fits this plan's team size — prefills sign-up's staff question. */
    defaultStaffRange: string;
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

// ─── The plan offer ──────────────────────────────────────────────────────────
// A discount on every plan, as a percentage off its usual price: 0 for no
// offer. The live value is managed by the super admin settings and retrieved
// from the API (/plans).
export const DEFAULT_PLAN_DISCOUNT_PERCENT: number = 0;
export const PLAN_DISCOUNT_PERCENT: number = DEFAULT_PLAN_DISCOUNT_PERCENT;

export function getPlanOfferText(discountPercent: number): string | null {
    return discountPercent > 0 ? `Every plan is ${discountPercent}% off for now` : null;
}

/** "Every plan is X% off for now" — null while there's no offer. */
export const PLAN_OFFER_TEXT: string | null = getPlanOfferText(PLAN_DISCOUNT_PERCENT);

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: "solo",
        tierNumber: "01",
        name: "Solo Artisan",
        targetAudience: "1 PERSON",
        monthlyPrice: 5000,
        annualPrice: 50000,
        features: [
            { label: "Concurrent jobs", value: "2" },
            { label: "Easy access to top machinery", value: NOT_INCLUDED },
            { label: "Dedicated officer", value: NOT_INCLUDED },
        ],
        buttonText: "Choose solo",
        defaultStaffRange: "1-10",
        ctaUrl: `${ARTISAN_SIGNUP_URL}?plan=solo`,
        maxConcurrentJobs: 2,
    },
    {
        id: "workshop",
        tierNumber: "02",
        name: "Workshop",
        targetAudience: "UP TO 10 PEOPLE TEAM",
        monthlyPrice: 15000,
        annualPrice: 150000,
        features: [
            { label: "Concurrent jobs", value: "6" },
            { label: "Easy access to top machinery", value: "10% off" },
            { label: "Dedicated officer", value: "Yes" },
        ],
        buttonText: "Choose workshop",
        defaultStaffRange: "1-10",
        ctaUrl: `${ARTISAN_SIGNUP_URL}?plan=workshop`,
        maxConcurrentJobs: 6,
    },
    {
        id: "studio-enterprise",
        tierNumber: "03",
        name: "Studio / Enterprise",
        targetAudience: "10+ PEOPLE TEAM",
        monthlyPrice: 35000,
        annualPrice: 350000,
        features: [
            { label: "Concurrent jobs", value: "Unlimited" },
            { label: "Easy access to top machinery", value: "20% off" },
            { label: "Dedicated officer", value: "Yes" },
        ],
        buttonText: "Choose studio",
        defaultStaffRange: "11-20",
        ctaUrl: `${ARTISAN_SIGNUP_URL}?plan=studio-enterprise`,
        maxConcurrentJobs: null,
    },
];

export function getPricingPlan(planId: string): PricingPlan | undefined {
    return PRICING_PLANS.find((plan) => plan.id === planId);
}

/** A plan's usual price, before any offer — shown struck through while PLAN_DISCOUNT_PERCENT applies. */
export function getPlanListPrice(plan: PricingPlan, billingCycle: BillingCycle): number {
    return billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
}

/** What a plan costs now — its usual price, less discountPercent (defaults to PLAN_DISCOUNT_PERCENT). What's shown and charged. */
export function getPlanPrice(plan: PricingPlan, billingCycle: BillingCycle, discountPercent: number = PLAN_DISCOUNT_PERCENT): number {
    return Math.round((getPlanListPrice(plan, billingCycle) * (100 - discountPercent)) / 100);
}

/** How much yearly billing saves on 12 monthly payments, e.g. 17. */
export function getAnnualSavingPercent(plan: PricingPlan): number {
    return Math.round((1 - plan.annualPrice / (plan.monthlyPrice * 12)) * 100);
}

/** "or ₦5,000 a year, saving 17%" — at the price it costs now. */
export function getAnnualSavingsText(plan: PricingPlan, discountPercent: number = PLAN_DISCOUNT_PERCENT): string {
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
