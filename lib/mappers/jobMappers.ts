import type {
    Job,
    OpenJob,
    JobAttachment,
    JobAssignee,
    JobRejection,
    JobNote,
} from "@/constant/manufacturer";
import {
    JOB_PAYMENT_SCHEDULE,
    type JobBonus,
    type JobFaultReport,
    type JobPayment,
    type JobPaymentMilestone,
    type JobRules,
    type ProductionStepKey,
    type StepSubmission,
} from "@/constant/jobWorkflow";
import type { TimelineExtensionRecord } from "@/constant/platformRecords";

interface ApiMedia {
    url?: string;
    deliveryType?: string;
    format?: string;
    name?: string;
    kind?: string;
}

export interface ApiJobAttachment {
    name?: string;
    url?: string;
    kind?: string;
    format?: string;
    publicId?: string;
}

export interface ApiJobPayload {
    id: string;
    _id?: string;
    code?: string;
    title: string;
    description?: string;
    category: Job["category"];
    status: Job["status"];
    amountKobo?: number;
    price?: number;
    dateAssigned?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
    completedAt?: string | null;
    image?: ApiMedia | null;
    imageUrl?: string;
    attachments?: ApiJobAttachment[];
    hasApplied?: boolean;
    createdAt?: string;
    postedAt?: string;
    lead?: { id: string; name: string; phone?: string | null } | null;
    assignee?: JobAssignee | null;
    leadId?: string | null;
    stepSubmissions?: Array<{
        step: StepSubmission["step"];
        photos?: string[];
        imageUrls?: string[];
        note?: string | null;
        submittedAt?: string;
        review?: {
            outcome: StepSubmission["review"] extends { outcome: infer O } ? O : string;
            at?: string;
            by?: string | null;
            byName?: string | null;
            reason?: string | null;
        } | null;
    }>;
    completionPhotos?: string[];
    completionImageUrls?: string[];
    submittedForReviewAt?: string | null;
    rejections?: Array<{
        reason?: string;
        rejectedAt?: string;
        rejectedByName?: string;
        submissionPhotos?: string[];
        imageUrls?: string[];
        submissionImageUrls?: string[];
        attachments?: Array<ApiJobAttachment | null>;
    }>;
    /** Accepted a shared job, waiting for the other manufacturer(s). */
    awaitingOthers?: boolean;
    currentStep?: ProductionStepKey | null;
    canCancel?: boolean;
    maxRejections?: number;
    rules?: Partial<JobRules> | null;
    /** Their payments and bonus, as the API works them out (amounts in kobo). */
    payments?: {
        payments?: Array<{ milestone: JobPaymentMilestone; amountKobo: number; releasedAt?: string | null }>;
        bonus?: {
            status: JobBonus["status"];
            lostReason?: JobBonus["lostReason"];
            releaseAt?: string | null;
            percent: number;
            amountKobo: number;
        } | null;
    } | null;
    faultReport?: (Omit<JobFaultReport, "reportedBy"> & { reportedBy?: string }) | null;
    extensionRequests?: Array<{
        id?: string;
        _id?: string;
        previousDueDate: string;
        requestedDueDate: string;
        reason: string;
        requestedAt: string;
        status: "pending" | "approved" | "rejected";
        decidedAt?: string | null;
        step?: StepSubmission["step"] | null;
    }>;
    leadReview?: { rating: number; comment: string; createdAt: string } | null;
    isHeldForReview?: boolean;
    deliveryLocation?: { city: string; state: string } | null;
    commentCount?: number;
    /** Newest first, as the API sends them. */
    notes?: Array<{
        id?: string;
        _id?: string;
        authorName?: string | null;
        authorRole?: string | null;
        message?: string | null;
        createdAt?: string | null;
    } | null>;
    application?: unknown;
}

function isImageAttachment(att?: ApiJobAttachment | null): boolean {
    if (!att || !att.url) return false;
    if (att.kind === "image") return true;
    if (att.format && att.format !== "pdf") return true;
    const url = att.url.toLowerCase();
    const name = (att.name ?? "").toLowerCase();
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
}

function resolveJobImage(apiJob: ApiJobPayload): string {
    if (apiJob.image?.url && apiJob.image.url.trim() !== "") {
        return apiJob.image.url;
    }
    const attachedImage = apiJob.attachments?.find(isImageAttachment);
    if (attachedImage?.url && attachedImage.url.trim() !== "") {
        return attachedImage.url;
    }
    return apiJob.imageUrl || "";
}

