// ─────────────────────────────────────────────────────────────────────────────
// What the public website reads from the API: the open jobs, the plans, the
// community and the factory's machine catalogue.
// These run on the server (in Server Components), with plain fetch so Next.js
// caches them: each page is served from the cache and refreshed at most once
// a minute. Neither needs a signed-in user. When the API can't be reached they
// return null, so a page shows its empty state instead of failing.
// ─────────────────────────────────────────────────────────────────────────────

import { API_BASE_URL } from "@/lib/api";
import { NOT_INCLUDED, type PricingPlan } from "@/constant/plans";
import type { MachineBookingUnit } from "@/lib/services/machineBookingService";

/** How often, in seconds, the website asks the API again. */
const REVALIDATE_SECONDS = 60;

/** The most open jobs the Open Jobs page lists (the API sends at most 50 a page). */
const MAX_OPEN_JOBS = 200;
const PAGE_SIZE = 50;

/** An open job, as the API shows it to visitors (no attachments). */
export type WebsiteJob = {
    id: string;
    code: string;
    title: string;
    description: string;
    /** A COMPANY_SPECIALITY_OPTIONS value. */
    category: string;
    /** What the manufacturer is paid, in kobo. */
    amountKobo: number;
    /** ISO dates. */
    startDate: string;
    dueDate: string;
    postedAt: string;
    deliveryLocation?: { city: string; state: string } | null;
    image: { url: string | null; name: string | null; kind: "image" | "document" } | null;
};

/** A plan, with its prices in kobo: the usual ones, and what it costs now with the offer. */
export type WebsitePlan = {
    id: string;
    tierNumber: string;
    name: string;
    targetAudience: string;
    monthlyPriceKobo: number;
    annualPriceKobo: number;
    currentMonthlyPriceKobo: number;
    currentAnnualPriceKobo: number;
    maxConcurrentJobs: number | null;
    features: { label: string; value: string }[];
};

/** A website plan in the app's plan shape (prices in naira, before any offer). */
export function toPricingPlan(plan: WebsitePlan): PricingPlan {
    return {
        id: plan.id,
        tierNumber: plan.tierNumber,
        name: plan.name,
        targetAudience: plan.targetAudience,
        monthlyPrice: Math.round(plan.monthlyPriceKobo / 100),
        annualPrice: Math.round(plan.annualPriceKobo / 100),
        maxConcurrentJobs: plan.maxConcurrentJobs,
        features: plan.features,
    };
}

/** "10% off" — a plan's machine-access discount, or null when the plan doesn't include it. */
export function getMachineAccess(plan: { features: { label: string; value: string }[] }): string | null {
    const value = plan.features.find((feature) => feature.label === "Easy access to top machinery")?.value;
    return value && value !== NOT_INCLUDED ? value : null;
}

export type WebsitePlans = {
    plans: WebsitePlan[];
    /** The offer on every plan, as a percentage off: 0 for none. */
    discountPercent: number;
};

async function getJson<T>(path: string, init?: RequestInit): Promise<T | null> {
    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            next: { revalidate: REVALIDATE_SECONDS },
            ...init,
        });
        if (!response.ok) {
            console.error(`Website fetch ${path} failed with ${response.status}`);
            return null;
        }
        return (await response.json()) as T;
    } catch (error) {
        console.error(`Website fetch ${path} failed`, error);
        return null;
    }
}

/**
 * Open jobs, newest first: `limit` of them, or every one (up to
 * MAX_OPEN_JOBS) when it's left out. Null when the API can't be reached.
 */
export async function getWebsiteOpenJobs(limit?: number): Promise<WebsiteJob[] | null> {
    const wanted = Math.min(limit ?? MAX_OPEN_JOBS, MAX_OPEN_JOBS);
    const jobs: WebsiteJob[] = [];
    let before: string | null = null;
    do {
        const params = new URLSearchParams({ limit: String(Math.min(PAGE_SIZE, wanted - jobs.length)) });
        if (before) params.set("before", before);
        const page: { jobs: WebsiteJob[]; nextBefore: string | null } | null = await getJson(`/open-jobs?${params}`);
        // A later page failing still leaves the jobs already read
        if (!page) return jobs.length > 0 ? jobs : null;
        jobs.push(...page.jobs);
        before = page.nextBefore;
    } while (before && jobs.length < wanted);
    return jobs;
}

/** One open job, as visitors see it. Null when it isn't open (taken, closed, or no such job) or the API can't be reached. */
export async function getWebsiteOpenJob(jobId: string): Promise<WebsiteJob | null> {
    if (!/^[a-f\d]{24}$/i.test(jobId)) return null;
    const data = await getJson<{ job: WebsiteJob }>(`/open-jobs/${jobId}`);
    return data?.job ?? null;
}

/** The plans and the offer on them now. Null when the API can't be reached. */
export async function getWebsitePlans(): Promise<WebsitePlans | null> {
    return getJson<WebsitePlans>("/plans");
}

export type WebsiteCommunityData = {
    featuredChannel: import("@/constant/community").CommunityChannel;
    channels: import("@/constant/community").CommunityChannel[];
    allChannels: import("@/constant/community").CommunityChannel[];
    testimonials: import("@/constant/community").CommunityTestimonial[];
};

/** Community channels and testimonials for public pages. */
export async function getWebsiteCommunity(): Promise<WebsiteCommunityData | null> {
    return getJson<WebsiteCommunityData>("/community");
}

/** A factory machine, as the public catalogue shows it (active machines only). */
export type WebsiteMachine = {
    id: string;
    name: string;
    imageUrl: string | null;
    functions: string[];
    category: string;
    model: string | null;
    type: string | null;
    description: string | null;
    /** Null when it isn't offered that way. */
    hourlyPriceKobo: number | null;
    dailyPriceKobo: number | null;
    /** The price for the booking unit now, or null when it has none. */
    priceKobo: number | null;
    /** Whether it can be booked now (it has a price for the booking unit). */
    bookable: boolean;
};

export type WebsiteMachineCatalogue = {
    /** What machine time is booked by now. */
    unit: MachineBookingUnit;
    machines: WebsiteMachine[];
    /** Every category in the catalogue, for the filter (whatever `category` was asked for). */
    categories: string[];
};

export type WebsiteMachineDetail = { unit: MachineBookingUnit; machine: WebsiteMachine };

/** The machine catalogue, or just one category of it. Null when the API can't be reached. */
export async function getWebsiteMachines(category?: string): Promise<WebsiteMachineCatalogue | null> {
    const params = category ? `?${new URLSearchParams({ category })}` : "";
    const data = await getJson<WebsiteMachineCatalogue>(`/machines/catalogue${params}`);
    return data ? { unit: data.unit, machines: data.machines ?? [], categories: data.categories ?? [] } : null;
}

/** One machine in the catalogue. Null when there's no such (active) machine or the API can't be reached. */
export async function getWebsiteMachine(machineId: string): Promise<WebsiteMachineDetail | null> {
    if (!/^[a-f\d]{24}$/i.test(machineId)) return null;
    const data = await getJson<WebsiteMachineDetail>(`/machines/catalogue/${machineId}`);
    return data?.machine ? data : null;
}
