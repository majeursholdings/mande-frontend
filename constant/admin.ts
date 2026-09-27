import type { SelectOption } from "@/components/form/types";
import type { StatusTone } from "@/components/customTable/statusBadge";
import { JOB_PRODUCTION_STEPS, MAX_JOB_REJECTIONS as MAX_ADMIN_JOB_REJECTIONS } from "@/constant/jobWorkflow";
import {
    JOB_DESCRIPTION_MAX_LENGTH,
    MANUFACTURERS as ADMIN_MANUFACTURERS,
    MAX_JOB_MANUFACTURERS,
    PROJECT_LEADS,
    SAMPLE_JOBS as ADMIN_JOBS,
    SIGNED_IN_LEAD_ID as ADMIN_ME_ID,
    formatJobCodeTimestamp,
    generateJobCode,
    getJobCategoryCode,
    getJobRecordPayments as getAdminJobPayments,
    getJobRecordPayouts,
    getManufacturer as getAdminManufacturer,
    getProjectLead,
    getSampleCategoryPhoto,
    isRejectionFinal,
    settleJobRecord as settleAdminJob,
    type JobApplicationRecord as AdminJobApplication,
    type JobAssignmentRecord as AdminJobAssignment,
    type JobAttachmentRecord as AdminJobAttachment,
    type JobNoteRecord as AdminJobNote,
    type JobRecord as AdminJob,
    type JobRecordStatus as AdminJobStatus,
    type JobRejectionRecord as AdminJobRejection,
    type ManufacturerRecord as AdminManufacturer,
    type ManufacturerReviewRecord as AdminManufacturerReview,
    type ProjectLeadRecord as AdminPerson,
    type TimelineExtensionRecord as AdminTimelineExtension,
} from "@/constant/sampleDb";
import {
    LayoutGrid,
    ListChecks,
    ReceiptText,
    ShieldUser,
    UserRound,
    Wrench,
    type LucideIcon,
} from "lucide-react";

// Jobs, manufacturers and project leads live in the one sample database both
// platforms read (constant/sampleDb.ts) — here under the admin platform's names.
export {
    ADMIN_JOBS,
    ADMIN_MANUFACTURERS,
    ADMIN_ME_ID,
    JOB_DESCRIPTION_MAX_LENGTH,
    MAX_ADMIN_JOB_REJECTIONS,
    MAX_JOB_MANUFACTURERS,
    PROJECT_LEADS,
    formatJobCodeTimestamp,
    generateJobCode,
    getAdminJobPayments,
    getAdminManufacturer,
    getJobCategoryCode,
    getProjectLead,
    getSampleCategoryPhoto,
    isRejectionFinal,
    settleAdminJob,
};
export type {
    AdminJob,
    AdminJobApplication,
    AdminJobAssignment,
    AdminJobAttachment,
    AdminJobNote,
    AdminJobRejection,
    AdminJobStatus,
    AdminManufacturer,
    AdminManufacturerReview,
    AdminPerson,
    AdminTimelineExtension,
};

/** The roles an admin can sign up with. */
export const ADMIN_POSITION_OPTIONS: SelectOption[] = [
    { label: "Inventory Manager", value: "inventory-manager" },
    { label: "Quality Assurance Manager", value: "quality-assurance-manager" },
    { label: "Furniture Surveyor", value: "furniture-surveyor" },
];

/** Admin accounts are for Mande staff only — sign-up takes emails on this domain. */
export const ADMIN_EMAIL_DOMAIN = "mande.com.ng";

// ─── Dashboard navigation ─────────────────────────────────────────────────────

export const ADMIN_DASHBOARD_URL = "/admin/dashboard";
export const ADMIN_JOBS_URL = "/admin/jobs";
export const ADMIN_MANUFACTURERS_URL = "/admin/manufacturers";
export const ADMIN_PROJECT_LEADS_URL = "/admin/project-leads";
export const ADMIN_TRANSACTIONS_URL = "/admin/transactions";
export const ADMIN_PROFILE_URL = "/admin/profile";

