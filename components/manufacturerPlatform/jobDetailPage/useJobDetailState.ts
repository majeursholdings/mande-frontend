"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import type { ProofPhoto } from "@/components/manufacturerPlatform/form/jobDetailCompletionUploadForm";
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

export function useJobDetailState(job: Job) {
    const queryClient = useQueryClient();
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

    const acceptJob = async () => {
        const acceptedAt = new Date().toISOString();
        setState((s) => ({ ...s, status: "in-progress", dateAssigned: acceptedAt }));
        // The first part of the pay is released the moment they say yes
        const [firstPayment] = getJobPayments(getJobPaymentInput({ ...job, dateAssigned: acceptedAt })).payments;
        if (firstPayment) {
            receivePayment({
                id: getPayoutId(job.id, firstPayment.milestone, SIGNED_IN_MANUFACTURER_ID),
                amount: firstPayment.amount,
                label: firstPayment.label,
                projectName: job.title,
            });
        }
        showBanner("Job accepted — your first payment is in your wallet");
        try {
            await jobsService.acceptJob(job.id);
            queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
        } catch (err) {
            console.error("Failed to accept job on server:", err);
        }
    };

    const declineJob = async (reason = "Declined by manufacturer") => {
        setState((s) => ({ ...s, status: "cancelled" }));
        showBanner("Job has been declined");
        try {
            await jobsService.declineJob(job.id, reason);
            queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
        } catch (err) {
            console.error("Failed to decline job on server:", err);
        }
    };

    // Not once they're past the Materials step — the materials money is spent
    const cancelJob = async (reason = "Cancelled by manufacturer") => {
        if (!canCancelJob(state.stepSubmissions)) return;
        setState((s) => ({ ...s, status: "cancelled" }));
        showBanner("Job has been cancelled");
        try {
            await jobsService.cancelJob(job.id, reason);
            queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
        } catch (err) {
            console.error("Failed to cancel job on server:", err);
        }
    };

    // Asks for a later due date — one request at a time, for the lead to decide
    const reportDelay = async ({ requestedDueDate, reason }: { requestedDueDate: string; reason: string }) => {
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
        try {
            await jobsService.requestExtension(job.id, { requestedDueDate, reason });
            queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
        } catch (err) {
            console.error("Failed to report delay on server:", err);
        }
    };

    const purchaseMaterials = () => {
        showBanner("Materials purchased successfully");
    };

    // Proof goes in for the step they're on, or one that was sent back —
    // steps open in order, each once the one before it is approved
    // The photo handlers below send to the API first and only then show the
    // change; a failure is thrown back to the upload form, which says why
    // and keeps the photos to try again.
    const submitStepProof = async (step: ProductionStepKey, photos: ProofPhoto[], note?: string) => {
        const target = getStepProgress(state.stepSubmissions).find((progress) => progress.key === step);
        if (state.status !== "in-progress" || (target?.state !== "current" && target?.state !== "sent-back")) return;
        await jobsService.submitStepProof(job.id, step, { photos: photos.map((photo) => photo.publicId), note });
        const imageUrls = photos.map((photo) => photo.url);
        setState((s) => ({
            ...s,
            stepSubmissions: [
                ...settleJob(s).stepSubmissions,
                { step, imageUrls, ...(note && { note }), submittedAt: new Date().toISOString(), review: null },
            ],
        }));
        showBanner("Proof sent for review");
        void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    };

    const uploadCompletionPhoto = async (photos: ProofPhoto[]) => {
        await jobsService.submitFinishedWork(job.id, photos.map((photo) => photo.publicId));
        setState((s) => ({
            ...s,
            completionImageUrls: photos.map((photo) => photo.url),
            status: "in-review",
            submittedForReviewAt: new Date().toISOString(),
        }));
        showBanner("Job marked as done");
        void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    };

    // New photo proof replaces the rejected submission and sends the job
    // back to the admin for review (which also completes the derived
    // "Redeliver" step). Blocked once the job hits MAX_JOB_REJECTIONS.
    const resubmitForReview = async (photos: ProofPhoto[]) => {
        if (state.status !== "rejected" || state.rejections.length >= MAX_JOB_REJECTIONS) return;
        await jobsService.submitFinishedWork(job.id, photos.map((photo) => photo.publicId));
        setState((s) => ({
            ...s,
            completionImageUrls: photos.map((photo) => photo.url),
            status: "in-review",
            submittedForReviewAt: new Date().toISOString(),
        }));
        showBanner("Job resubmitted for review");
        void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
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
