"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
    ADMIN_JOBS,
    MAX_ADMIN_JOB_REJECTIONS,
    getSampleCategoryPhoto,
    isRejectionFinal,
    settleAdminJob,
    type AdminJob,
    type AdminJobAttachment,
    type AdminJobNote,
    type AdminManufacturerReview,
} from "@/constant/admin";
import { MIN_SIGN_OFF_RATING, canReportFault, type ProductionStepKey, type StepReview } from "@/constant/jobWorkflow";
import { getJobRecordPayouts } from "@/constant/sampleDb";
import { useAdminProfile } from "./adminProfileContext";
import { useStaffPlatform } from "./staffPlatformContext";

// ─────────────────────────────────────────────────────────────────────────────
// AdminJobsProvider — every job, shared across the admin (or super admin)
// dashboard so a job created, edited, reviewed, reassigned or deleted (or a
// note left on one) stays put while they move between pages. What they do is
// recorded under their name. Anything left unreviewed past its
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
> & {
    /**
     * Who leads it. Left out, it's whoever creates it; a super admin (who
     * doesn't lead jobs) always picks an admin.
     */
    projectLeadIds?: string[];
};

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
    /**
     * Signs off work that's in review, with the lead's rating of the
     * manufacturer — or, rated under MIN_SIGN_OFF_RATING, holds it for a super
     * admin to review further instead.
     */
    completeJob: (id: string, review: Pick<AdminManufacturerReview, "rating" | "comment">) => void;
    /** Super admins: signs off work held for further review, keeping the lead's rating. */
    signOffHeldJob: (id: string) => void;
    /** Approves the proof waiting for review on `step` — the next step opens and its payment is released. */
    approveStep: (id: string, step: ProductionStepKey) => void;
    /** Sends the proof waiting for review on `step` back, with why — the manufacturer sends new proof. */
    sendBackStep: (id: string, step: ProductionStepKey, reason: string) => void;
    /** Gives a pending job to the manufacturer who applied, and turns the other applications down. */
    acceptApplication: (id: string, applicationId: string) => void;
    declineApplication: (id: string, applicationId: string) => void;
    /** A fault in completed work, within FAULT_REPORT_DAYS of sign-off — it cancels the bonus. */
    reportFault: (id: string, reason: string) => void;
    /** Sends work that's in review back, with the lead's review — held work too. */
    rejectJob: (id: string, review: { reason: string; attachments: AdminJobAttachment[] }) => void;
    /** Approving moves the due date to the requested one. */
    decideExtension: (id: string, extensionId: string, decision: "approved" | "rejected") => void;
    rateManufacturer: (id: string, review: Pick<AdminManufacturerReview, "rating" | "comment">) => void;
    addNote: (id: string, note: Omit<AdminJobNote, "id" | "createdAt">) => void;
    /** Super admins only, and only while getJobDeleteBlocker allows it. */
    deleteJob: (id: string) => void;
    /** Super admins: records how they followed up a manufacturer's low rating of the lead. */
    followUpLeadReview: (id: string, manufacturerId: string, note: string) => void;
    /**
     * For a manufacturer whose account is being deleted: their pending
     * applications are withdrawn, and they're taken off every job that isn't
     * finished — a job they shared carries on with the other manufacturer,
     * and one that was theirs alone goes back to pending, from the start,
     * for its lead to offer to someone else.
     */
    releaseManufacturer: (manufacturerId: string) => void;
};

/** Offered to them, or being worked on — anything not finished. */
export function isJobUnderwayFor(job: AdminJob, manufacturerId: string): boolean {
    return job.manufacturerIds.includes(manufacturerId) && job.status !== "completed" && !isRejectionFinal(job);
}

/** `job` with `manufacturerId` taken off it — see releaseManufacturer. */
function withoutManufacturer(job: AdminJob, manufacturerId: string, now: string): AdminJob {
    const applications = job.applications.filter(
        (application) => !(application.manufacturerId === manufacturerId && application.status === "pending"),
    );
    if (!isJobUnderwayFor(job, manufacturerId)) return { ...job, applications };

    const others = job.manufacturerIds.filter((id) => id !== manufacturerId);
    if (others.length > 0) return { ...job, applications, manufacturerIds: others };
    return {
        ...job,
        applications,
        manufacturerIds: [],
        status: "pending",
        dateAssigned: null,
        stepSubmissions: [],
        completionImageUrls: [],
        submittedForReviewAt: null,
        rejections: [],
        extensionRequests: [],
        furtherReview: null,
        // Their offer, or the job they'd taken on, ends here
        assignmentHistory: job.assignmentHistory.map((assignment) =>
            assignment.manufacturerIds.includes(manufacturerId) &&
            (assignment.outcome === "awaiting" || assignment.outcome === "accepted")
                ? { ...assignment, outcome: "reassigned" as const, outcomeAt: now }
                : assignment,
        ),
    };
}