export type AdminNavItem = {
    label: string;
    /** For the mobile bottom bar, where the full label doesn't fit. */
    shortLabel?: string;
    href: string;
    icon: LucideIcon;
    /** In the mobile bottom bar; the rest are under its Menu. */
    inBottomBar?: boolean;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
    { label: "Dashboard", href: ADMIN_DASHBOARD_URL, icon: LayoutGrid, inBottomBar: true },
    { label: "Jobs", href: ADMIN_JOBS_URL, icon: ListChecks, inBottomBar: true },
    {
        label: "Manufacturers",
        shortLabel: "Manufacturer",
        href: ADMIN_MANUFACTURERS_URL,
        icon: Wrench,
        inBottomBar: true,
    },
    { label: "Project Leads", href: ADMIN_PROJECT_LEADS_URL, icon: ShieldUser, inBottomBar: true },
    { label: "Transactions", href: ADMIN_TRANSACTIONS_URL, icon: ReceiptText },
    { label: "Profile", href: ADMIN_PROFILE_URL, icon: UserRound },
];

export function isAdminNavItemActive(item: AdminNavItem, pathname: string): boolean {
    return item.href === ADMIN_DASHBOARD_URL ? pathname === item.href : pathname.startsWith(item.href);
}

/** The signed-in admin. Sample data until the API is connected. */
export const ADMIN_PROFILE = {
    firstName: "Latade",
    lastName: "Dipe",
    /** Null shows a generated avatar. */
    avatarUrl: null as string | null,
};

// ─── Notifications ────────────────────────────────────────────────────────────

/** Plain text, or `{ strong }` for a name the sentence is about (set in bold). */
export type AdminNotificationPart = string | { strong: string };

export type AdminNotification = {
    id: string;
    /** Who it's about — shown as their avatar. */
    actorName: string;
    message: AdminNotificationPart[];
    link?: { label: string; href: string };
    timestamp: string;
    isRead: boolean;
};

export const ADMIN_NOTIFICATIONS: AdminNotification[] = [
    {
        id: "admin-notif-1",
        actorName: "Demi Semande",
        message: [{ strong: "Demi Semande" }, " has marked the ", { strong: "Metal Fabrication" }, " job as done."],
        timestamp: "12 hrs ago",
        isRead: false,
    },
    {
        id: "admin-notif-2",
        actorName: "Demi Semande",
        message: [{ strong: "Demi Semande" }, " sent you a chat"],
        link: { label: "View", href: ADMIN_JOBS_URL },
        timestamp: "12 hrs ago",
        isRead: false,
    },
    {
        id: "admin-notif-3",
        actorName: "Samuel Vava",
        message: [{ strong: "Samuel Vava" }, " declined the ", { strong: "4 Office Desks" }, " job"],
        timestamp: "12 hrs ago",
        isRead: false,
    },
    {
        id: "admin-notif-4",
        actorName: "Demi Semande",
        message: [{ strong: "Demi Semande" }, " sent you a chat"],
        link: { label: "View", href: ADMIN_JOBS_URL },
        timestamp: "3 days ago",
        isRead: true,
    },
    {
        id: "admin-notif-5",
        actorName: "Demi Semande",
        message: [{ strong: "Demi Semande" }, " accepted the ", { strong: "Metal Fabrication" }, " job"],
        timestamp: "3 days ago",
        isRead: true,
    },
];

// ─── Dashboard ────────────────────────────────────────────────────────────────
// The dashboard's numbers are worked out from the jobs — see
// components/adminPlatform/dashboardPage/dashboardStats.ts.

const DAY_MS = 24 * 60 * 60 * 1000;

export type AdminTransaction = {
    id: string;
    /** "out" is a payment to a manufacturer; "in" is a customer paying Mande. */
    direction: "in" | "out";
    accountName: string;
    /** What it was for, e.g. "Frame approved · Metal Fabrication". */
    label: string;
    /** In naira. */
    amount: number;
    /** ISO date. */
    date: string;
    isReconciled: boolean;
};

/** A payout counts as reconciled against the bank statement once it's this old. */
const RECONCILED_AFTER_DAYS = 7;

