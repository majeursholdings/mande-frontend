"use client";

import { useState } from "react";
import {
    JOB_PRODUCTION_STEPS,
    MAX_JOB_REJECTIONS,
    type Job,
    type JobRejection,
    type JobStatus,
    type ProductionStepKey,
} from "@/constant/manufacturer";

export type JobDetailState = {
    status: JobStatus;
    dateAssigned: string | null;
    completedStepKeys: ProductionStepKey[];
    completionImageUrls?: string[];
    rejections: JobRejection[];
    banner: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// useJobDetailState — local, ephemeral state for the actions a manufacturer
// can take from the job detail panel (accept/decline, mark as done, report a
// delay, purchase materials, cancel, tick off production steps, resubmit a
// rejected job for review). The app has no API/store layer yet, so this
// seeds from the static `Job` fixture and resets on reload — same as every
// other mock-data screen in the app.
// ─────────────────────────────────────────────────────────────────────────────

export function useJobDetailState(job: Job) {
    const [state, setState] = useState<JobDetailState>({
        status: job.status,
        dateAssigned: job.dateAssigned,
        completedStepKeys: job.completedStepKeys,
        completionImageUrls: job.completionImageUrls,
        rejections: job.rejections ?? [],
        banner: null,
    });

    const showBanner = (message: string) => {
        setState((s) => ({ ...s, banner: message }));
        window.setTimeout(() => {
            setState((s) => (s.banner === message ? { ...s, banner: null } : s));
        }, 3000);
    };

    const acceptJob = () => {
        setState((s) => ({ ...s, status: "in-progress", dateAssigned: new Date().toISOString() }));
        showBanner("Job has been accepted");
    };

    const declineJob = () => {
        setState((s) => ({ ...s, status: "cancelled" }));
        showBanner("Job has been declined");
    };

    const cancelJob = () => {
        setState((s) => ({ ...s, status: "cancelled" }));
        showBanner("Job has been cancelled");
    };

    const reportDelay = () => {
        showBanner("Delay has been reported");
    };

    const purchaseMaterials = () => {
        showBanner("Materials purchased successfully");
    };

    // Takes any step key from the recorder, but only the fixed production
    // steps are manually completable — rejection steps are derived.
    const completeStep = (key: string) => {
        setState((s) => {
            const stepIndex = JOB_PRODUCTION_STEPS.findIndex((step) => step.key === key);
            const isNextStep = stepIndex !== -1 && stepIndex === s.completedStepKeys.length;
            if (!isNextStep) return s;
            return {
                ...s,
                completedStepKeys: [...s.completedStepKeys, JOB_PRODUCTION_STEPS[stepIndex].key],
            };
        });
    };

    const uploadCompletionPhoto = (imageUrls: string[]) => {
        setState((s) => ({ ...s, completionImageUrls: imageUrls, status: "in-review" }));
        showBanner("Job marked as done");
    };

    // New photo proof replaces the rejected submission and sends the job
    // back to the admin for review (which also completes the derived
    // "Redeliver" step). Blocked once the job hits MAX_JOB_REJECTIONS.
    const resubmitForReview = (imageUrls: string[]) => {
        if (state.status !== "rejected" || state.rejections.length >= MAX_JOB_REJECTIONS) return;
        setState((s) => ({ ...s, completionImageUrls: imageUrls, status: "in-review" }));
        showBanner("Job resubmitted for review");
    };

    return {
        state,
        acceptJob,
        declineJob,
        cancelJob,
        reportDelay,
        purchaseMaterials,
        completeStep,
        uploadCompletionPhoto,
        resubmitForReview,
    };
}
