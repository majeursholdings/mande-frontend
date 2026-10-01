import type { Job, OpenJob, JobAttachment } from "@/constant/manufacturer";

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
        : 0;

    return {
        id: apiJob.id || apiJob._id || "",
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
    } as unknown as Job;
}

export function mapApiOpenJobToOpenJob(apiJob: ApiJobPayload): OpenJob {
    const amountKobo = apiJob.amountKobo ?? (apiJob.price ? apiJob.price * 100 : 0);
    return {
        id: apiJob.id || apiJob._id || "",
        title: apiJob.title,
        description: apiJob.description || "",
        category: apiJob.category,
        price: Math.round(amountKobo / 100),
        postedAt: apiJob.createdAt || apiJob.postedAt || new Date().toISOString(),
        startDate: apiJob.startDate ? new Date(apiJob.startDate).toISOString() : null,
        dueDate: apiJob.dueDate ? new Date(apiJob.dueDate).toISOString() : new Date().toISOString(),
        imageUrl: resolveJobImage(apiJob),
        attachments: mapAttachments(apiJob.attachments),
        hasApplied: Boolean(apiJob.hasApplied),
    } as unknown as OpenJob;
}
