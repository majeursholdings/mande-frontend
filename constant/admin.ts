import type { SelectOption } from "@/components/form/types";
import type { StatusTone } from "@/components/customTable/statusBadge";
import { JOB_PRODUCTION_STEPS, MAX_JOB_REJECTIONS as MAX_ADMIN_JOB_REJECTIONS } from "@/constant/jobWorkflow";
import { getManufacturerTransactions, type ManufacturerTransaction } from "@/constant/manufacturer";
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
    getManufacturer as getAdminManufacturer,
    getProjectLead,
    registerProjectLeads,
    registerManufacturers,
    getAllProjectLeads,
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
    type TwoFactorMethod,
} from "@/constant/sampleDb";
import {
    LayoutGrid,
    ListChecks,
    ReceiptText,
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
    registerProjectLeads,
    registerManufacturers,
    getAllProjectLeads,
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
export const ADMIN_TRANSACTIONS_URL = "/admin/transactions";
export const ADMIN_PROFILE_URL = "/admin/profile";
export const ADMIN_SETTINGS_URL = "/admin/profile/settings";
export const ADMIN_SECURITY_URL = "/admin/profile/security";

export const getAdminManufacturerUrl = (manufacturerId: string) => `${ADMIN_MANUFACTURERS_URL}/${manufacturerId}`;

export type AdminNavItem = {
    label: string;
    /** For the mobile bottom bar, where the full label doesn't fit. */
    shortLabel?: string;
    href: string;
    icon: LucideIcon;
    /** In the mobile bottom bar; the rest are under its Menu. */
    inBottomBar?: boolean;
    /** Shows how many actions are waiting for a super admin (see useSuperAdminActions). */
    countsPendingActions?: boolean;
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
    { label: "Transactions", href: ADMIN_TRANSACTIONS_URL, icon: ReceiptText, inBottomBar: true },
    { label: "Profile", href: ADMIN_PROFILE_URL, icon: UserRound },
];

// ─── Profile ──────────────────────────────────────────────────────────────────

/** What an admin can be notified about. */
export type AdminNotificationType = "applications" | "reviews" | "delays" | "job-responses" | "appeals" | "chats";

export const ADMIN_NOTIFICATION_TYPES: { value: AdminNotificationType; label: string; description: string }[] = [
    {
        value: "applications",
        label: "Job applications",
        description: "A manufacturer applies for one of your jobs",
    },
    {
        value: "reviews",
        label: "Work to review",
        description: "Proof of a production step, or the finished furniture, is waiting for you",
    },
    {
        value: "delays",
        label: "Delay reports",
        description: "A manufacturer asks for more time on one of your jobs",
    },
    {
        value: "job-responses",
        label: "Job responses",
        description: "A manufacturer accepts or declines a job you offered them",
    },
    {
        value: "appeals",
        label: "Appeals",
        description: "A suspended manufacturer asks for the suspension to be lifted",
    },
    { value: "chats", label: "Chats", description: "A manufacturer sends you a chat" },
];

/**
 * How an admin can be notified. To add one — SMS or WhatsApp to their phone,
 * say — add it here and to ADMIN_NOTIFICATION_CHANNELS; it starts off for
 * every notification until they turn it on.
 */
export type AdminNotificationChannel = "in-app" | "email";

export const ADMIN_NOTIFICATION_CHANNELS: {
    value: AdminNotificationChannel;
    label: string;
    /** Where it reaches them — shown in Settings › Notifications. */
    destination: (profile: Pick<AdminProfile, "email" | "phone">) => string;
}[] = [
    { value: "in-app", label: "In-app", destination: () => "The bell at the top of the dashboard" },
    { value: "email", label: "Email", destination: (profile) => profile.email },
];

/** For each notification, whether it comes by each channel. */
export type AdminNotificationPreferences = Record<AdminNotificationType, Record<AdminNotificationChannel, boolean>>;

/** Preferences for one notification: on for the `on` channels, off for the rest (a new channel included). */
function channelsOn(on: AdminNotificationChannel[]): Record<AdminNotificationChannel, boolean> {
    return Object.fromEntries(
        ADMIN_NOTIFICATION_CHANNELS.map(({ value }) => [value, on.includes(value)]),
    ) as Record<AdminNotificationChannel, boolean>;
}

export type AdminProfile = Pick<
    AdminPerson,
    "firstName" | "lastName" | "email" | "phone" | "position" | "avatarUrl" | "joinedAt"
> & {
    security: { twoFactorMethod: TwoFactorMethod | null };
    notificationPreferences: AdminNotificationPreferences;
};

const ME = getProjectLead(ADMIN_ME_ID) as AdminPerson;

/** The signed-in admin — their account in the sample database. Sample data until the API is connected. */
export const ADMIN_PROFILE: AdminProfile = {
    firstName: ME.firstName,
    lastName: ME.lastName,
    email: ME.email,
    phone: ME.phone,
    position: ME.position,
    avatarUrl: ME.avatarUrl,
    joinedAt: ME.joinedAt,
    security: { twoFactorMethod: ME.twoFactorMethod },
    // Everything in the app, and by email too but for chats, which they'd rather read in the app
    notificationPreferences: {
        applications: channelsOn(["in-app", "email"]),
        reviews: channelsOn(["in-app", "email"]),
        delays: channelsOn(["in-app", "email"]),
        "job-responses": channelsOn(["in-app", "email"]),
        appeals: channelsOn(["in-app", "email"]),
        chats: channelsOn(["in-app"]),
    },
};

// ─── Notifications ────────────────────────────────────────────────────────────

/** Plain text, or `{ strong }` for a name the sentence is about (set in bold). */
export type AdminNotificationPart = string | { strong: string };

export type AdminNotification = {
    id: string;
    /** What it's about — hidden from the bell while they've turned its in-app channel off. */
    type: AdminNotificationType;
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
        type: "reviews",
        actorName: "Demi Semande",
        message: [{ strong: "Demi Semande" }, " has marked the ", { strong: "Metal Fabrication" }, " job as done."],
        timestamp: "12 hrs ago",
        isRead: false,
    },
    {
        id: "admin-notif-2",
        type: "chats",
        actorName: "Demi Semande",
        message: [{ strong: "Demi Semande" }, " sent you a chat"],
        link: { label: "View", href: ADMIN_JOBS_URL },
        timestamp: "12 hrs ago",
        isRead: false,
    },
    {
        id: "admin-notif-3",
        type: "job-responses",
        actorName: "Samuel Vava",
        message: [{ strong: "Samuel Vava" }, " declined the ", { strong: "4 Office Desks" }, " job"],
        timestamp: "12 hrs ago",
        isRead: false,
    },
    {
        id: "admin-notif-4",
        type: "chats",
        actorName: "Demi Semande",
        message: [{ strong: "Demi Semande" }, " sent you a chat"],
        link: { label: "View", href: ADMIN_JOBS_URL },
        timestamp: "3 days ago",
        isRead: true,
    },
    {
        id: "admin-notif-5",
        type: "job-responses",
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

/**
 * A manufacturer's transaction, with who it's for — a row of the admin
 * Transactions page and the dashboard's Recent Transactions. Seen from the
 * manufacturer's side, as on their own Transactions page: a job payment is
 * money in; a withdrawal or plan payment is money out.
 */
export type AdminTransaction = ManufacturerTransaction & {
    manufacturerId: string;
    manufacturerName: string;
    companyName: string;
    avatarUrl: string | null;
};

/** Every manufacturer's transactions, newest first — plans they paid by card included. */
export function getAdminTransactions(manufacturers: AdminManufacturer[], jobs: AdminJob[]): AdminTransaction[] {
    return manufacturers
        .flatMap((manufacturer) =>
            getManufacturerTransactions(manufacturer.id, jobs, { includeCardPayments: true }).map(
                (transaction): AdminTransaction => ({
                    ...transaction,
                    manufacturerId: manufacturer.id,
                    manufacturerName: manufacturer.contactName,
                    companyName: manufacturer.companyName,
                    avatarUrl: manufacturer.avatarUrl,
                }),
            ),
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a.id.localeCompare(b.id));
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
    jobCode?: string;
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

