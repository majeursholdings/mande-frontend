import type {
    Job,
    OpenJob,
    JobAttachment,
    JobAssignee,
    JobRejection,
} from "@/constant/manufacturer";
import type { StepSubmission, JobFaultReport } from "@/constant/jobWorkflow";
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
    dueDate: string;
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
    }>;
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
    notes?: Array<unknown>;
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

function mapAttachments(attachments?: ApiJobAttachment[]): JobAttachment[] {
    if (!attachments || attachments.length === 0) return [];
    return attachments.map((att) => ({
        name: att.name || "attachment",
        url: att.url || "",
    }));
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
              submittedAt: sub.submittedAt ? new Date(sub.submittedAt).toISOString() : new Date().toISOString(),
              review: sub.review
                  ? {
                        outcome: sub.review.outcome === "approved" ? "approved" : "sent-back",
                        at: sub.review.at ? new Date(sub.review.at).toISOString() : new Date().toISOString(),
                        by: sub.review.by || sub.review.byName || null,
                        reason: sub.review.reason ?? undefined,
                    }
                  : null,
          }))
        : [];

    const rejections: JobRejection[] = Array.isArray(apiJob.rejections)
        ? apiJob.rejections.map((rej) => ({
              reason: rej.reason || "",
              rejectedAt: rej.rejectedAt ? new Date(rej.rejectedAt).toISOString() : new Date().toISOString(),
              imageUrls: rej.imageUrls || rej.submissionPhotos || rej.submissionImageUrls || [],
          }))
        : [];

    const extensionRequests: TimelineExtensionRecord[] = Array.isArray(apiJob.extensionRequests)
        ? apiJob.extensionRequests.map((ext) => ({
              id: ext.id || ext._id || "",
              previousDueDate: ext.previousDueDate ? new Date(ext.previousDueDate).toISOString() : "",
              requestedDueDate: ext.requestedDueDate ? new Date(ext.requestedDueDate).toISOString() : "",
              reason: ext.reason || "",
              requestedAt: ext.requestedAt ? new Date(ext.requestedAt).toISOString() : new Date().toISOString(),
              status: ext.status || "pending",
              decidedAt: ext.decidedAt ? new Date(ext.decidedAt).toISOString() : null,
              step: ext.step ?? null,
          }))
        : [];

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
        dueDate: apiJob.dueDate ? new Date(apiJob.dueDate).toISOString() : new Date().toISOString(),
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
    };
}

export function mapApiOpenJobToOpenJob(apiJob: ApiJobPayload): OpenJob {
    const amountKobo = apiJob.amountKobo ?? (apiJob.price ? apiJob.price * 100 : 0);
    const postedAt = apiJob.postedAt || apiJob.createdAt || new Date().toISOString();
    return {
        id: apiJob.id || apiJob._id || "",
        code: apiJob.code || "",
        title: apiJob.title,
        description: apiJob.description || "",
        category: apiJob.category,
        price: Math.round(amountKobo / 100),
        postedAt: new Date(postedAt).toISOString(),
        startDate: apiJob.startDate ? new Date(apiJob.startDate).toISOString() : new Date(postedAt).toISOString(),
        dueDate: apiJob.dueDate ? new Date(apiJob.dueDate).toISOString() : new Date().toISOString(),
        imageUrl: resolveJobImage(apiJob),
        attachments: mapAttachments(apiJob.attachments),
        deliveryLocation: apiJob.deliveryLocation
            ? { city: apiJob.deliveryLocation.city, state: apiJob.deliveryLocation.state }
            : null,
        hasApplied: Boolean(apiJob.hasApplied || apiJob.application),
    };
}
