"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService, type CreateJobPayload, type UpdateJobPayload } from "@/lib/services/jobsService";
import {
    MAX_ADMIN_JOB_REJECTIONS,
    isRejectionFinal,
    settleAdminJob,
    registerProjectLeads,
    registerManufacturers,
    type AdminJob,
    type AdminJobAttachment,
    type AdminJobNote,
    type AdminManufacturerReview,
} from "@/constant/admin";
import { MIN_SIGN_OFF_RATING, canReportFault, type ProductionStepKey, type StepReview } from "@/constant/jobWorkflow";
import { getJobRecordPayouts } from "@/constant/platformRecords";
import { useAdminProfile } from "./adminProfileContext";
import { useStaffPlatform } from "./staffPlatformContext";
import { DEFAULT_IMAGE } from "@/constant/global";
import { fetchAllPages } from "@/lib/pagination";

// ─────────────────────────────────────────────────────────────────────────────
// AdminJobsProvider — every job, shared across the admin (or super admin)
// dashboard so a job created, edited, reviewed, reassigned or deleted (or a
// note left on one) stays put while they move between pages. What they do is
// recorded under their name. Anything left unreviewed past its
// deadline reads as approved automatically (see settleAdminJob). Loaded from
// the API (which does the auto-approving); each change is sent there.
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
    | "deliveryLocation"
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
    /** True while the first load of the jobs is in flight (show skeletons). */
    isLoading: boolean;
    /** True when the jobs couldn't be loaded (show an inline error, not an empty state). */
    isError: boolean;
    getJob: (idOrCode: string) => AdminJob | undefined;
    /**
     * Adds a pending job at the top of the list, led by whoever created it,
     * and returns it. `code` comes from the form (see generateJobCode).
     */
    createJob: (draft: AdminJobDraft, code: string) => Promise<AdminJob>;
    /** Pending jobs only. Changing the manufacturers counts as reassigning. */
    updateJob: (id: string, draft: AdminJobDraft) => Promise<void>;
    /** Offers a pending job to other manufacturer(s), keeping the history. */
    reassignJob: (id: string, manufacturerIds: string[]) => Promise<void>;
    /**
     * Signs off work that's in review, with the lead's rating of the
     * manufacturer — or, rated under MIN_SIGN_OFF_RATING, holds it for a super
     * admin to review further instead.
     */
    completeJob: (id: string, review: Pick<AdminManufacturerReview, "rating" | "comment"> & { clientProofs?: AdminJobAttachment[] }) => Promise<void>;
    /** Super admins: signs off work held for further review, keeping the lead's rating. */
    signOffHeldJob: (id: string) => Promise<void>;
    /** Approves the proof waiting for review on `step` — the next step opens and its payment is released. */
    approveStep: (id: string, step: ProductionStepKey) => Promise<void>;
    /** Sends the proof waiting for review on `step` back, with why — the manufacturer sends new proof. */
    sendBackStep: (id: string, step: ProductionStepKey, reason: string) => Promise<void>;
    /** Gives a pending job to the manufacturer who applied, and turns the other applications down. */
    acceptApplication: (id: string, applicationId: string) => Promise<void>;
    declineApplication: (id: string, applicationId: string) => Promise<void>;
    /** A fault in completed work, within FAULT_REPORT_DAYS of sign-off — it cancels the bonus. */
    reportFault: (id: string, reason: string) => Promise<void>;
    /** Sends work that's in review back, with the lead's review — held work too. */
    rejectJob: (id: string, review: { reason: string; attachments: AdminJobAttachment[] }) => Promise<void>;
    /** Approving moves the due date to the requested one. */
    decideExtension: (id: string, extensionId: string, decision: "approved" | "rejected") => Promise<void>;
    rateManufacturer: (id: string, review: Pick<AdminManufacturerReview, "rating" | "comment">) => Promise<void>;
    addNote: (id: string, note: Omit<AdminJobNote, "id" | "createdAt">) => Promise<void>;
    /** Super admins only, and only while getJobDeleteBlocker allows it. */
    deleteJob: (id: string) => Promise<void>;
    /** Super admins: records how they followed up a manufacturer's low rating of the lead. */
    followUpLeadReview: (id: string, manufacturerId: string, note: string) => Promise<void>;
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

