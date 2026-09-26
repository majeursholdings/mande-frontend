import { ARTISAN_SIGNUP_URL } from "@/constant/navigation";

export type JobSampleData = {
    id: string | number;
    referenceId: string;
    title: string;
    cost: number;
    category: string;
    timeline: string;
    imageSrc?: string;
};

export const JOBS_SAMPLE_DATA: JobSampleData[] = [
    {
        id: 1,
        referenceId: "MND-JB-001",
        title: "Solid Oak Dining Table",
        cost: 185000,
        category: "Dining Room",
        timeline: "2 weeks",
        imageSrc: "/sample-image/table.webp",
    },
    {
        id: 2,
        referenceId: "MND-JB-002",
        title: "6-Seater Sectional Sofa",
        cost: 340000,
        category: "Living Room",
        timeline: "3 weeks",
        imageSrc: "/sample-image/sectional-sofa.png",
    },
    {
        id: 3,
        referenceId: "MND-JB-003",
        title: "Ergonomic Walnut Executive Desk",
        cost: 210000,
        category: "Office",
        timeline: "10 days",
        imageSrc: "/sample-image/table.webp",
    },
    {
        id: 4,
        referenceId: "MND-JB-004",
        title: "Custom 4-Door Wardrobe",
        cost: 420000,
        category: "Bedroom",
        timeline: "4 weeks",
        imageSrc: "/images/image1.png",
    },
    {
        id: 5,
        referenceId: "MND-JB-005",
        title: "Minimalist Floating TV Console",
        cost: 125000,
        category: "Living Room",
        timeline: "1 week",
        imageSrc: "/sample-image/tv-console.webp",
    },
    {
        id: 6,
        referenceId: "MND-JB-006",
        title: "King-Size Upholstered Bed Frame",
        cost: 290000,
        category: "Bedroom",
        timeline: "3 weeks",
        imageSrc: "/sample-image/bed.webp",
    },
    {
        id: 7,
        referenceId: "MND-JB-007",
        title: "Modern Hardwood Kitchen Island",
        cost: 480000,
        category: "Kitchen",
        timeline: "4 weeks",
        imageSrc: "/images/image1.png",
    },
    {
        id: 8,
        referenceId: "MND-JB-008",
        title: "Geometric Bookshelf Wall Unit",
        cost: 165000,
        category: "Living Room",
        timeline: "12 days",
        imageSrc: "/images/image1.png",
    },
    {
        id: 9,
        referenceId: "MND-JB-009",
        title: "Handcrafted Coffee Table",
        cost: 95000,
        category: "Living Room",
        timeline: "5 days",
        imageSrc: "/images/image1.png",
    },
    {
        id: 10,
        referenceId: "MND-JB-010",
        title: "Outdoor Weather-Resistant Patio Set",
        cost: 310000,
        category: "Outdoor",
        timeline: "2 weeks",
        imageSrc: "/images/image1.png",
    },
    {
        id: 11,
        referenceId: "MND-JB-011",
        title: "Accent Velvet Armchair & Ottoman",
        cost: 145000,
        category: "Living Room",
        timeline: "1 week",
        imageSrc: "/images/image1.png",
    },
    {
        id: 12,
        referenceId: "MND-JB-012",
        title: "Modern Bedside Nightstand Pair",
        cost: 85000,
        category: "Bedroom",
        timeline: "6 days",
        imageSrc: "/images/image1.png",
    },
    {
        id: 13,
        referenceId: "MND-JB-013",
        title: "Industrial Bar Stool Set (4 Pcs)",
        cost: 115000,
        category: "Dining Room",
        timeline: "10 days",
        imageSrc: "/images/image1.png",
    },
    {
        id: 14,
        referenceId: "MND-JB-014",
        title: "Custom Vanity Dressing Table",
        cost: 195000,
        category: "Bedroom",
        timeline: "2 weeks",
        imageSrc: "/images/image1.png",
    },
    {
        id: 15,
        referenceId: "MND-JB-015",
        title: "Modular Entryway Storage Bench",
        cost: 105000,
        category: "Storage",
        timeline: "1 week",
        imageSrc: "/images/image1.png",
    },
];

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
