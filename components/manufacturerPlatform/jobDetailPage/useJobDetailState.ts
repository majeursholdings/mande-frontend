"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import type { ProofPhoto } from "@/components/manufacturerPlatform/form/jobDetailCompletionUploadForm";
import {
    MAX_JOB_REJECTIONS,
    settleJob,
    type Job,
    type JobRejection,
    type JobStatus,
} from "@/constant/manufacturer";
import {
    canCancelJob,
    getCurrentStep,
    getStepProgress,
    type ProductionStepKey,
    type StepSubmission,
} from "@/constant/jobWorkflow";
import type { TimelineExtensionRecord } from "@/constant/platformRecords";
import { getErrorMessage } from "@/lib/api";

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

    // Each action below goes to the API first and only changes the page once
    // it has: a job that looks accepted (or a payment that looks paid) when
    // the server said no is worse than a moment's wait.
    const [isResponding, setIsResponding] = useState(false);

    const acceptJob = async () => {
        if (isResponding) return;
        setIsResponding(true);
        try {
            await jobsService.acceptJob(job.id);
            setState((s) => ({ ...s, status: "in-progress", dateAssigned: new Date().toISOString() }));
            showBanner("Job accepted. Your first payment is on its way to your wallet");
            // The first part of the pay is released on accepting: the wallet shows what the server paid
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all }),
            ]);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't accept this job. Please try again."));
        } finally {
            setIsResponding(false);
        }
    };

    const declineJob = async (reason = "Declined by manufacturer") => {
        if (isResponding) return;
        setIsResponding(true);
        try {
            await jobsService.declineJob(job.id, reason);
            setState((s) => ({ ...s, status: "cancelled" }));
            showBanner("Job has been declined");
            await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't decline this job. Please try again."));
        } finally {
            setIsResponding(false);
        }
    };

    // Not once they're past the Materials step — the materials money is spent.
    // Rejects if the server doesn't cancel it (the form shows why).
    const cancelJob = async (reason = "Cancelled by manufacturer") => {
        if (!canCancelJob(state.stepSubmissions)) return;
        await jobsService.cancelJob(job.id, reason);
        setState((s) => ({ ...s, status: "cancelled" }));
        showBanner("Job has been cancelled");
        await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    };

    // Asks for a later due date — one request at a time, for the lead to
    // decide. Rejects if the server doesn't take it (the form shows why).
    const reportDelay = async ({ requestedDueDate, reason }: { requestedDueDate: string; reason: string }) => {
        if (state.extensionRequests.some((request) => request.status === "pending")) return;
        await jobsService.requestExtension(job.id, { requestedDueDate, reason });
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
        showBanner("Delay reported. Waiting for your project lead");
        await queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
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
        isResponding,
        acceptJob,
        declineJob,
        cancelJob,
        reportDelay,
        submitStepProof,
        uploadCompletionPhoto,
        resubmitForReview,
    };
}
