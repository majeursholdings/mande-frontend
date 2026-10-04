"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Job } from "@/constant/manufacturer";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import { useMyJobList } from "./useManufacturerJobLists";

// ─────────────────────────────────────────────────────────────────────────────
// LeadReviewsProvider — the manufacturer's ratings of their jobs' project
// leads, asked for the moment a job is completed (see LeadReviewPrompt) and
// shown on the job. Shared across the dashboard so a rating stays given.
// Closing the prompt puts it off until they next open the platform; the job
// keeps a way to rate. Ratings come with the manufacturer's jobs from the
// API, and a new one counts once the API has taken it.
// ─────────────────────────────────────────────────────────────────────────────

export type LeadReview = NonNullable<Job["leadReview"]>;

type LeadReviewsContextValue = {
    getLeadReview: (jobId: string) => LeadReview | null;
    /** Rejects if the API doesn't take it. */
    submitLeadReview: (jobId: string, review: Pick<LeadReview, "rating" | "comment">) => Promise<void>;
    /** Completed jobs whose lead they haven't rated, and haven't put off — newest first. */
    jobsToRate: Job[];
    /** Closes the prompt for a job, until they next open the platform. */
    putOff: (jobId: string) => void;
};

const LeadReviewsContext = createContext<LeadReviewsContextValue | null>(null);

const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0);

export function LeadReviewsProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { jobs } = useMyJobList();
    // Ratings given this visit, until the refetched jobs carry them
    const [submitted, setSubmitted] = useState<Record<string, LeadReview>>({});
    const reviews: Record<string, LeadReview> = useMemo(
        () => ({
            ...Object.fromEntries(jobs.flatMap((job) => (job.leadReview ? [[job.id, job.leadReview]] : []))),
            ...submitted,
        }),
        [jobs, submitted],
    );
    const [putOffJobIds, setPutOffJobIds] = useState<string[]>([]);

    const jobsToRate = useMemo(
        () =>
            jobs
                .filter(
                    (job) =>
                        job.status === "completed" && job.leadId && !reviews[job.id] && !putOffJobIds.includes(job.id),
                )
                .sort((a, b) => time(b.completedAt) - time(a.completedAt)),
        [jobs, reviews, putOffJobIds],
    );

    const getLeadReview = useCallback((jobId: string) => reviews[jobId] ?? null, [reviews]);
    const submitLeadReview = useCallback(
        async (jobId: string, review: Pick<LeadReview, "rating" | "comment">) => {
            await jobsService.rateLead(jobId, review);
            setSubmitted((current) => ({ ...current, [jobId]: { ...review, createdAt: new Date().toISOString() } }));
            void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
        },
        [queryClient],
    );
    const putOff = useCallback(
        (jobId: string) => setPutOffJobIds((current) => (current.includes(jobId) ? current : [...current, jobId])),
        [],
    );

    const value: LeadReviewsContextValue = useMemo(
        () => ({ getLeadReview, submitLeadReview, jobsToRate, putOff }),
        [getLeadReview, submitLeadReview, jobsToRate, putOff],
    );

    return <LeadReviewsContext.Provider value={value}>{children}</LeadReviewsContext.Provider>;
}

export function useLeadReviews() {
    const context = useContext(LeadReviewsContext);
    if (!context) throw new Error("useLeadReviews must be used within a LeadReviewsProvider");
    return context;
}