/** What's been paid out on a job so far (see JOB_PAYMENT_SCHEDULE) — a transaction per manufacturer paid. */
export function getJobPayouts(job: AdminJob, now: Date = new Date()): AdminTransaction[] {
    return getJobRecordPayouts(job, now).map((payout) => ({
        id: payout.id,
        direction: "out",
        accountName: getAdminManufacturer(payout.manufacturerId)?.companyName ?? "Manufacturer",
        label: `${payout.label} · ${payout.jobTitle}`,
        amount: payout.amount,
        date: payout.paidAt,
        isReconciled: now.getTime() - new Date(payout.paidAt).getTime() >= RECONCILED_AFTER_DAYS * DAY_MS,
    }));
}

/**
 * A manufacturer's progress update waiting for an admin to check it — proof
 * of a production step, or (once every step is approved) photos of the
 * finished furniture.
 */
export type PendingProgressReview = {
    id: string;
    /** An ADMIN_JOBS id — "Review" opens that job. */
    jobId: string;
    jobTitle: string;
    manufacturerName: string;
    /** The photo submitted with the update. */
    imageUrl: string;
    /** Production steps done, out of JOB_PRODUCTION_STEPS — counting the one this update is for. */
    stepsCompleted: number;
    /** ISO date the update was submitted. */
    submittedAt: string;
};

export const TOTAL_PRODUCTION_STEPS = JOB_PRODUCTION_STEPS.length;

/** "Assembly" for a step update; "Finished furniture" once every step is done. */
export function getReviewStage(review: Pick<PendingProgressReview, "stepsCompleted">): string {
    return review.stepsCompleted >= TOTAL_PRODUCTION_STEPS
        ? "Finished furniture"
        : (JOB_PRODUCTION_STEPS[review.stepsCompleted - 1]?.label ?? "Not started");
}

/** How each job status reads on the admin platform. */
export const ADMIN_JOB_STATUS_CONFIG: Record<AdminJobStatus, { label: string; tone: StatusTone }> = {
    pending: { label: "Pending", tone: "gray" },
    "in-progress": { label: "In progress", tone: "amber" },
    "in-review": { label: "In review", tone: "blue" },
    rejected: { label: "Rejected", tone: "red" },
    completed: { label: "Completed", tone: "green" },
};

/**
 * "No progress" before a manufacturer picks it up, "Delivered" once
 * completed, "Closed" once rejected for good, otherwise time to the due
 * date — with how urgent that is: past due, or down to days.
 */
export function getJobCountdown(
    job: Pick<AdminJob, "status" | "dueDate" | "rejections">,
    from: Date = new Date(),
): { label: string; urgency: "past-due" | "days" | null } {
    if (job.status === "pending") return { label: "No progress", urgency: null };
    if (job.status === "completed") return { label: "Delivered", urgency: null };
    if (isRejectionFinal(job)) return { label: "Closed", urgency: null };
    const diffDays = Math.ceil((new Date(job.dueDate).getTime() - from.getTime()) / DAY_MS);
    if (diffDays <= 0) return { label: "Past due", urgency: "past-due" };
    if (diffDays < 7) return { label: `${diffDays} day${diffDays === 1 ? "" : "s"} left`, urgency: "days" };
    const weeks = Math.round(diffDays / 7);
    return { label: `${weeks} week${weeks === 1 ? "" : "s"} left`, urgency: null };
}

export const getJobCountdownLabel = (job: Pick<AdminJob, "status" | "dueDate" | "rejections">, from?: Date) =>
    getJobCountdown(job, from).label;

/** The jobs table's "Sort by" menu — sort orders, then status filters, as in the design. */
export type AdminJobsView =
    | "all"
    | "date-assigned"
    | "due-date"
    | "pending"
    | "in-progress"
    | "in-review"
    | "rejected"
    | "completed";

export const ADMIN_JOBS_VIEW_OPTIONS: { value: AdminJobsView; label: string }[] = [
    { value: "all", label: "All" },
    { value: "date-assigned", label: "Date assigned" },
    { value: "due-date", label: "Due date" },
    { value: "in-progress", label: "In progress" },
    { value: "in-review", label: "In review" },
    { value: "completed", label: "Completed" },
    { value: "rejected", label: "Rejected" },
    { value: "pending", label: "Pending" },
];

export const ADMIN_JOBS_PAGE_SIZE = 10;

