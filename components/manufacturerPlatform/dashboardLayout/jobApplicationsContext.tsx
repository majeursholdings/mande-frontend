"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
    JOBS,
    MANUFACTURER_JOB_APPLICATIONS,
    isActiveJob,
    type JobApplication,
} from "@/constant/manufacturer";
import { getPricingPlan, type PricingPlan } from "@/constant/sampleData";
import { useManufacturerSubscription } from "./manufacturerSubscriptionContext";

// ─────────────────────────────────────────────────────────────────────────────
// JobApplicationsProvider — the open jobs the manufacturer has applied for,
// and how many of their plan's concurrent job slots are in use: one for each
// active assigned job, and one for each application. Applying needs a free
// slot. The dashboard, the jobs page and the open job detail all read the
// count from here, so it's the same everywhere. Seeded from sample data and
// updated locally for now; once the backend is connected, load applications
// from the API and send new ones and withdrawals there.
// ─────────────────────────────────────────────────────────────────────────────

// Assigned jobs are fixed sample data for now (changes made from the job
// detail panel stay local to it), so their count is too
const ACTIVE_JOB_COUNT = JOBS.filter(isActiveJob).length;

export type JobSlots = {
    activeJobCount: number;
    applicationCount: number;
    /** activeJobCount + applicationCount — can be over the limit, e.g. after a downgrade. */
    used: number;
    /** Null when the plan has no limit. */
    limit: number | null;
    /** Whether there's a free slot for another application. */
    canApply: boolean;
};

type JobApplicationsContextValue = {
    applications: JobApplication[];
    getApplication: (jobId: string) => JobApplication | undefined;
    /** Does nothing if there's no free slot, or they've already applied. */
    apply: (jobId: string) => void;
    withdraw: (jobId: string) => void;
    slots: JobSlots;
    /** The manufacturer's current plan — named in the limit messages. */
    plan: PricingPlan | undefined;
};

const JobApplicationsContext = createContext<JobApplicationsContextValue | null>(null);

export function JobApplicationsProvider({ children }: { children: ReactNode }) {
    const { subscription } = useManufacturerSubscription();
    const [applications, setApplications] = useState(MANUFACTURER_JOB_APPLICATIONS);

    const plan = getPricingPlan(subscription.planId);
    // An unknown plan gets no slots rather than unlimited ones
    const limit = plan ? plan.maxConcurrentJobs : 0;
    const hasFreeSlot = (applicationCount: number) =>
        limit === null || ACTIVE_JOB_COUNT + applicationCount < limit;

    const slots: JobSlots = {
        activeJobCount: ACTIVE_JOB_COUNT,
        applicationCount: applications.length,
        used: ACTIVE_JOB_COUNT + applications.length,
        limit,
        canApply: hasFreeSlot(applications.length),
    };

    const value: JobApplicationsContextValue = {
        applications,
        getApplication: (jobId) => applications.find((application) => application.jobId === jobId),
        apply: (jobId) =>
            setApplications((current) =>
                current.some((application) => application.jobId === jobId) ||
                !hasFreeSlot(current.length)
                    ? current
                    : [...current, { jobId, appliedAt: new Date().toISOString() }],
            ),
        withdraw: (jobId) =>
            setApplications((current) =>
                current.filter((application) => application.jobId !== jobId),
            ),
        slots,
        plan,
    };

    return (
        <JobApplicationsContext.Provider value={value}>{children}</JobApplicationsContext.Provider>
    );
}

export function useJobApplications() {
    const context = useContext(JobApplicationsContext);
    if (!context) {
        throw new Error("useJobApplications must be used within a JobApplicationsProvider");
    }
    return context;
}

/**
 * Sends an application for `jobId`, with its loading state and toasts —
 * shared by the job card's "Apply now" and the open job detail's "Apply".
 */
export function useApplyForJob(jobId: string) {
    const { apply } = useJobApplications();
    const [isApplying, setIsApplying] = useState(false);

    const applyForJob = async () => {
        setIsApplying(true);
        try {
            // No backend is wired up yet — simulate sending the application
            await new Promise((resolve) => setTimeout(resolve, 800));
            apply(jobId);
            toast.success("Application sent");
        } catch {
            toast.error("Couldn't send your application. Please try again.");
        } finally {
            setIsApplying(false);
        }
    };

    return { isApplying, applyForJob };
}
