"use client";

import { useState } from "react";
import {
    MAX_JOB_REJECTIONS,
    getJobPaymentInput,
    settleJob,
    type Job,
    type JobRejection,
    type JobStatus,
} from "@/constant/manufacturer";
import {
    canCancelJob,
    getCurrentStep,
    getJobPayments,
    getStepProgress,
    type ProductionStepKey,
    type StepSubmission,
} from "@/constant/jobWorkflow";
import { SIGNED_IN_MANUFACTURER_ID, getPayoutId, type TimelineExtensionRecord } from "@/constant/sampleDb";
import { useManufacturerWallet } from "../dashboardLayout/manufacturerWalletContext";

export type JobDetailState = {
    status: JobStatus;
    dateAssigned: string | null;
    stepSubmissions: StepSubmission[];
    completionImageUrls?: string[];
    submittedForReviewAt: string | null;
    completedAt: string | null;
    rejections: JobRejection[];
    /** Newest first. */
    extensionRequests: TimelineExtensionRecord[];
    banner: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// useJobDetailState — local, ephemeral state for the actions a manufacturer
// can take from the job detail panel (accept/decline, send proof of each
// production step, mark as done, report a delay, purchase materials, cancel
// until they're past the Materials step, resubmit a rejected job for review). Anything left unreviewed past its
// deadline reads as approved automatically (see settleJob). The app has no
// API/store layer yet, so this seeds from the static `Job` fixture and
// resets on reload — same as every other mock-data screen in the app.
// ─────────────────────────────────────────────────────────────────────────────

export function useJobDetailState(job: Job) {
    const { receivePayment } = useManufacturerWallet();
    const [storedState, setState] = useState<JobDetailState>({
        status: job.status,
        dateAssigned: job.dateAssigned,
        stepSubmissions: job.stepSubmissions,
        completionImageUrls: job.completionImageUrls,
        submittedForReviewAt: job.submittedForReviewAt ?? null,
        completedAt: job.completedAt ?? null,
        rejections: job.rejections ?? [],
        extensionRequests: job.extensionRequests,
        banner: null,
    });
    // A job held for further review waits for a super admin, not the clock
    const state = settleJob({ ...storedState, isHeldForReview: job.isHeldForReview });

    const showBanner = (message: string) => {
        setState((s) => ({ ...s, banner: message }));
        window.setTimeout(() => {
            setState((s) => (s.banner === message ? { ...s, banner: null } : s));
        }, 3000);
    };

    const acceptJob = () => {
        const acceptedAt = new Date().toISOString();
        setState((s) => ({ ...s, status: "in-progress", dateAssigned: acceptedAt }));
        // The first part of the pay is released the moment they say yes
        const [firstPayment] = getJobPayments(getJobPaymentInput({ ...job, dateAssigned: acceptedAt })).payments;
        receivePayment({
            id: getPayoutId(job.id, firstPayment.milestone, SIGNED_IN_MANUFACTURER_ID),
            amount: firstPayment.amount,
            label: firstPayment.label,
            projectName: job.title,
        });
        showBanner("Job accepted — your first payment is in your wallet");
    };

    const declineJob = () => {
        setState((s) => ({ ...s, status: "cancelled" }));
        showBanner("Job has been declined");
    };

    // Not once they're past the Materials step — the materials money is spent
    const cancelJob = () => {
        if (!canCancelJob(state.stepSubmissions)) return;
        setState((s) => ({ ...s, status: "cancelled" }));
        showBanner("Job has been cancelled");
    };

    // Asks for a later due date — one request at a time, for the lead to decide
    const reportDelay = ({ requestedDueDate, reason }: { requestedDueDate: string; reason: string }) => {
        if (state.extensionRequests.some((request) => request.status === "pending")) return;
        const request: TimelineExtensionRecord = {
            id: `ext-${Date.now()}`,
            previousDueDate: job.dueDate,
            requestedDueDate,
            reason,
            requestedAt: new Date().toISOString(),
            status: "pending",
            decidedAt: null,
            step: getCurrentStep(state.stepSubmissions),
        };
        setState((s) => ({ ...s, extensionRequests: [request, ...s.extensionRequests] }));
        showBanner("Delay reported — waiting for your project lead");
    };

    const purchaseMaterials = () => {
        showBanner("Materials purchased successfully");
    };

    // Proof goes in for the step they're on, or one that was sent back —
    // steps open in order, each once the one before it is approved
    const submitStepProof = (step: ProductionStepKey, imageUrls: string[], note?: string) => {
        const target = getStepProgress(state.stepSubmissions).find((progress) => progress.key === step);
        if (state.status !== "in-progress" || (target?.state !== "current" && target?.state !== "sent-back")) return;
        setState((s) => ({
            ...s,
            stepSubmissions: [
                ...settleJob(s).stepSubmissions,
                { step, imageUrls, ...(note && { note }), submittedAt: new Date().toISOString(), review: null },
            ],
        }));
        showBanner("Proof sent for review");
    };

    const uploadCompletionPhoto = (imageUrls: string[]) => {
        setState((s) => ({
            ...s,
            completionImageUrls: imageUrls,
            status: "in-review",
            submittedForReviewAt: new Date().toISOString(),
        }));
        showBanner("Job marked as done");
    };

    // New photo proof replaces the rejected submission and sends the job
    // back to the admin for review (which also completes the derived
    // "Redeliver" step). Blocked once the job hits MAX_JOB_REJECTIONS.
    const resubmitForReview = (imageUrls: string[]) => {
        if (state.status !== "rejected" || state.rejections.length >= MAX_JOB_REJECTIONS) return;
        setState((s) => ({
            ...s,
            completionImageUrls: imageUrls,
            status: "in-review",
            submittedForReviewAt: new Date().toISOString(),
        }));
        showBanner("Job resubmitted for review");
    };

    return {
        state,
        acceptJob,
        declineJob,
        cancelJob,
        reportDelay,
        purchaseMaterials,
        submitStepProof,
        uploadCompletionPhoto,
        resubmitForReview,
    };
}