/**
 * Why a job can't be deleted — once a manufacturer has been paid for it, it
 * stays for the records (their wallet and the transactions read from it).
 * Null when it can.
 */
export function getJobDeleteBlocker(job: AdminJob): string | null {
    return getJobRecordPayouts(job).length > 0 ? "A manufacturer has been paid for it" : null;
}

const AdminJobsContext = createContext<AdminJobsContextValue | null>(null);

const sameIds = (a: string[], b: string[]) =>
    a.length === b.length && a.every((id) => b.includes(id));

/** The job offered to `manufacturerIds` instead, by `by` — the open offer (if any) marked reassigned. */
function withAssignment(job: AdminJob, manufacturerIds: string[], now: string, by: string): AdminJob {
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
                          assignedBy: by,
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
    const { fullName: myName } = useAdminProfile();
    const { leadId } = useStaffPlatform();
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
                        assignedBy: myName,
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
            projectLeadIds: draft.projectLeadIds ?? (leadId ? [leadId] : []),
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
            furtherReview: null,
            leadReviews: [],
            completedAt: null,
            completedBy: null,
            faultReport: null,
            applications: [],
        };
        const job = withAssignment(blank, draft.manufacturerIds, now, myName);
        setJobs((current) => [job, ...current]);
        return job;
    };

    const value: AdminJobsContextValue = {
        jobs,
        getJob: (id) => jobs.find((job) => job.id === id),
        createJob,
        updateJob: (id, draft) =>
            patchJob(id, (job) => {
                const updated = {
                    ...job,
                    ...draft,
                    manufacturerIds: job.manufacturerIds,
                    projectLeadIds: draft.projectLeadIds ?? job.projectLeadIds,
                };
                return sameIds(job.manufacturerIds, draft.manufacturerIds)
                    ? updated
                    : withAssignment(updated, draft.manufacturerIds, new Date().toISOString(), myName);
            }),
        reassignJob: (id, manufacturerIds) =>
            patchJob(id, (job) => withAssignment(job, manufacturerIds, new Date().toISOString(), myName)),
        completeJob: (id, review) =>
            patchJob(id, (job) => {
                if (job.status !== "in-review" || job.furtherReview) return job;
                const now = new Date().toISOString();
                const rated = { ...review, authorName: myName, createdAt: now };
                return review.rating >= MIN_SIGN_OFF_RATING
                    ? { ...job, status: "completed", completedAt: now, completedBy: myName, manufacturerReview: rated }
                    : { ...job, furtherReview: rated };
            }),
        signOffHeldJob: (id) =>
            patchJob(id, (job) =>
                job.status === "in-review" && job.furtherReview
                    ? {
                          ...job,
                          status: "completed",
                          completedAt: new Date().toISOString(),
                          completedBy: myName,
                          manufacturerReview: job.furtherReview,
                          furtherReview: null,
                      }
                    : job,
            ),
        approveStep: (id, step) =>
            reviewStep(id, step, { outcome: "approved", at: new Date().toISOString(), by: myName }),
        sendBackStep: (id, step, reason) =>
            reviewStep(id, step, { outcome: "sent-back", at: new Date().toISOString(), by: myName, reason }),
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
                    faultReport: { reason, reportedAt: new Date().toISOString(), reportedBy: myName },
                };
            }),
        rejectJob: (id, review) =>
            patchJob(id, (job) =>
                job.rejections.length >= MAX_ADMIN_JOB_REJECTIONS
                    ? job
                    : {
                          ...job,
                          status: "rejected",
                          furtherReview: null,
                          rejections: [
                              ...job.rejections,
                              {
                                  id: `rej-${Date.now()}`,
                                  reason: review.reason,
                                  attachments: review.attachments,
                                  rejectedBy: myName,
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
                manufacturerReview: { ...review, authorName: myName, createdAt: new Date().toISOString() },
            })),
        addNote: (id, note) =>
            patchJob(id, (job) => ({
                ...job,
                notes: [{ ...note, id: `note-${Date.now()}`, createdAt: new Date().toISOString() }, ...job.notes],
            })),
        followUpLeadReview: (id, manufacturerId, note) =>
            patchJob(id, (job) => ({
                ...job,
                leadReviews: job.leadReviews.map((review) =>
                    review.manufacturerId === manufacturerId
                        ? { ...review, followUp: { note, by: myName, at: new Date().toISOString() } }
                        : review,
                ),
            })),
        releaseManufacturer: (manufacturerId) => {
            const now = new Date().toISOString();
            setJobs((current) => current.map((job) => withoutManufacturer(settleAdminJob(job), manufacturerId, now)));
        },
        deleteJob: (id) =>
            setJobs((current) =>
                current.filter((job) => job.id !== id || getJobDeleteBlocker(settleAdminJob(job)) !== null),
            ),
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
