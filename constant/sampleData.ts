import { ARTISAN_SIGNUP_URL } from "@/constant/navigation";

export type PricingFeature = {
    label: string;
    value: string;
};

export type PricingPlan = {
    id: string;
    tierNumber: string;
    name: string;
    targetAudience: string;
    monthlyPrice: number;
    annualPrice: number;
    savingsText: string;
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

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: "solo",
        tierNumber: "01",
        name: "Solo Artisan",
        targetAudience: "1 PERSON",
        monthlyPrice: 5000,
        annualPrice: 50000,
        savingsText: "or ₦50,000 a year, saving 17%",
        features: [
            { label: "Concurrent jobs", value: "2" },
            { label: "Easy access to top machinery", value: "—" },
            { label: "Dedicated officer", value: "—" },
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
        savingsText: "or ₦150,000 a year, saving 17%",
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
        savingsText: "or ₦350,000 a year, saving 17%",
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

export function getPlanPrice(plan: PricingPlan, billingCycle: BillingCycle): number {
    return billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
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
