"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
    ADMIN_JOBS,
    ADMIN_ME_ID,
    ADMIN_PROFILE,
    MAX_ADMIN_JOB_REJECTIONS,
    type AdminJob,
    type AdminJobAttachment,
    type AdminJobNote,
    type AdminManufacturerReview,
} from "@/constant/admin";

// ─────────────────────────────────────────────────────────────────────────────
// AdminJobsProvider — every job, shared across the admin dashboard so a job
// created, edited, reviewed or reassigned (or a note left on one) stays put
// while the admin moves between pages. Seeded from sample data and kept in
// memory for now; once the backend is connected, load jobs from the API and
// send each change there.
// ─────────────────────────────────────────────────────────────────────────────

/** What the create/edit job form fills in — the rest is set by the platform. */
export type AdminJobDraft = Pick<
    AdminJob,
    | "title"
    | "category"
    | "manufacturerIds"
    | "amount"
    | "startDate"
    | "dueDate"
    | "description"
    | "attachments"
>;

type AdminJobsContextValue = {
    jobs: AdminJob[];
    getJob: (id: string) => AdminJob | undefined;
    /**
     * Adds a pending job at the top of the list, led by whoever created it,
     * and returns it. `code` comes from the form (see generateJobCode).
     */
    createJob: (draft: AdminJobDraft, code: string) => AdminJob;
    /** Pending jobs only. Changing the manufacturers counts as reassigning. */
    updateJob: (id: string, draft: AdminJobDraft) => void;
    /** Offers a pending job to other manufacturer(s), keeping the history. */
    reassignJob: (id: string, manufacturerIds: string[]) => void;
    /** Signs off work that's in review. */
    approveJob: (id: string) => void;
    /** Sends work that's in review back, with the lead's review. */
    rejectJob: (id: string, review: { reason: string; attachments: AdminJobAttachment[] }) => void;
    /** Approving moves the due date to the requested one. */
    decideExtension: (id: string, extensionId: string, decision: "approved" | "rejected") => void;
    rateManufacturer: (id: string, review: Pick<AdminManufacturerReview, "rating" | "comment">) => void;
    addNote: (id: string, note: Omit<AdminJobNote, "id" | "createdAt">) => void;
};

const AdminJobsContext = createContext<AdminJobsContextValue | null>(null);

const MY_NAME = `${ADMIN_PROFILE.firstName} ${ADMIN_PROFILE.lastName}`;

const sameIds = (a: string[], b: string[]) =>
    a.length === b.length && a.every((id) => b.includes(id));

/** The job offered to `manufacturerIds` instead — the open offer (if any) marked reassigned. */
function withAssignment(job: AdminJob, manufacturerIds: string[], now: string): AdminJob {
    const history = job.assignmentHistory.map((assignment) =>
        assignment.outcome === "awaiting" ? { ...assignment, outcome: "reassigned" as const, outcomeAt: now } : assignment,
    );
    return {
        ...job,
        manufacturerIds,
        assignmentHistory:
            manufacturerIds.length > 0
                ? [
                      {
                          id: `asg-${Date.now()}`,
                          manufacturerIds,
                          assignedBy: MY_NAME,
                          assignedAt: now,
                          outcome: "awaiting",
                          outcomeAt: null,
                      },
                      ...history,
                  ]
                : history,
    };
}

export function AdminJobsProvider({ children }: { children: ReactNode }) {
    const [jobs, setJobs] = useState(ADMIN_JOBS);

    const patchJob = (id: string, patch: (job: AdminJob) => AdminJob) =>
        setJobs((current) => current.map((job) => (job.id === id ? patch(job) : job)));

    const createJob = (draft: AdminJobDraft, code: string): AdminJob => {
        const now = new Date().toISOString();
        const blank: AdminJob = {
            ...draft,
            manufacturerIds: [],
            id: `job-${Date.now()}`,
            code,
            projectLeadIds: [ADMIN_ME_ID],
            status: "pending",
            dateAssigned: null,
            notes: [],
            createdAt: now,
            completedStepKeys: [],
            completionImageUrls: [],
            submittedForReviewAt: null,
            rejections: [],
            extensionRequests: [],
            assignmentHistory: [],
            manufacturerReview: null,
        };
        const job = withAssignment(blank, draft.manufacturerIds, now);
        setJobs((current) => [job, ...current]);
        return job;
    };

    const value: AdminJobsContextValue = {
        jobs,
        getJob: (id) => jobs.find((job) => job.id === id),
        createJob,
        updateJob: (id, draft) =>
            patchJob(id, (job) => {
                const updated = { ...job, ...draft, manufacturerIds: job.manufacturerIds };
                return sameIds(job.manufacturerIds, draft.manufacturerIds)
                    ? updated
                    : withAssignment(updated, draft.manufacturerIds, new Date().toISOString());
            }),
        reassignJob: (id, manufacturerIds) =>
            patchJob(id, (job) => withAssignment(job, manufacturerIds, new Date().toISOString())),
        approveJob: (id) => patchJob(id, (job) => ({ ...job, status: "completed" })),
        rejectJob: (id, review) =>
            patchJob(id, (job) =>
                job.rejections.length >= MAX_ADMIN_JOB_REJECTIONS
                    ? job
                    : {
                          ...job,
                          status: "rejected",
                          rejections: [
                              ...job.rejections,
                              {
                                  id: `rej-${Date.now()}`,
                                  reason: review.reason,
                                  attachments: review.attachments,
                                  rejectedBy: MY_NAME,
                                  rejectedAt: new Date().toISOString(),
                                  submissionImageUrls: job.completionImageUrls,
                              },
                          ],
                      },
            ),
        decideExtension: (id, extensionId, decision) =>
            patchJob(id, (job) => {
                const request = job.extensionRequests.find((extension) => extension.id === extensionId);
                if (!request || request.status !== "pending") return job;
                return {
                    ...job,
                    dueDate: decision === "approved" ? request.requestedDueDate : job.dueDate,
                    extensionRequests: job.extensionRequests.map((extension) =>
                        extension.id === extensionId
                            ? { ...extension, status: decision, decidedAt: new Date().toISOString() }
                            : extension,
                    ),
                };
            }),
        rateManufacturer: (id, review) =>
            patchJob(id, (job) => ({
                ...job,
                manufacturerReview: { ...review, authorName: MY_NAME, createdAt: new Date().toISOString() },
            })),
        addNote: (id, note) =>
            patchJob(id, (job) => ({
                ...job,
                notes: [{ ...note, id: `note-${Date.now()}`, createdAt: new Date().toISOString() }, ...job.notes],
            })),
    };

    return <AdminJobsContext.Provider value={value}>{children}</AdminJobsContext.Provider>;
}

export function useAdminJobs() {
    const context = useContext(AdminJobsContext);
    if (!context) {
        throw new Error("useAdminJobs must be used within an AdminJobsProvider");
    }
    return context;
}