/**
 * A cover photo just uploaded for the job. The API files it under the
 * "job-image" purpose and will only claim it as the job's image from there,
 * so a file is the cover by where it was uploaded, not by what it looks like.
 */
const isCoverUpload = (a: { publicId?: string }) => Boolean(a.publicId?.includes("/job-image/"));

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

type ServerStaffJob = {
    id: string;
    code: string;
    title: string;
    category: string;
    status: AdminJob["status"];
    amountKobo: number;
    manufacturers?: { id: string; name: string; companyName: string | null }[];
    projectLeads?: { id: string; name: string; phone: string | null }[];
    startDate?: string | null;
    dueDate: string;
    dateAssigned?: string | null;
    description?: string;
    image?: { url: string | null; name: string | null; kind: "image" | "document"; publicId?: string } | null;
    attachments?: { url: string | null; name: string | null; kind: "image" | "document"; publicId?: string }[];
    /** The client's proof of delivery, sent with the sign-off. */
    deliveryProofAttachments?: { url: string | null; name: string | null; kind: "image" | "document"; publicId?: string }[];
    notes?: { id: string; authorName: string; authorRole: string; message: string; createdAt: string }[];
    createdAt: string;
    currentStep?: ProductionStepKey;
    stepSubmissions?: {
        id: string;
        step: ProductionStepKey;
        photos: (string | null)[];
        note: string | null;
        submittedAt: string;
        review: { outcome: "approved" | "sent-back"; at: string; byName: string | null; reason: string | null } | null;
    }[];
    completionPhotos?: (string | null)[];
    submittedForReviewAt?: string | null;
    rejections?: {
        id: string;
        reason: string;
        attachments?: { url: string | null; name: string | null; kind: "image" | "document" }[];
        rejectedByName: string;
        rejectedAt: string;
        submissionPhotos?: (string | null)[];
    }[];
    extensionRequests?: {
        id: string;
        previousDueDate: string;
        requestedDueDate: string;
        reason: string;
        requestedAt: string;
        status: "pending" | "approved" | "rejected";
        decidedAt: string | null;
        step: ProductionStepKey | null;
    }[];
    assignmentHistory?: {
        id: string;
        manufacturers?: { id: string; name: string; companyName: string | null }[];
        assignedByName: string;
        assignedAt: string;
        outcome: "awaiting" | "accepted" | "declined" | "reassigned";
        outcomeAt: string | null;
    }[];
    manufacturerReview?: { rating: number; comment: string; authorName: string; createdAt: string } | null;
    furtherReview?: { rating: number; comment: string; authorName: string; createdAt: string } | null;
    leadReviews?: {
        manufacturer?: { id: string; name: string; companyName: string | null };
        leadId: string;
        rating: number;
        comment: string;
        createdAt: string;
        followUp?: { note: string; byName: string; at: string } | null;
    }[];
    completedAt?: string | null;
    completedBy?: string | null;
    faultReport?: { reason: string; reportedAt: string } | null;
    deliveryLocation?: {
        street?: string;
        city: string;
        state: string;
        country?: string;
    } | null;
    applications?: {
        id: string;
        manufacturer?: { id: string; name: string; companyName: string | null };
        appliedAt: string;
        status: "pending" | "accepted" | "declined";
        decidedAt: string | null;
    }[];
};

