"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { JOBS, type Job } from "@/constant/manufacturer";
import { jobsService } from "@/lib/services/jobsService";

// ─────────────────────────────────────────────────────────────────────────────
// LeadReviewsProvider — the manufacturer's ratings of their jobs' project
// leads, asked for the moment a job is completed (see LeadReviewPrompt) and
// shown on the job. Shared across the dashboard so a rating stays given.
// Closing the prompt puts it off until they next open the platform; the job
// keeps a way to rate. Seeded from sample data and kept in memory for now;
// once the backend is connected, send each rating to the API.
// ─────────────────────────────────────────────────────────────────────────────

export type LeadReview = NonNullable<Job["leadReview"]>;

type LeadReviewsContextValue = {
    getLeadReview: (jobId: string) => LeadReview | null;
    submitLeadReview: (jobId: string, review: Pick<LeadReview, "rating" | "comment">) => void | Promise<void>;
    /** Completed jobs whose lead they haven't rated, and haven't put off — newest first. */
    jobsToRate: Job[];
    /** Closes the prompt for a job, until they next open the platform. */
    putOff: (jobId: string) => void;
};

const LeadReviewsContext = createContext<LeadReviewsContextValue | null>(null);

const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0);

export function LeadReviewsProvider({ children }: { children: ReactNode }) {
    const [reviews, setReviews] = useState<Record<string, LeadReview>>(() =>
        Object.fromEntries(JOBS.flatMap((job) => (job.leadReview ? [[job.id, job.leadReview]] : []))),
    );
    const [putOffJobIds, setPutOffJobIds] = useState<string[]>([]);

    const jobsToRate = JOBS.filter(
        (job) => job.status === "completed" && job.leadId && !reviews[job.id] && !putOffJobIds.includes(job.id),
    ).sort((a, b) => time(b.completedAt) - time(a.completedAt));

    const value: LeadReviewsContextValue = {
        getLeadReview: (jobId) => reviews[jobId] ?? null,
        submitLeadReview: async (jobId, review) => {
            setReviews((current) => ({ ...current, [jobId]: { ...review, createdAt: new Date().toISOString() } }));
            try {
                await jobsService.rateLead(jobId, review);
            } catch (err) {
                console.error("Failed to rate lead on server:", err);
            }
        },
        jobsToRate,
        putOff: (jobId) => setPutOffJobIds((current) => (current.includes(jobId) ? current : [...current, jobId])),
    };

    return <LeadReviewsContext.Provider value={value}>{children}</LeadReviewsContext.Provider>;
}

export function useLeadReviews() {
    const context = useContext(LeadReviewsContext);
    if (!context) throw new Error("useLeadReviews must be used within a LeadReviewsProvider");
    return context;
}
