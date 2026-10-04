"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isActiveJob, type JobApplication } from "@/constant/manufacturer";
import type { PricingPlan } from "@/constant/plans";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import { useManufacturerSubscription } from "./manufacturerSubscriptionContext";
import { useManufacturerAccount } from "./manufacturerAccountContext";
import { useMyJobList, useOpenJobList } from "./useManufacturerJobLists";
import { usePlans } from "@/hooks/usePlans";

// ─────────────────────────────────────────────────────────────────────────────
// JobApplicationsProvider — the open jobs the manufacturer has applied for,
// and how many of their plan's concurrent job slots are in use: one for each
// active assigned job, and one for each application. Applying needs a free
// slot. The dashboard, the jobs page and the open job detail all read the
// count from here, so it's the same everywhere. Both come from the API: each
// open job carries the manufacturer's own application, and their assigned
// jobs say which are active. Applying and withdrawing go to the API first.
// ─────────────────────────────────────────────────────────────────────────────

export type JobSlots = {
    activeJobCount: number;
    applicationCount: number;
    /** activeJobCount + applicationCount — can be over the limit, e.g. after a downgrade. */
    used: number;
    /** Null when the plan has no limit. One while the account is flagged. */
    limit: number | null;
    /** Whether there's a free slot for another application. */
    canApply: boolean;
    /** Why the limit is lower than the plan's — null when it's just the plan. */
    accountHold: "flagged" | null;
};

type JobApplicationsContextValue = {
    applications: JobApplication[];
    getApplication: (jobId: string) => JobApplication | undefined;
    /** Applies through the API. Rejects if it doesn't take it (no free slot, already applied). */
    apply: (jobId: string) => Promise<void>;
    /** Withdraws through the API. Rejects if it doesn't. */
    withdraw: (jobId: string) => Promise<void>;
    slots: JobSlots;
    /** The manufacturer's current plan — named in the limit messages. */
    plan: PricingPlan | undefined;
    /** True until the jobs, the plan and the plan list behind the slot count have loaded. */
    isLoading: boolean;
};

const JobApplicationsContext = createContext<JobApplicationsContextValue | null>(null);

export function JobApplicationsProvider({ children }: { children: ReactNode }) {
    const { subscription, isLoading: isSubscriptionLoading } = useManufacturerSubscription();
    const { isFlagged } = useManufacturerAccount();
    const queryClient = useQueryClient();

    const { rawJobs: openJobs, isPending: isOpenJobsPending } = useOpenJobList();
    const { jobs: myJobs, isPending: isMyJobsPending } = useMyJobList();

    const applications: JobApplication[] = useMemo(
        () =>
            openJobs
                .filter((job) => job.application?.status === "pending")
                .map((job) => ({ jobId: job.id, appliedAt: job.application?.appliedAt ?? "" })),
        [openJobs],
    );
    const activeJobCount = useMemo(() => myJobs.filter(isActiveJob).length, [myJobs]);

    const { getPlan, isPending: isPlansPending } = usePlans();
    const plan = getPlan(subscription?.planId);
    // An unknown plan gets no slots rather than unlimited ones; a flagged
    // account gets one, whatever the plan
    const planLimit = plan ? plan.maxConcurrentJobs : 0;
    const limit = isFlagged ? Math.min(planLimit ?? 1, 1) : planLimit;
    const applicationCount = applications.length;

    const slots: JobSlots = useMemo(
        () => ({
            activeJobCount,
            applicationCount,
            used: activeJobCount + applicationCount,
            limit,
            canApply: limit === null || activeJobCount + applicationCount < limit,
            accountHold: isFlagged ? "flagged" : null,
        }),
        [activeJobCount, applicationCount, limit, isFlagged],
    );

    const getApplication = useCallback(
        (jobId: string) => applications.find((application) => application.jobId === jobId),
        [applications],
    );
    const apply = useCallback(
        async (jobId: string) => {
            await jobsService.applyForJob(jobId);
            await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
        },
        [queryClient],
    );
    const withdraw = useCallback(
        async (jobId: string) => {
            await jobsService.withdrawApplication(jobId);
            await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
        },
        [queryClient],
    );
    const isLoading = isSubscriptionLoading || isOpenJobsPending || isMyJobsPending || isPlansPending;

    const value: JobApplicationsContextValue = useMemo(
        () => ({ applications, getApplication, apply, withdraw, slots, plan, isLoading }),
        [applications, getApplication, apply, withdraw, slots, plan, isLoading],
    );

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

export function useApplyForJob(jobId: string) {
    const { apply } = useJobApplications();
    const [isApplying, setIsApplying] = useState(false);

    const applyForJob = async () => {
        setIsApplying(true);
        try {
            await apply(jobId);
            toast.success("Application sent");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't send your application. Please try again."));
        } finally {
            setIsApplying(false);
        }
    };

    return { isApplying, applyForJob };
}
