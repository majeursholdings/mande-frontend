import type { Job, OpenJob } from "@/constant/manufacturer";

interface ApiMedia {
    url?: string;
    deliveryType?: string;
    format?: string;
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
    hasApplied?: boolean;
    createdAt?: string;
    postedAt?: string;
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
        imageUrl: apiJob.image?.url || apiJob.imageUrl || "",
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
        imageUrl: apiJob.image?.url || apiJob.imageUrl || "",
        hasApplied: Boolean(apiJob.hasApplied),
    } as unknown as OpenJob;
}
