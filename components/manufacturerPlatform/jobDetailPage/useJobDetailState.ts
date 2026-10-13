"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import { mapApiJobToManufacturerJob, type ApiJobPayload } from "@/lib/mappers/jobMappers";
import type { ProofPhoto } from "@/components/manufacturerPlatform/form/jobDetailCompletionUploadForm";
import {
    MAX_JOB_REJECTIONS,
    type Job,
    type JobRejection,
    type JobStatus,
} from "@/constant/manufacturer";
import {
    canCancelJob,
    getStepProgress,
    type ProductionStepKey,
    type StepSubmission,
} from "@/constant/jobWorkflow";
import type { TimelineExtensionRecord } from "@/constant/platformRecords";
import { getErrorMessage } from "@/lib/api";
import type { ManufacturerJobDetailResult } from "./useManufacturerJobDetail";

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

/**
 * The job detail panel's state. Everything about the job comes from the
 * query (`job`, refreshed on every refetch or invalidation); only the
 * short-lived banner is kept here. Each action goes to the API first, puts
 * the job it sends back into the query, then refreshes the lists, the
 * overview and the dashboard: the server decides what the job is now.
 */
export function useJobDetailState(job: Job) {
    const queryClient = useQueryClient();
    const [banner, setBanner] = useState<string | null>(null);
    const bannerTimer = useRef<number | null>(null);

    useEffect(
        () => () => {
            if (bannerTimer.current !== null) window.clearTimeout(bannerTimer.current);
        },
        [],
    );

    const state: JobDetailState = {
        status: job.status,
        dateAssigned: job.dateAssigned,
        stepSubmissions: job.stepSubmissions,
        completionImageUrls: job.completionImageUrls,
        submittedForReviewAt: job.submittedForReviewAt ?? null,
        completedAt: job.completedAt ?? null,
        rejections: job.rejections ?? [],
        extensionRequests: job.extensionRequests,
        banner,
    };
    const maxRejections = job.maxRejections ?? MAX_JOB_REJECTIONS;
    const canCancel = job.canCancel ?? (job.status === "in-progress" && canCancelJob(job.stepSubmissions));

    const showBanner = (message: string) => {
        setBanner(message);
        if (bannerTimer.current !== null) window.clearTimeout(bannerTimer.current);
        bannerTimer.current = window.setTimeout(() => setBanner(null), 3000);
    };

    /** Puts the job the API sent back into the detail query, and returns it mapped. */
    const applyServerJob = (response: unknown): Job | null => {
        const apiJob = (response as { job?: ApiJobPayload } | null)?.job;
        if (!apiJob) return null;
        const updated = mapApiJobToManufacturerJob(apiJob);
        const result: ManufacturerJobDetailResult = { type: "assigned", job: updated };
        // The detail query is keyed by whatever the URL had (the job's id or its code), so update every one holding this job
        queryClient.setQueriesData<ManufacturerJobDetailResult | null>({ queryKey: queryKeys.jobs.details() }, (current) =>
            current?.job?.id === job.id ? result : current,
        );
        return updated;
    };

    /** Everything an action can change: the job (and its lists and overview), the dashboard, and, when money moved, the wallet. */
    const refresh = (options: { wallet?: boolean } = {}) =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
            queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.dashboard() }),
            ...(options.wallet ? [queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all })] : []),
        ]);

    const [isResponding, setIsResponding] = useState(false);

    const acceptJob = async () => {
        if (isResponding) return;
        setIsResponding(true);
        try {
            const updated = applyServerJob(await jobsService.acceptJob(job.id));
            // A shared job starts only once everyone it was offered to has accepted
            if (updated?.status === "pending" && updated.awaitingOthers) {
                showBanner("Job accepted. It starts once the other manufacturer accepts too");
            } else if (updated?.status === "in-progress") {
                showBanner("Job accepted. Your first payment is in your wallet");
            } else {
                showBanner("Job accepted");
            }
            await refresh({ wallet: updated?.status === "in-progress" });
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't accept this job. Please try again."));
        } finally {
            setIsResponding(false);
        }
    };

    // Rejects if the server doesn't take it (the decline form shows why)
    const declineJob = async (reason?: string) => {
        if (isResponding) return;
        setIsResponding(true);
        try {
            applyServerJob(await jobsService.declineJob(job.id, reason));
            showBanner("Job has been declined");
            await refresh();
        } finally {
            setIsResponding(false);
        }
    };

    // Not once they're past the Materials step: the materials money is spent.
    // Rejects if it can't be cancelled, or the server doesn't cancel it (the form shows why).
    const cancelJob = async (reason = "Cancelled by manufacturer") => {
        if (!canCancel) throw new Error("This job can't be cancelled once your Materials proof is in.");
        applyServerJob(await jobsService.cancelJob(job.id, reason));
        showBanner("Job has been cancelled");
        await refresh({ wallet: true });
    };

    // Asks for a later due date: one request at a time, for the lead to
    // decide. Rejects if the server doesn't take it (the form shows why).
    const reportDelay = async ({ requestedDueDate, reason }: { requestedDueDate: string; reason: string }) => {
        if (state.extensionRequests.some((request) => request.status === "pending")) {
            throw new Error("You already have a request for more time waiting.");
        }
        applyServerJob(await jobsService.requestExtension(job.id, { requestedDueDate, reason }));
        showBanner("Delay reported. Waiting for your project lead");
        await refresh();
    };

    // Proof goes in for the step they're on, or one that was sent back. The
    // photo handlers send to the API first; a failure is thrown back to the
    // upload form, which says why and keeps the photos to try again.
    const submitStepProof = async (step: ProductionStepKey, photos: ProofPhoto[], note?: string) => {
        const target = getStepProgress(state.stepSubmissions).find((progress) => progress.key === step);
        if (state.status !== "in-progress" || (target?.state !== "current" && target?.state !== "sent-back")) {
            throw new Error("This step isn't open for proof right now.");
        }
        applyServerJob(await jobsService.submitStepProof(job.id, step, { photos: photos.map((photo) => photo.publicId), note }));
        showBanner("Proof sent for review");
        void refresh();
    };

    const uploadCompletionPhoto = async (photos: ProofPhoto[]) => {
        applyServerJob(await jobsService.submitFinishedWork(job.id, photos.map((photo) => photo.publicId)));
        showBanner("Job marked as done");
        void refresh();
    };

    // New photo proof replaces the rejected submission and sends the job
    // back for review. Blocked once the job hits its rejection limit.
    const resubmitForReview = async (photos: ProofPhoto[]) => {
        if (state.status !== "rejected" || state.rejections.length >= maxRejections) {
            throw new Error("This job can no longer be resubmitted.");
        }
        applyServerJob(await jobsService.submitFinishedWork(job.id, photos.map((photo) => photo.publicId)));
        showBanner("Job resubmitted for review");
        void refresh();
    };

    // A note on the job's thread, for its project lead to see. Rejects if the
    // server doesn't take it (the note form says why and keeps the text).
    const addNote = async (message: string) => {
        applyServerJob(await jobsService.addManufacturerNote(job.id, message));
        void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    };

    return {
        state,
        maxRejections,
        canCancel,
        isResponding,
        acceptJob,
        declineJob,
        cancelJob,
        reportDelay,
        submitStepProof,
        uploadCompletionPhoto,
        resubmitForReview,
        addNote,
    };
}