function mapAttachments(attachments?: Array<ApiJobAttachment | null>): JobAttachment[] {
    if (!attachments || attachments.length === 0) return [];
    return attachments.flatMap((att) =>
        att?.url ? [{ name: att.name || "attachment", url: att.url }] : [],
    );
}

/** An ISO date from the API's, or null when it sent none: a missing date is never "now". */
function toIsoOrNull(value?: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const naira = (kobo: number) => kobo / 100;

/** The job's notes, oldest first (the API sends them newest first), so the thread reads top to bottom. */
function mapNotes(notes: ApiJobPayload["notes"]): JobNote[] {
    if (!Array.isArray(notes)) return [];
    return notes
        .flatMap((note, index) =>
            note && note.message
                ? [{
                      id: note.id || note._id || `note-${index}`,
                      authorName: note.authorName || "Unknown",
                      roleLabel: note.authorRole || "",
                      message: note.message,
                      createdAt: toIsoOrNull(note.createdAt),
                  }]
                : [],
        )
        .reverse();
}

/** The job's rules, when the API sent every one of them. */
function mapRules(rules?: Partial<JobRules> | null): JobRules | null {
    if (!rules) return null;
    const { maxRejections, maxExtensionPercent, rejectionChargePercent, reviewWindowHours, faultReportDays, bonusPercent, minSignOffRating } = rules;
    const numbers = [maxRejections, maxExtensionPercent, rejectionChargePercent, reviewWindowHours, faultReportDays, bonusPercent, minSignOffRating];
    if (numbers.some((value) => typeof value !== "number")) return null;
    return {
        maxRejections: maxRejections as number,
        maxExtensionPercent: maxExtensionPercent as number,
        rejectionChargePercent: rejectionChargePercent as number,
        reviewWindowHours: reviewWindowHours as number,
        faultReportDays: faultReportDays as number,
        bonusPercent: bonusPercent as number,
        minSignOffRating: minSignOffRating as number,
        paymentSchedule: rules.paymentSchedule ?? {},
    };
}

/** The six payments as the API sent them, labelled; percents from the job's own schedule. */
function mapPayments(apiJob: ApiJobPayload, rules: JobRules | null): JobPayment[] | undefined {
    const sent = apiJob.payments?.payments;
    if (!Array.isArray(sent)) return undefined;
    return sent.map((payment) => {
        const scheduled = JOB_PAYMENT_SCHEDULE.find((candidate) => candidate.milestone === payment.milestone);
        return {
            milestone: payment.milestone,
            label: scheduled?.label ?? payment.milestone,
            percent: rules?.paymentSchedule[payment.milestone] ?? scheduled?.percent ?? 0,
            amount: naira(payment.amountKobo),
            releasedAt: toIsoOrNull(payment.releasedAt),
        };
    });
}

function mapBonus(apiJob: ApiJobPayload): JobBonus | undefined {
    const bonus = apiJob.payments?.bonus;
    if (!bonus) return undefined;
    return {
        percent: bonus.percent,
        amount: naira(bonus.amountKobo),
        status: bonus.status,
        lostReason: bonus.lostReason ?? null,
        releaseAt: toIsoOrNull(bonus.releaseAt),
    };
}

export function mapApiJobToManufacturerJob(apiJob: ApiJobPayload): Job {
    const amountKobo = apiJob.amountKobo ?? (apiJob.price ? apiJob.price * 100 : 0);
    const assignedDate = apiJob.dateAssigned ? new Date(apiJob.dateAssigned) : null;
    const assignedLabel = assignedDate
        ? `Assigned ${assignedDate.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}`
        : "Active";

    const assignedDaysAgo = assignedDate
        ? Math.max(0, Math.floor((Date.now() - assignedDate.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

    const leadPerson = apiJob.lead;
    const assignee: JobAssignee | null = leadPerson
        ? {
              name: leadPerson.name || "Project Lead",
              role: "Project lead",
              phone: leadPerson.phone || "",
          }
        : apiJob.assignee ?? null;

    const stepSubmissions: StepSubmission[] = Array.isArray(apiJob.stepSubmissions)
        ? apiJob.stepSubmissions.map((sub) => ({
              step: sub.step,
              imageUrls: sub.imageUrls || sub.photos || [],
              note: sub.note ?? undefined,
              // Always sent (the API requires it); empty, never "now", if it ever isn't
              submittedAt: toIsoOrNull(sub.submittedAt) ?? "",
              review: sub.review
                  ? {
                        outcome: sub.review.outcome === "approved" ? "approved" : "sent-back",
                        at: toIsoOrNull(sub.review.at) ?? "",
                        by: sub.review.by || sub.review.byName || null,
                        reason: sub.review.reason ?? undefined,
                    }
                  : null,
          }))
        : [];

    const rejections: JobRejection[] = Array.isArray(apiJob.rejections)
        ? apiJob.rejections.map((rej) => ({
              reason: rej.reason || "",
              rejectedAt: toIsoOrNull(rej.rejectedAt),
              imageUrls: rej.imageUrls || rej.submissionPhotos || rej.submissionImageUrls || [],
              attachments: mapAttachments(rej.attachments),
          }))
        : [];

    const extensionRequests: TimelineExtensionRecord[] = Array.isArray(apiJob.extensionRequests)
        ? apiJob.extensionRequests.map((ext) => ({
              id: ext.id || ext._id || "",
              previousDueDate: ext.previousDueDate ? new Date(ext.previousDueDate).toISOString() : "",
              requestedDueDate: ext.requestedDueDate ? new Date(ext.requestedDueDate).toISOString() : "",
              reason: ext.reason || "",
              requestedAt: toIsoOrNull(ext.requestedAt) ?? "",
              status: ext.status || "pending",
              decidedAt: ext.decidedAt ? new Date(ext.decidedAt).toISOString() : null,
              step: ext.step ?? null,
          }))
        : [];

    const rules = mapRules(apiJob.rules);

    return {
        id: apiJob.id || apiJob._id || "",
        code: apiJob.code || "",
        title: apiJob.title,
        description: apiJob.description || "",
        category: apiJob.category,
        status: apiJob.status,
        price: Math.round(amountKobo / 100),
        assignedLabel,
        assignedDaysAgo,
        startDate: apiJob.startDate ? new Date(apiJob.startDate).toISOString() : null,
        dueDate: toIsoOrNull(apiJob.dueDate),
        dateAssigned: assignedDate ? assignedDate.toISOString() : null,
        imageUrl: resolveJobImage(apiJob),
        attachments: mapAttachments(apiJob.attachments),
        deliveryLocation: apiJob.deliveryLocation ? { city: apiJob.deliveryLocation.city, state: apiJob.deliveryLocation.state } : null,
        assignee,
        stepSubmissions,
        completionImageUrls: apiJob.completionPhotos || apiJob.completionImageUrls || [],
        submittedForReviewAt: apiJob.submittedForReviewAt ? new Date(apiJob.submittedForReviewAt).toISOString() : null,
        rejections,
        completedAt: apiJob.completedAt ? new Date(apiJob.completedAt).toISOString() : null,
        faultReport: apiJob.faultReport
            ? {
                  reason: apiJob.faultReport.reason,
                  reportedAt: apiJob.faultReport.reportedAt,
                  reportedBy: apiJob.faultReport.reportedBy || "Staff",
              }
            : null,
        extensionRequests,
        leadId: leadPerson?.id || apiJob.leadId || null,
        leadReview: apiJob.leadReview ? { rating: apiJob.leadReview.rating, comment: apiJob.leadReview.comment, createdAt: apiJob.leadReview.createdAt } : null,
        isHeldForReview: Boolean(apiJob.isHeldForReview),
        commentCount: apiJob.commentCount ?? (Array.isArray(apiJob.notes) ? apiJob.notes.length : 0),
        awaitingOthers: Boolean(apiJob.awaitingOthers),
        payments: mapPayments(apiJob, rules),
        bonus: mapBonus(apiJob),
        maxRejections: apiJob.maxRejections ?? rules?.maxRejections,
        canCancel: apiJob.canCancel,
        currentStep: apiJob.currentStep,
        rules,
        notes: mapNotes(apiJob.notes),
    };
}

export function mapApiOpenJobToOpenJob(apiJob: ApiJobPayload): OpenJob {
    const amountKobo = apiJob.amountKobo ?? (apiJob.price ? apiJob.price * 100 : 0);
    const postedAt = toIsoOrNull(apiJob.postedAt || apiJob.createdAt);
    return {
        id: apiJob.id || apiJob._id || "",
        code: apiJob.code || "",
        title: apiJob.title,
        description: apiJob.description || "",
        category: apiJob.category,
        price: Math.round(amountKobo / 100),
        postedAt,
        startDate: toIsoOrNull(apiJob.startDate) ?? postedAt,
        dueDate: toIsoOrNull(apiJob.dueDate),
        imageUrl: resolveJobImage(apiJob),
        attachments: mapAttachments(apiJob.attachments),
        deliveryLocation: apiJob.deliveryLocation
            ? { city: apiJob.deliveryLocation.city, state: apiJob.deliveryLocation.state }
            : null,
        hasApplied: Boolean(apiJob.hasApplied || apiJob.application),
    };
}