function transformStaffJobToAdminJob(serverJob: ServerStaffJob): AdminJob {
    const category = serverJob.category ?? "wood";
    const fallbackPhoto = DEFAULT_IMAGE;
    const attachedImage = (serverJob.attachments ?? []).find((a) => {
        if (!a?.url) return false;
        if (a.kind === "image") return true;
        const url = a.url.toLowerCase();
        const name = (a.name ?? "").toLowerCase();
        return (
            url.includes(".png") ||
            url.includes(".jpg") ||
            url.includes(".jpeg") ||
            url.includes(".webp") ||
            url.includes(".svg") ||
            name.endsWith(".png") ||
            name.endsWith(".jpg") ||
            name.endsWith(".jpeg") ||
            name.endsWith(".webp") ||
            name.endsWith(".svg")
        );
    });
    const imageUrl = serverJob.image?.url || attachedImage?.url || fallbackPhoto;

    if (serverJob.manufacturers && serverJob.manufacturers.length > 0) {
        registerManufacturers(serverJob.manufacturers);
    }
    if (serverJob.assignmentHistory) {
        for (const asg of serverJob.assignmentHistory) {
            if (asg.manufacturers && asg.manufacturers.length > 0) {
                registerManufacturers(asg.manufacturers);
            }
        }
    }
    if (serverJob.applications) {
        for (const app of serverJob.applications) {
            if (app.manufacturer) {
                registerManufacturers([app.manufacturer]);
            }
        }
    }

    return {
        id: serverJob.id,
        code: serverJob.code,
        title: serverJob.title,
        category,
        manufacturerIds: (serverJob.manufacturers ?? []).map((m) => m.id),
        manufacturers: serverJob.manufacturers,
        amount: Math.round((serverJob.amountKobo ?? 0) / 100),
        projectLeadIds: (serverJob.projectLeads ?? []).map((l) => l.id),
        startDate: serverJob.startDate ? new Date(serverJob.startDate).toISOString() : null,
        dueDate: serverJob.dueDate ? new Date(serverJob.dueDate).toISOString() : new Date().toISOString(),
        dateAssigned: serverJob.dateAssigned ? new Date(serverJob.dateAssigned).toISOString() : null,
        status: serverJob.status,
        description: serverJob.description ?? "",
        deliveryLocation: serverJob.deliveryLocation
            ? {
                  street: serverJob.deliveryLocation.street || "",
                  city: serverJob.deliveryLocation.city,
                  state: serverJob.deliveryLocation.state,
                  country: serverJob.deliveryLocation.country || "NG",
              }
            : null,
        imageUrl,
        // Only a real cover: with none, the API shows the first image attachment in its place
        imagePublicId: serverJob.image?.publicId && isCoverUpload(serverJob.image) ? serverJob.image.publicId : undefined,
        // A file without a link (its signed link couldn't be made) is left out, never linked to a stand-in
        attachments: (serverJob.attachments ?? []).flatMap((att) =>
            att.url
                ? [{ name: att.name ?? "Attachment", url: att.url, kind: att.kind ?? (att.name?.endsWith(".pdf") ? "document" : "image"), publicId: att.publicId }]
                : [],
        ),
        deliveryProofAttachments: (serverJob.deliveryProofAttachments ?? []).flatMap((att) =>
            att.url
                ? [{ name: att.name ?? "Delivery proof", url: att.url, kind: att.kind ?? "image", publicId: att.publicId }]
                : [],
        ),
        notes: (serverJob.notes ?? []).map((note) => ({
            id: String(note.id),
            authorName: note.authorName ?? "Staff",
            authorRole: note.authorRole ?? "Project lead",
            message: note.message ?? "",
            createdAt: note.createdAt ? new Date(note.createdAt).toISOString() : new Date().toISOString(),
        })),
        createdAt: serverJob.createdAt ? new Date(serverJob.createdAt).toISOString() : new Date().toISOString(),
        stepSubmissions: (serverJob.stepSubmissions ?? []).map((sub) => ({
            step: sub.step,
            // Only the proof they sent: never a stand-in photo in front of a payment decision
            imageUrls: (sub.photos ?? []).filter(Boolean) as string[],
            note: sub.note ?? undefined,
            submittedAt: sub.submittedAt ? new Date(sub.submittedAt).toISOString() : new Date().toISOString(),
            review: sub.review
                ? {
                      outcome: sub.review.outcome,
                      at: sub.review.at ? new Date(sub.review.at).toISOString() : new Date().toISOString(),
                      by: sub.review.byName ?? null,
                      reason: sub.review.reason ?? undefined,
                  }
                : null,
        })),
        completionImageUrls: (serverJob.completionPhotos ?? []).filter(Boolean) as string[],
        submittedForReviewAt: serverJob.submittedForReviewAt ? new Date(serverJob.submittedForReviewAt).toISOString() : null,
        rejections: (serverJob.rejections ?? []).map((rej) => ({
            id: String(rej.id),
            reason: rej.reason,
            attachments: (rej.attachments ?? []).map((att) => ({
                name: att.name ?? "Rejection attachment",
                url: att.url ?? "",
                kind: att.kind ?? "image",
            })),
            rejectedBy: rej.rejectedByName ?? "Project lead",
            rejectedAt: rej.rejectedAt ? new Date(rej.rejectedAt).toISOString() : new Date().toISOString(),
            submissionImageUrls: (rej.submissionPhotos ?? []).filter(Boolean) as string[],
        })),
        extensionRequests: (serverJob.extensionRequests ?? []).map((ext) => ({
            id: String(ext.id),
            previousDueDate: ext.previousDueDate ? new Date(ext.previousDueDate).toISOString() : new Date().toISOString(),
            requestedDueDate: ext.requestedDueDate ? new Date(ext.requestedDueDate).toISOString() : new Date().toISOString(),
            reason: ext.reason ?? "",
            requestedAt: ext.requestedAt ? new Date(ext.requestedAt).toISOString() : new Date().toISOString(),
            status: ext.status,
            decidedAt: ext.decidedAt ? new Date(ext.decidedAt).toISOString() : null,
            step: ext.step ?? null,
        })),
        assignmentHistory: (serverJob.assignmentHistory ?? []).map((asg) => ({
            id: String(asg.id),
            manufacturerIds: (asg.manufacturers ?? []).map((m) => m.id),
            assignedBy: asg.assignedByName ?? "Project lead",
            assignedAt: asg.assignedAt ? new Date(asg.assignedAt).toISOString() : new Date().toISOString(),
            outcome: asg.outcome,
            outcomeAt: asg.outcomeAt ? new Date(asg.outcomeAt).toISOString() : null,
        })),
        manufacturerReview: serverJob.manufacturerReview
            ? {
                  rating: serverJob.manufacturerReview.rating,
                  comment: serverJob.manufacturerReview.comment,
                  authorName: serverJob.manufacturerReview.authorName ?? "Project lead",
                  createdAt: serverJob.manufacturerReview.createdAt ? new Date(serverJob.manufacturerReview.createdAt).toISOString() : new Date().toISOString(),
              }
            : null,
        furtherReview: serverJob.furtherReview
            ? {
                  rating: serverJob.furtherReview.rating,
                  comment: serverJob.furtherReview.comment,
                  authorName: serverJob.furtherReview.authorName ?? "Project lead",
                  createdAt: serverJob.furtherReview.createdAt ? new Date(serverJob.furtherReview.createdAt).toISOString() : new Date().toISOString(),
              }
            : null,
        leadReviews: (serverJob.leadReviews ?? []).map((lr) => ({
            manufacturerId: String(lr.manufacturer?.id ?? ""),
            leadId: String(lr.leadId),
            rating: lr.rating,
            comment: lr.comment,
            createdAt: lr.createdAt ? new Date(lr.createdAt).toISOString() : new Date().toISOString(),
            followUp: lr.followUp ? { note: lr.followUp.note, by: lr.followUp.byName ?? "Super admin", at: lr.followUp.at } : null,
        })),
        completedAt: serverJob.completedAt ? new Date(serverJob.completedAt).toISOString() : null,
        completedBy: serverJob.completedBy ? String(serverJob.completedBy) : null,
        faultReport: serverJob.faultReport
            ? {
                  reason: serverJob.faultReport.reason,
                  reportedAt: serverJob.faultReport.reportedAt ? new Date(serverJob.faultReport.reportedAt).toISOString() : new Date().toISOString(),
                  reportedBy: "Project lead",
              }
            : null,
        applications: (serverJob.applications ?? []).map((app) => ({
            id: String(app.id),
            manufacturerId: String(app.manufacturer?.id ?? ""),
            appliedAt: app.appliedAt ? new Date(app.appliedAt).toISOString() : new Date().toISOString(),
            status: app.status,
            decidedAt: app.decidedAt ? new Date(app.decidedAt).toISOString() : null,
        })),
    };
}

