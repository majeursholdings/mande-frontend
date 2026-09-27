"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
    ADMIN_JOBS,
    ADMIN_ME_ID,
    ADMIN_PROFILE,
    MAX_ADMIN_JOB_REJECTIONS,
    getSampleCategoryPhoto,
    settleAdminJob,
    type AdminJob,
    type AdminJobAttachment,
    type AdminJobNote,
    type AdminManufacturerReview,
} from "@/constant/admin";
import { canReportFault, type ProductionStepKey, type StepReview } from "@/constant/jobWorkflow";

// ─────────────────────────────────────────────────────────────────────────────
// AdminJobsProvider — every job, shared across the admin dashboard so a job
// created, edited, reviewed or reassigned (or a note left on one) stays put
// while the admin moves between pages. Anything left unreviewed past its
// deadline reads as approved automatically (see settleAdminJob). Seeded from
// sample data and kept in memory for now; once the backend is connected,
// load jobs from the API (which does the auto-approving) and send each
// change there.
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
    /** Approves the proof waiting for review on `step` — the next step opens and its payment is released. */
    approveStep: (id: string, step: ProductionStepKey) => void;
    /** Sends the proof waiting for review on `step` back, with why — the manufacturer sends new proof. */
    sendBackStep: (id: string, step: ProductionStepKey, reason: string) => void;
    /** Gives a pending job to the manufacturer who applied, and turns the other applications down. */
    acceptApplication: (id: string, applicationId: string) => void;
    declineApplication: (id: string, applicationId: string) => void;
    /** A fault in completed work, within FAULT_REPORT_DAYS of sign-off — it cancels the bonus. */
    reportFault: (id: string, reason: string) => void;
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
    const [storedJobs, setJobs] = useState(ADMIN_JOBS);
    const jobs = storedJobs.map((job) => settleAdminJob(job));

    const patchJob = (id: string, patch: (job: AdminJob) => AdminJob) =>
        setJobs((current) => current.map((job) => (job.id === id ? patch(job) : job)));

    /** Reviews the proof waiting on `step` — its latest submission, if no one has yet. */
    const reviewStep = (id: string, step: ProductionStepKey, review: StepReview) =>
        patchJob(id, (job) => {
            const index = job.stepSubmissions.findLastIndex((submission) => submission.step === step);
            if (index === -1 || job.stepSubmissions[index].review) return job;
            return {
                ...job,
                stepSubmissions: job.stepSubmissions.map((submission, position) =>
                    position === index ? { ...submission, review } : submission,
                ),
            };
        });

    const decideApplication = (id: string, applicationId: string, decision: "accepted" | "declined") =>
        patchJob(id, (job) => {
            const application = job.applications.find((candidate) => candidate.id === applicationId);
            if (job.status !== "pending" || application?.status !== "pending") return job;
            const now = new Date().toISOString();
            if (decision === "declined") {
                return {
                    ...job,
                    applications: job.applications.map((candidate) =>
                        candidate.id === applicationId ? { ...candidate, status: "declined", decidedAt: now } : candidate,
                    ),
                };
            }
            // They asked for it, so it's theirs straight away — any open offer is withdrawn
            return {
                ...job,
                status: "in-progress",
                manufacturerIds: [application.manufacturerId],
                dateAssigned: now,
                assignmentHistory: [
                    {
                        id: `asg-${Date.now()}`,
                        manufacturerIds: [application.manufacturerId],
                        assignedBy: MY_NAME,
                        assignedAt: now,
                        outcome: "accepted",
                        outcomeAt: now,
                    },
                    ...job.assignmentHistory.map((assignment) =>
                        assignment.outcome === "awaiting"
                            ? { ...assignment, outcome: "reassigned" as const, outcomeAt: now }
                            : assignment,
                    ),
                ],
                applications: job.applications.map((candidate) =>
                    candidate.id === applicationId
                        ? { ...candidate, status: "accepted", decidedAt: now }
                        : candidate.status === "pending"
                          ? { ...candidate, status: "declined", decidedAt: now }
                          : candidate,
                ),
            };
        });

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
            // No photo upload yet — a stand-in for its category
            imageUrl: getSampleCategoryPhoto(draft.category),
            notes: [],
            createdAt: now,
            stepSubmissions: [],
            completionImageUrls: [],
            submittedForReviewAt: null,
            rejections: [],
            extensionRequests: [],
            assignmentHistory: [],
            manufacturerReview: null,
            completedAt: null,
            completedBy: null,
            faultReport: null,
            applications: [],
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
        approveJob: (id) =>
            patchJob(id, (job) =>
                job.status === "in-review"
                    ? { ...job, status: "completed", completedAt: new Date().toISOString(), completedBy: MY_NAME }
                    : job,
            ),
        approveStep: (id, step) =>
            reviewStep(id, step, { outcome: "approved", at: new Date().toISOString(), by: MY_NAME }),
        sendBackStep: (id, step, reason) =>
            reviewStep(id, step, { outcome: "sent-back", at: new Date().toISOString(), by: MY_NAME, reason }),
        acceptApplication: (id, applicationId) => decideApplication(id, applicationId, "accepted"),
        declineApplication: (id, applicationId) => decideApplication(id, applicationId, "declined"),
        reportFault: (id, reason) =>
            patchJob(id, (job) => {
                // The stored job may not show an auto sign-off yet, so check the settled one
                const settled = settleAdminJob(job);
                const check = { signedOffAt: settled.completedAt, faultReport: settled.faultReport };
                if (!canReportFault(check)) return job;
                return {
                    ...settled,
                    faultReport: { reason, reportedAt: new Date().toISOString(), reportedBy: MY_NAME },
                };
            }),
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
