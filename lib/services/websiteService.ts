// ─────────────────────────────────────────────────────────────────────────────
// What the public website reads from the API: the open jobs and the plans.
// These run on the server (in Server Components), with plain fetch so Next.js
// caches them: each page is served from the cache and refreshed at most once
// a minute. Neither needs a signed-in user. When the API can't be reached they
// return null, so a page shows its empty state instead of failing.
// ─────────────────────────────────────────────────────────────────────────────

import { API_BASE_URL } from "@/lib/api";

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

/** The plans and the offer on them now. Null when the API can't be reached. */
export async function getWebsitePlans(): Promise<WebsitePlans | null> {
    return getJson<WebsitePlans>("/plans");
}