export function AdminJobsProvider({ children }: { children: ReactNode }) {
    const { fullName: myName } = useAdminProfile();
    const { leadId } = useStaffPlatform();
    const queryClient = useQueryClient();

    // Load live jobs from server
    const { data: serverJobsData, isLoading, isError } = useQuery({
        // Every job (up to 2,000), not just the newest page: older ones can be found, linked to and acted on
        queryKey: queryKeys.jobs.list({ all: true }),
        queryFn: async () => ({
            jobs: await fetchAllPages(async (before) => {
                const page = await jobsService.getStaffJobs({ limit: 100, before });
                return { items: (page.jobs ?? []) as ServerStaffJob[], nextBefore: page.nextBefore ?? null };
            }, 2000),
        }),
        staleTime: 30_000,
        retry: 1,
    });

    const baseJobs: AdminJob[] = useMemo(() => {
        if (serverJobsData && Array.isArray(serverJobsData.jobs)) {
            // Register server project leads into dynamic registry
            for (const j of serverJobsData.jobs) {
                if (j.projectLeads && j.projectLeads.length > 0) {
                    registerProjectLeads(j.projectLeads);
                }
            }
            return serverJobsData.jobs.map((j: ServerStaffJob) => transformStaffJobToAdminJob(j));
        }
        return [];
    }, [serverJobsData]);

    const [localPatches, setLocalPatches] = useState<Record<string, AdminJob>>({});
    const [locallyCreatedJobs, setLocallyCreatedJobs] = useState<AdminJob[]>([]);
    const [deletedJobIds, setDeletedJobIds] = useState<string[]>([]);
    // A patch only bridges the wait for the server: fresh data replaces it, so
    // what changed on the server since (new proof, others' edits) shows
    const [patchedData, setPatchedData] = useState(serverJobsData);
    if (patchedData !== serverJobsData) {
        setPatchedData(serverJobsData);
        setLocalPatches({});
    }

    const jobs = useMemo(() => {
        const combined = [
            ...locallyCreatedJobs,
            ...baseJobs.filter((job) => !locallyCreatedJobs.some((c) => c.id === job.id)),
        ];
        return combined
            .filter((job) => !deletedJobIds.includes(job.id))
            .map((job) => settleAdminJob(localPatches[job.id] ?? job));
    }, [baseJobs, locallyCreatedJobs, localPatches, deletedJobIds]);

    // Everything the context hands out is built here, together, so it keeps its
    // identity until the jobs (or who's signed in) change. The actions read the
    // jobs as of the render that made them, as they always have.
    const value: AdminJobsContextValue = useMemo(() => {
        // A change shows in the jobs lists and in the reports built from them
        // Run in the background after an action: it shows at once (patchJob), and the
        // fresh list replaces the patch when it arrives, so nobody waits for every page
        const refreshJobs = () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.reports.all }),
            ]);

        const patchJob = (idOrCode: string, patch: (job: AdminJob) => AdminJob) => {
            const target = idOrCode.toLowerCase();
            const current = jobs.find((j) => j.id.toLowerCase() === target || j.code.toLowerCase() === target);
            if (!current) return;
            const patched = patch(current);
            setLocalPatches((prev) => ({
                ...prev,
                [current.id]: patched,
                [current.code]: patched,
                [current.code.toLowerCase()]: patched,
            }));
        };

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

        const createJob = async (draft: AdminJobDraft, code: string): Promise<AdminJob> => {
            const now = new Date().toISOString();
            const cleanProjectLeadIds = draft.projectLeadIds?.filter((id) => /^[a-f\d]{24}$/i.test(id));
            const cleanManufacturerIds = draft.manufacturerIds?.filter((id) => /^[a-f\d]{24}$/i.test(id));
            const imageAttachment = draft.attachments?.find(isCoverUpload);
            const otherAttachments = (draft.attachments ?? []).filter((a) => a !== imageAttachment && a.publicId);
            const fallbackPhoto = DEFAULT_IMAGE;
            const imageUrl = imageAttachment?.url || fallbackPhoto;

            const createdJob: AdminJob = {
                ...draft,
                manufacturerIds: cleanManufacturerIds ?? [],
                id: `job-${Date.now()}`,
                code,
                projectLeadIds: cleanProjectLeadIds ?? (leadId && /^[a-f\d]{24}$/i.test(leadId) ? [leadId] : []),
                status: "pending",
                dateAssigned: null,
                imageUrl,
                imagePublicId: imageAttachment?.publicId,
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

            const payload: CreateJobPayload = {
                title: draft.title,
                description: draft.description,
                category: draft.category,
                amountKobo: Math.round(draft.amount * 100),
                dueDate: new Date(draft.dueDate).toISOString(),
                startDate: draft.startDate ? new Date(draft.startDate).toISOString() : null,
                ...(draft.deliveryLocation ? { deliveryLocation: draft.deliveryLocation } : {}),
                ...(imageAttachment ? { image: { publicId: imageAttachment.publicId!, name: imageAttachment.name } } : {}),
                ...(otherAttachments.length > 0
                    ? { attachments: otherAttachments.map((a) => ({ publicId: a.publicId!, name: a.name })) }
                    : {}),
                ...(cleanProjectLeadIds && cleanProjectLeadIds.length > 0 ? { projectLeadIds: cleanProjectLeadIds } : {}),
                ...(cleanManufacturerIds && cleanManufacturerIds.length > 0 ? { manufacturerIds: cleanManufacturerIds } : {}),
            };

            const response = await jobsService.createJob(payload);
            const savedJob = response?.job ? transformStaffJobToAdminJob(response.job) : createdJob;
            setLocallyCreatedJobs((prev) => [savedJob, ...prev.filter((j) => j.id !== savedJob.id)]);
            void refreshJobs();
            return savedJob;
        };

        const resolveJobId = (idOrCode: string): string => {
            if (!idOrCode) return "";
            const target = idOrCode.toLowerCase();
            const found = jobs.find((j) => j.id.toLowerCase() === target || j.code.toLowerCase() === target);
            return found?.id || idOrCode;
        };

        return {
            jobs,
            isLoading,
            isError,
            getJob: (idOrCode) => {
                if (!idOrCode) return undefined;
                const target = idOrCode.toLowerCase();
                return jobs.find((job) => job.id.toLowerCase() === target || job.code.toLowerCase() === target);
            },
            createJob,
            updateJob: async (id, draft) => {
                const realId = resolveJobId(id);
                const existingJob = jobs.find((job) => job.id === realId || job.code.toLowerCase() === realId.toLowerCase());
                const cleanProjectLeadIds = draft.projectLeadIds?.filter((leadId) => /^[a-f\d]{24}$/i.test(leadId));

                const imageAttachment = draft.attachments?.find(isCoverUpload);
                const otherAttachments = (draft.attachments ?? []).filter((a) => a !== imageAttachment && a.publicId);
                const imagePayload = imageAttachment
                    ? { publicId: imageAttachment.publicId!, name: imageAttachment.name }
                    : existingJob?.imagePublicId
                      ? { publicId: existingJob.imagePublicId }
                      : undefined;

                const updatePayload: UpdateJobPayload = {
                    title: draft.title,
                    description: draft.description,
                    category: draft.category,
                    amountKobo: Math.round(draft.amount * 100),
                    dueDate: new Date(draft.dueDate).toISOString(),
                    startDate: draft.startDate ? new Date(draft.startDate).toISOString() : null,
                    ...(draft.deliveryLocation ? { deliveryLocation: draft.deliveryLocation } : {}),
                    ...(imagePayload ? { image: imagePayload } : {}),
                    // Always the full list, so removing the last file removes it
                    attachments: otherAttachments.map((a) => ({ publicId: a.publicId!, name: a.name })),
                };

                if (cleanProjectLeadIds && cleanProjectLeadIds.length > 0) {
                    updatePayload.projectLeadIds = cleanProjectLeadIds;
                }

                // 1. Update job details on server
                await jobsService.updateJob(realId, updatePayload);

                // 2. If manufacturers changed and job is still pending, offer to new manufacturers
                if (
                    existingJob &&
                    draft.manufacturerIds &&
                    !sameIds(existingJob.manufacturerIds, draft.manufacturerIds)
                ) {
                    const cleanManufacturerIds = draft.manufacturerIds.filter((mId) => /^[a-f\d]{24}$/i.test(mId));
                    await jobsService.offerJob(realId, cleanManufacturerIds);
                }

                void refreshJobs();

                patchJob(realId, (job) => {
                    const updated = {
                        ...job,
                        ...draft,
                        manufacturerIds: draft.manufacturerIds ?? job.manufacturerIds,
                        projectLeadIds: cleanProjectLeadIds ?? job.projectLeadIds,
                    };
                    return sameIds(job.manufacturerIds, draft.manufacturerIds ?? job.manufacturerIds)
                        ? updated
                        : withAssignment(updated, draft.manufacturerIds ?? [], new Date().toISOString(), myName);
                });
            },
            reassignJob: async (id, manufacturerIds) => {
                const realId = resolveJobId(id);
                const cleanManufacturerIds = manufacturerIds.filter((mId) => /^[a-f\d]{24}$/i.test(mId));
                await jobsService.offerJob(realId, cleanManufacturerIds);
                void refreshJobs();
                patchJob(realId, (job) => withAssignment(job, cleanManufacturerIds, new Date().toISOString(), myName));
            },
            completeJob: async (id, review) => {
                const realId = resolveJobId(id);
                await jobsService.signOffJob(realId, { rating: review.rating, comment: review.comment, clientProofs: review.clientProofs ?? [] });
                void refreshJobs();
                patchJob(realId, (job) => {
                    if (job.status !== "in-review" || job.furtherReview) return job;
                    const now = new Date().toISOString();
                    const rated = { ...review, authorName: myName, createdAt: now };
                    return review.rating >= MIN_SIGN_OFF_RATING
                        ? { ...job, status: "completed", completedAt: now, completedBy: myName, manufacturerReview: rated }
                        : { ...job, furtherReview: rated };
                });
            },
            signOffHeldJob: async (id) => {
                const realId = resolveJobId(id);
                await jobsService.signOffHeldJob(realId);
                void refreshJobs();
                patchJob(realId, (job) =>
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
                );
            },
            approveStep: async (id, step) => {
                const realId = resolveJobId(id);
                await jobsService.approveStep(realId, step);
                void refreshJobs();
                reviewStep(realId, step, { outcome: "approved", at: new Date().toISOString(), by: myName });
            },
            sendBackStep: async (id, step, reason) => {
                const realId = resolveJobId(id);
                await jobsService.rejectStep(realId, step, { reason });
                void refreshJobs();
                reviewStep(realId, step, { outcome: "sent-back", at: new Date().toISOString(), by: myName, reason });
            },
            acceptApplication: async (id, applicationId) => {
                const realId = resolveJobId(id);
                await jobsService.decideApplication(realId, applicationId, "accepted");
                void refreshJobs();
                decideApplication(realId, applicationId, "accepted");
            },
            declineApplication: async (id, applicationId) => {
                const realId = resolveJobId(id);
                await jobsService.decideApplication(realId, applicationId, "declined");
                void refreshJobs();
                decideApplication(realId, applicationId, "declined");
            },
            reportFault: async (id, reason) => {
                const realId = resolveJobId(id);
                await jobsService.reportFault(realId, reason);
                void refreshJobs();
                patchJob(realId, (job) => {
                    // The stored job may not show an auto sign-off yet, so check the settled one
                    const settled = settleAdminJob(job);
                    const check = { signedOffAt: settled.completedAt, faultReport: settled.faultReport };
                    if (!canReportFault(check)) return job;
                    return {
                        ...settled,
                        faultReport: { reason, reportedAt: new Date().toISOString(), reportedBy: myName },
                    };
                });
            },
            rejectJob: async (id, review) => {
                const realId = resolveJobId(id);
                await jobsService.rejectJob(realId, { reason: review.reason, attachments: review.attachments });
                void refreshJobs();
                patchJob(realId, (job) =>
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
                );
            },
            decideExtension: async (id, extensionId, decision) => {
                const realId = resolveJobId(id);
                await jobsService.decideExtension(realId, extensionId, decision);
                void refreshJobs();
                patchJob(realId, (job) => {
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
                });
            },
            rateManufacturer: async (id, review) => {
                const realId = resolveJobId(id);
                await jobsService.rateManufacturer(realId, review);
                void refreshJobs();
                patchJob(realId, (job) => ({
                    ...job,
                    manufacturerReview: { ...review, authorName: myName, createdAt: new Date().toISOString() },
                }));
            },
            addNote: async (id, note) => {
                const realId = resolveJobId(id);
                await jobsService.addJobNote(realId, note.message);
                patchJob(realId, (job) => ({
                    ...job,
                    notes: [{ ...note, id: `note-${Date.now()}`, createdAt: new Date().toISOString() }, ...job.notes],
                }));
            },
            followUpLeadReview: async (id, manufacturerId, note) => {
                const realId = resolveJobId(id);
                await jobsService.followUpLeadReview(realId, manufacturerId, note);
                patchJob(realId, (job) => ({
                    ...job,
                    leadReviews: job.leadReviews.map((review) =>
                        review.manufacturerId === manufacturerId
                            ? { ...review, followUp: { note, by: myName, at: new Date().toISOString() } }
                            : review,
                    ),
                }));
            },
            releaseManufacturer: (manufacturerId) => {
                const now = new Date().toISOString();
                setLocalPatches((prev) => {
                    const nextPatches = { ...prev };
                    jobs.forEach((job) => {
                        const updated = withoutManufacturer(settleAdminJob(job), manufacturerId, now);
                        if (updated !== job) nextPatches[job.id] = updated;
                    });
                    return nextPatches;
                });
            },
            deleteJob: async (id) => {
                const realId = resolveJobId(id);
                const target = jobs.find((job) => job.id === realId || job.code.toLowerCase() === realId.toLowerCase());
                if (!target || getJobDeleteBlocker(settleAdminJob(target)) !== null) {
                    throw new Error("A manufacturer has been paid for this job, so it cannot be deleted.");
                }
                await jobsService.deleteJob(realId);
                setDeletedJobIds((prev) => [...prev, target.id]);
                void refreshJobs();
            },
        } satisfies AdminJobsContextValue;
    }, [jobs, isLoading, isError, myName, leadId, queryClient]);

    return <AdminJobsContext.Provider value={value}>{children}</AdminJobsContext.Provider>;
}

export function useAdminJobs() {
    const context = useContext(AdminJobsContext);
    if (!context) {
        throw new Error("useAdminJobs must be used within an AdminJobsProvider");
    }
    return context;
}
