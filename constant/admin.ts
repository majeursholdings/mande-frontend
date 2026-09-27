import type { SelectOption } from "@/components/form/types";
import {
    JOB_PRODUCTION_STEPS,
    MAX_JOB_REJECTIONS,
    type ProductionStepKey,
} from "@/constant/manufacturer";
import type { StatusTone } from "@/components/customTable/statusBadge";
import { formatCompactPrice, formatPrice } from "@/lib/currency";
import {
    LayoutGrid,
    ListChecks,
    ReceiptText,
    ShieldUser,
    UserRound,
    Wrench,
    type LucideIcon,
} from "lucide-react";

/** The roles an admin can sign up with. */
export const ADMIN_POSITION_OPTIONS: SelectOption[] = [
    { label: "Inventory Manager", value: "inventory-manager" },
    { label: "Quality Assurance Manager", value: "quality-assurance-manager" },
    { label: "Furniture Surveyor", value: "furniture-surveyor" },
];

/** Admin accounts are for Mande staff only — sign-up takes emails on this domain. */
export const ADMIN_EMAIL_DOMAIN = "mande.com.ng";

function daysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

function hoursAgo(hours: number): string {
    return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

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

export type AdminDashboardStat = {
    id: string;
    label: string;
    value: string;
    /** Small, after the value — e.g. "/68" out of all accounts. */
    valueSuffix?: string;
    /** Full value for the tooltip when `value` is shortened, e.g. "₦19,400,000". */
    fullValue?: string;
    /** Percentage change since last month — signed, e.g. 12 or -8. */
    changePercent: number;
    icon: "manufacturers" | "revenue" | "success-rate" | "active-accounts";
};

export const ADMIN_DASHBOARD_STATS: AdminDashboardStat[] = [
    { id: "manufacturers", label: "Total Number of Manufacturers", value: "68", changePercent: 12, icon: "manufacturers" },
    {
        id: "revenue",
        label: "Total Sales Revenue",
        value: formatCompactPrice(19_400_000),
        fullValue: formatPrice(19_400_000),
        changePercent: 12,
        icon: "revenue",
    },
    { id: "success-rate", label: "Production Success Rate", value: "92%", changePercent: 4, icon: "success-rate" },
    {
        id: "active-accounts",
        label: "Active Manufacturer Accounts",
        value: "62",
        valueSuffix: "/68",
        changePercent: -8,
        icon: "active-accounts",
    },
];

export type JobStatisticsRange = "weekly" | "monthly";

export type JobStatisticsPoint = {
    label: string;
    successful: number;
    unsuccessful: number;
};

export const JOB_STATISTICS: Record<
    JobStatisticsRange,
    { axisMax: number; axisStep: number; data: JobStatisticsPoint[] }
> = {
    monthly: {
        axisMax: 20,
        axisStep: 5,
        data: [
            { label: "Jan", successful: 12, unsuccessful: 0 },
            { label: "Feb", successful: 5, unsuccessful: 0 },
            { label: "Mar", successful: 1, unsuccessful: 0 },
            { label: "Apr", successful: 20, unsuccessful: 0 },
            { label: "May", successful: 1, unsuccessful: 10 },
            { label: "Jun", successful: 1, unsuccessful: 3 },
            { label: "Jul", successful: 15, unsuccessful: 0 },
            { label: "Aug", successful: 18, unsuccessful: 0 },
            { label: "Sep", successful: 3, unsuccessful: 3 },
            { label: "Oct", successful: 5, unsuccessful: 0 },
            { label: "Nov", successful: 12, unsuccessful: 0 },
            { label: "Dec", successful: 20, unsuccessful: 0 },
        ],
    },
    weekly: {
        axisMax: 8,
        axisStep: 2,
        data: [
            { label: "Mon", successful: 5, unsuccessful: 1 },
            { label: "Tue", successful: 3, unsuccessful: 0 },
            { label: "Wed", successful: 1, unsuccessful: 1 },
            { label: "Thu", successful: 8, unsuccessful: 0 },
            { label: "Fri", successful: 1, unsuccessful: 4 },
            { label: "Sat", successful: 1, unsuccessful: 2 },
            { label: "Sun", successful: 6, unsuccessful: 0 },
        ],
    },
};

/** Every job on the platform by status, for the cumulative jobs donut. */
export type JobStatusCount = {
    status: "completed" | "in-progress" | "in-review" | "pending";
    label: string;
    count: number;
};

export const JOB_STATUS_COUNTS: JobStatusCount[] = [
    { status: "completed", label: "Completed", count: 62 },
    { status: "in-progress", label: "In progress", count: 31 },
    { status: "in-review", label: "In review", count: 19 },
    { status: "pending", label: "Pending", count: 12 },
];

export type AdminTransaction = {
    id: string;
    /** "out" is a payment to a manufacturer; "in" is a customer paying Mande. */
    direction: "in" | "out";
    accountName: string;
    /** What it was for, e.g. "First installment". */
    label: string;
    /** In naira. */
    amount: number;
    /** ISO date. */
    date: string;
    isReconciled: boolean;
};

export const RECENT_ADMIN_TRANSACTIONS: AdminTransaction[] = [
    {
        id: "admin-txn-1",
        direction: "out",
        accountName: "Vava Furniture Nig. Ltd",
        label: "First installment",
        amount: 100000,
        date: daysFromNow(-2),
        isReconciled: false,
    },
    {
        id: "admin-txn-2",
        direction: "in",
        accountName: "Mande Customer",
        label: "Metal fabrication payment",
        amount: 800000,
        date: daysFromNow(-10),
        isReconciled: true,
    },
    {
        id: "admin-txn-3",
        direction: "out",
        accountName: "Kesino Furnitures",
        label: "First installment",
        amount: 200000,
        date: daysFromNow(-33),
        isReconciled: false,
    },
    {
        id: "admin-txn-4",
        direction: "in",
        accountName: "Mande Customer",
        label: "Cushion payment",
        amount: 1300000,
        date: daysFromNow(-34),
        isReconciled: true,
    },
];

/**
 * A manufacturer's progress update waiting for an admin to check it — a
 * production step marked done, or (once every step is) photos of the
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
    /** Production steps done, out of JOB_PRODUCTION_STEPS. */
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

export const PENDING_PROGRESS_REVIEWS: PendingProgressReview[] = [
    {
        id: "review-1",
        jobId: "job-1",
        jobTitle: "Metal Fabrication",
        manufacturerName: "Demi Semande",
        imageUrl: "/sample-image/tv-console.webp",
        stepsCompleted: 6,
        submittedAt: hoursAgo(2),
    },
    {
        id: "review-2",
        jobId: "job-3",
        jobTitle: "2 Beds & 1 Desk",
        manufacturerName: "Samuel Vava",
        imageUrl: "/sample-image/bed.webp",
        stepsCompleted: 3,
        submittedAt: hoursAgo(5),
    },
    {
        id: "review-3",
        jobId: "job-13",
        jobTitle: "Rattan Patio Set",
        manufacturerName: "Samuel Vava",
        imageUrl: "/sample-image/sectional-sofa.png",
        stepsCompleted: 4,
        submittedAt: hoursAgo(26),
    },
    {
        id: "review-4",
        jobId: "job-16",
        jobTitle: "4 Leather Lounge Chairs",
        manufacturerName: "Demi Semande",
        imageUrl: "/sample-image/sarki-chair.webp",
        stepsCompleted: 2,
        submittedAt: hoursAgo(50),
    },
];

// ─── Jobs ─────────────────────────────────────────────────────────────────────
// Jobs the Mande team creates and hands to manufacturers. Each has project
// lead(s) on the Mande side — only a job's lead acts on it (edits, reassigns,
// reviews the work, decides timeline extensions, leaves notes or a rating);
// every admin can view it.
//
// The lifecycle: pending (waiting for a manufacturer to accept — can be
// edited or reassigned) → in progress (the manufacturer works through the
// production steps; may ask for more time) → in review (they've submitted
// photos of the finished furniture) → completed, or rejected with a review.
// A rejected job goes back to the manufacturer to fix and resubmit — up to
// MAX_JOB_REJECTIONS times; after the last rejection it stays rejected.

export type AdminPerson = {
    id: string;
    name: string;
    /** Null shows a generated avatar. */
    avatarUrl: string | null;
};

/** The signed-in admin's id among the project leads. */
export const ADMIN_ME_ID = "lead-latade";

export const PROJECT_LEADS: AdminPerson[] = [
    { id: "lead-latade", name: "Latade Dipe", avatarUrl: null },
    { id: "lead-mark", name: "Mark Wilson", avatarUrl: null },
    { id: "lead-austin", name: "Austin Campbell", avatarUrl: null },
    { id: "lead-joke", name: "Joke Phillips", avatarUrl: null },
    { id: "lead-ted", name: "Ted Lasso", avatarUrl: null },
    { id: "lead-mercury", name: "Mercury Jones", avatarUrl: null },
];

export function getProjectLead(id: string): AdminPerson | undefined {
    return PROJECT_LEADS.find((lead) => lead.id === id);
}

export type AdminManufacturer = {
    id: string;
    companyName: string;
    /** The person at the company who posts on jobs. */
    contactName: string;
    phone: string;
    email: string;
};

export const ADMIN_MANUFACTURERS: AdminManufacturer[] = [
    { id: "mfr-majeurs", companyName: "Majeurs Chesterfield", contactName: "Demi Semande", phone: "+2348012345678", email: "demi@majeurs.ng" },
    { id: "mfr-vava", companyName: "Vava Furniture Nig. Ltd", contactName: "Samuel Vava", phone: "+2348023456789", email: "samuel@vavafurniture.ng" },
    { id: "mfr-kesino", companyName: "Kesino Furnitures", contactName: "Kesi Nwosu", phone: "+2348034567890", email: "kesi@kesino.ng" },
    { id: "mfr-oak", companyName: "Oak & Iron Works", contactName: "Tunde Bakare", phone: "+2348045678901", email: "tunde@oakandiron.ng" },
    { id: "mfr-leather", companyName: "Lagos Leather Co.", contactName: "Amaka Obi", phone: "+2348056789012", email: "amaka@lagosleather.ng" },
];

export function getAdminManufacturer(id: string): AdminManufacturer | undefined {
    return ADMIN_MANUFACTURERS.find((manufacturer) => manufacturer.id === id);
}

/** Short codes for each category, used in job codes — "upholstery" → "UPH". */
const JOB_CATEGORY_CODES: Record<string, string> = {
    beds: "BED",
    desks: "DSK",
    "chairs-seating": "CHR",
    sofas: "SOF",
    leather: "LTH",
    wood: "WOD",
    upholstery: "UPH",
    cabinetry: "CAB",
    "outdoor-furniture": "OUT",
};

export function getJobCategoryCode(category: string): string {
    return JOB_CATEGORY_CODES[category] ?? category.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase();
}

/** 26 Sep 2026, 14:32:05 → "20260926-143205", in local time. */
export function formatJobCodeTimestamp(at: Date): string {
    const pad = (value: number) => String(value).padStart(2, "0");
    return (
        `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}` +
        `-${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}`
    );
}

/**
 * "MD-UPH-20260926-143205" — MD, the category's short code, then the date
 * and time the job's name was first entered. Set once when the job is
 * created; editing the job never changes it.
 */
export function generateJobCode(category: string, at: Date): string {
    return `MD-${getJobCategoryCode(category)}-${formatJobCodeTimestamp(at)}`;
}

/** A job can go to at most this many manufacturers. */
export const MAX_JOB_MANUFACTURERS = 2;
/** Longest a job description can be. */
export const JOB_DESCRIPTION_MAX_LENGTH = 120;

/** Where a job is in its lifecycle — see the top of this section. */
export type AdminJobStatus = "pending" | "in-progress" | "in-review" | "rejected" | "completed";

export const ADMIN_JOB_STATUS_CONFIG: Record<AdminJobStatus, { label: string; tone: StatusTone }> = {
    pending: { label: "Pending", tone: "gray" },
    "in-progress": { label: "In progress", tone: "amber" },
    "in-review": { label: "In review", tone: "blue" },
    rejected: { label: "Rejected", tone: "red" },
    completed: { label: "Completed", tone: "green" },
};

/** A job is rejected for good once it's been rejected this many times. */
export const MAX_ADMIN_JOB_REJECTIONS = MAX_JOB_REJECTIONS;

/**
 * A note, comment or feedback on a job — left by its project lead or the
 * manufacturer. Not a chat: no live updates or read receipts, just a
 * running record on the job.
 */
export type AdminJobNote = {
    id: string;
    authorName: string;
    /** e.g. "Project lead", or the manufacturer's company name. */
    authorRole: string;
    message: string;
    /** ISO date. */
    createdAt: string;
};

export type AdminJobAttachment = {
    name: string;
    url: string;
    /** A PDF document, or a photo/render of the furniture. */
    kind: "document" | "image";
};

/** A lead turning down the finished work, with what needs fixing. */
export type AdminJobRejection = {
    id: string;
    /** The lead's review — why, and what to fix. */
    reason: string;
    /** Optional photos or documents showing the problems. */
    attachments: AdminJobAttachment[];
    rejectedBy: string;
    /** ISO date. */
    rejectedAt: string;
    /** The finished-furniture photos this rejection was about. */
    submissionImageUrls: string[];
};

/** A manufacturer asking for a later due date, e.g. after a delay. */
export type AdminTimelineExtension = {
    id: string;
    /** ISO dates. */
    previousDueDate: string;
    requestedDueDate: string;
    reason: string;
    requestedAt: string;
    /** "pending" until the lead approves (the due date moves) or rejects it. */
    status: "pending" | "approved" | "rejected";
    decidedAt: string | null;
};

/** One offer of the job to manufacturer(s). */
export type AdminJobAssignment = {
    id: string;
    manufacturerIds: string[];
    assignedBy: string;
    /** ISO date. */
    assignedAt: string;
    /** Still waiting for an answer, taken on, turned down, or replaced by a reassignment. */
    outcome: "awaiting" | "accepted" | "declined" | "reassigned";
    outcomeAt: string | null;
};

/** The lead's rating of the manufacturer once the job is completed. */
export type AdminManufacturerReview = {
    /** 1–5. */
    rating: number;
    comment: string;
    authorName: string;
    /** ISO date. */
    createdAt: string;
};

export type AdminJob = {
    id: string;
    code: string;
    title: string;
    /** A COMPANY_SPECIALITY_OPTIONS value — also part of the job code. */
    category: string;
    /** Up to MAX_JOB_MANUFACTURERS; empty until one is chosen. */
    manufacturerIds: string[];
    /** What the manufacturer is paid, in naira. */
    amount: number;
    projectLeadIds: string[];
    /** ISO dates — the planned schedule. The start date is optional. */
    startDate: string | null;
    dueDate: string;
    /** ISO date a manufacturer accepted the job. Null while pending. */
    dateAssigned: string | null;
    status: AdminJobStatus;
    description: string;
    attachments: AdminJobAttachment[];
    /** Newest first. */
    notes: AdminJobNote[];
    /** ISO date — "All" lists the newest first. */
    createdAt: string;
    /** Production steps the manufacturer has done, in JOB_PRODUCTION_STEPS order. */
    completedStepKeys: ProductionStepKey[];
    /** The latest photos of the finished furniture, submitted for review. */
    completionImageUrls: string[];
    /** ISO date of the latest submission. Null until the first. */
    submittedForReviewAt: string | null;
    /** Oldest first — at most MAX_ADMIN_JOB_REJECTIONS. */
    rejections: AdminJobRejection[];
    /** Newest first. */
    extensionRequests: AdminTimelineExtension[];
    /** Newest first. */
    assignmentHistory: AdminJobAssignment[];
    /** Null until the lead rates the manufacturer on a completed job. */
    manufacturerReview: AdminManufacturerReview | null;
};

/** Rejected for the last time — the manufacturer can't resubmit it. */
export function isRejectionFinal(job: Pick<AdminJob, "status" | "rejections">): boolean {
    return job.status === "rejected" && job.rejections.length >= MAX_ADMIN_JOB_REJECTIONS;
}

/**
 * "No progress" before a manufacturer picks it up, "Delivered" once
 * completed, "Closed" once rejected for good, otherwise time to the due date.
 */
export function getJobCountdownLabel(
    job: Pick<AdminJob, "status" | "dueDate" | "rejections">,
    from: Date = new Date(),
): string {
    if (job.status === "pending") return "No progress";
    if (job.status === "completed") return "Delivered";
    if (isRejectionFinal(job)) return "Closed";
    const diffDays = Math.ceil((new Date(job.dueDate).getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Past due";
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} left`;
    const weeks = Math.round(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} left`;
}

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

function minutesAgo(minutes: number): string {
    return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

const METAL_FABRICATION_NOTES: AdminJobNote[] = [
    {
        id: "note-1-5",
        authorName: "Demi Semande",
        authorRole: "Majeurs Chesterfield",
        message: "I have marked the Metal Fabrication job as done.",
        createdAt: minutesAgo(90),
    },
    {
        id: "note-1-4",
        authorName: "Latade Dipe",
        authorRole: "Project lead",
        message: "That's great! Looking forward to your team delivering great work. 😃",
        createdAt: minutesAgo(60 * 25),
    },
    {
        id: "note-1-3",
        authorName: "Demi Semande",
        authorRole: "Majeurs Chesterfield",
        message:
            "Nice to meet you Latade, I have accepted the metal fabrication job. My team is certainly up to the task. 🔨",
        createdAt: minutesAgo(60 * 26),
    },
    {
        id: "note-1-2",
        authorName: "Latade Dipe",
        authorRole: "Project lead",
        message:
            "Hello Demi Semande, my name is Latade Dipe. I will be your project lead for the duration of this job. Leave any questions or updates here. 👍🏾",
        createdAt: minutesAgo(60 * 27),
    },
    {
        id: "note-1-1",
        authorName: "Latade Dipe",
        authorRole: "Project lead",
        message: "Job created. Blueprints are attached — the powder coat should be matte black.",
        createdAt: minutesAgo(60 * 50),
    },
];

const MARK_WILSON_NOTES: AdminJobNote[] = [
    {
        id: "note-2-2",
        authorName: "Demi Semande",
        authorRole: "Majeurs Chesterfield",
        message: "The fabric samples arrived. We'll start cutting on Monday.",
        createdAt: minutesAgo(60 * 5),
    },
    {
        id: "note-2-1",
        authorName: "Mark Wilson",
        authorRole: "Project lead",
        message: "Please use the approved oatmeal fabric for all four cushions.",
        createdAt: minutesAgo(60 * 30),
    },
];

type JobSeed = Pick<AdminJob, "title" | "manufacturerIds" | "amount" | "projectLeadIds" | "status"> & {
    /** The first is the job's category. */
    specialities: string[];
    /** Days from today. */
    start: number;
    due: number;
    /** Days from today; omit while pending. */
    assigned?: number;
    attachments?: AdminJobAttachment[];
    notes?: AdminJobNote[];
    /** In progress: how many production steps are done. */
    stepsDone?: number;
    rejections?: AdminJobRejection[];
    extensionRequests?: AdminTimelineExtension[];
    /** Overrides the default single assignment. */
    assignmentHistory?: AdminJobAssignment[];
    manufacturerReview?: AdminManufacturerReview;
};

const BLUEPRINTS: AdminJobAttachment[] = [
    { name: "M.F Blueprint.pdf", url: "/mf-blueprint.pdf", kind: "document" },
    { name: "Blueprint DEMO.pdf", url: "/blueprint-DEMO.pdf", kind: "document" },
];

/** A furniture photo per category, standing in for manufacturers' uploads. */
const CATEGORY_PHOTOS: Record<string, string> = {
    beds: "/sample-image/bed.webp",
    desks: "/sample-image/table.webp",
    "chairs-seating": "/sample-image/sarki-chair.webp",
    sofas: "/sample-image/sectional-sofa.png",
    leather: "/sample-image/sarki-chair.webp",
    wood: "/sample-image/table.webp",
    upholstery: "/sample-image/sectional-sofa.png",
    cabinetry: "/sample-image/tv-console.webp",
    "outdoor-furniture": "/sample-image/tv-console.webp",
};

const rejection = (id: string, daysAgo: number, reason: string, withPhoto = false): AdminJobRejection => ({
    id,
    reason,
    attachments: withPhoto
        ? [{ name: "Marked-up photo.webp", url: "/sample-image/tv-console.webp", kind: "image" }]
        : [],
    rejectedBy: "Latade Dipe",
    rejectedAt: daysFromNow(-daysAgo),
    submissionImageUrls: ["/sample-image/tv-console.webp"],
});

const JOB_SEEDS: JobSeed[] = [
    // In review, after one rejection
    { title: "Metal Fabrication", specialities: ["outdoor-furniture"], manufacturerIds: ["mfr-majeurs"], amount: 450000, projectLeadIds: ["lead-latade"], status: "in-review", start: -20, due: 21, assigned: -20, attachments: [...BLUEPRINTS, { name: "Finish reference.webp", url: "/sample-image/tv-console.webp", kind: "image" }], notes: METAL_FABRICATION_NOTES,
        rejections: [rejection("rej-1-1", 4, "The powder coat is glossy, but the spec calls for matte black. The weld on the back left leg also needs grinding smooth.", true)] },
    { title: "4 Cushions & Seating Fabric", specialities: ["upholstery", "leather"], manufacturerIds: ["mfr-majeurs"], amount: 1500000, projectLeadIds: ["lead-mark"], status: "in-progress", start: -10, due: 35, assigned: -10, attachments: BLUEPRINTS, notes: MARK_WILSON_NOTES, stepsDone: 2 },
    { title: "2 Beds & 1 Desk", specialities: ["beds", "desks"], manufacturerIds: ["mfr-vava"], amount: 620000, projectLeadIds: ["lead-austin"], status: "in-progress", start: -30, due: 4, assigned: -30, stepsDone: 3 },
    // Pending, after the first manufacturer turned it down
    { title: "3 Tables & Carver Chairs", specialities: ["wood", "chairs-seating"], manufacturerIds: ["mfr-kesino"], amount: 540000, projectLeadIds: ["lead-latade"], status: "pending", start: 3, due: 45,
        assignmentHistory: [
            { id: "asg-4-2", manufacturerIds: ["mfr-kesino"], assignedBy: "Latade Dipe", assignedAt: daysFromNow(-1), outcome: "awaiting", outcomeAt: null },
            { id: "asg-4-1", manufacturerIds: ["mfr-vava"], assignedBy: "Latade Dipe", assignedAt: daysFromNow(-4), outcome: "declined", outcomeAt: daysFromNow(-2) },
        ] },
    { title: "4 Desks", specialities: ["desks"], manufacturerIds: ["mfr-oak"], amount: 380000, projectLeadIds: ["lead-joke"], status: "in-progress", start: -40, due: 2, assigned: -40, stepsDone: 5 },
    { title: "3 Chairs & Seating", specialities: ["chairs-seating"], manufacturerIds: ["mfr-majeurs"], amount: 300000, projectLeadIds: ["lead-ted"], status: "in-progress", start: -12, due: 21, assigned: -12, stepsDone: 1 },
    // In progress, asking for more time
    { title: "2 Leather Seats", specialities: ["leather"], manufacturerIds: ["mfr-leather"], amount: 420000, projectLeadIds: ["lead-latade"], status: "in-progress", start: -25, due: 7, assigned: -25, stepsDone: 3,
        extensionRequests: [
            { id: "ext-7-1", previousDueDate: daysFromNow(7), requestedDueDate: daysFromNow(21), reason: "Our leather supplier delayed the hides by two weeks, so upholstery can't start until they arrive.", requestedAt: daysFromNow(-1), status: "pending", decidedAt: null },
        ] },
    { title: "8 Throw Pillows", specialities: ["upholstery"], manufacturerIds: ["mfr-majeurs"], amount: 96000, projectLeadIds: ["lead-joke"], status: "in-progress", start: -18, due: 3, assigned: -18, stepsDone: 4 },
    { title: "8 Office Desks & Chairs", specialities: ["desks", "chairs-seating"], manufacturerIds: ["mfr-oak", "mfr-kesino"], amount: 2400000, projectLeadIds: ["lead-ted"], status: "completed", start: -70, due: -5, assigned: -70,
        manufacturerReview: { rating: 4, comment: "Solid build and delivered on time. One chair base had a scuff, which they replaced the same week.", authorName: "Ted Lasso", createdAt: daysFromNow(-4) } },
    { title: "2 Cushions", specialities: ["upholstery"], manufacturerIds: ["mfr-vava"], amount: 60000, projectLeadIds: ["lead-mercury"], status: "in-progress", start: -6, due: 21, assigned: -6, stepsDone: 1 },
    // Completed, waiting for the lead's rating
    { title: "Walnut Bookshelf", specialities: ["cabinetry", "wood"], manufacturerIds: ["mfr-kesino"], amount: 310000, projectLeadIds: ["lead-latade"], status: "completed", start: -60, due: -10, assigned: -60 },
    // Rejected for the last time
    { title: "Leather Recliner", specialities: ["leather", "sofas"], manufacturerIds: ["mfr-leather"], amount: 520000, projectLeadIds: ["lead-mark"], status: "rejected", start: -45, due: 6, assigned: -45,
        rejections: [
            { ...rejection("rej-12-1", 20, "The recline mechanism sticks halfway and the leather is creased across the seat."), rejectedBy: "Mark Wilson" },
            { ...rejection("rej-12-2", 11, "The mechanism works now, but the leather is noticeably lighter than the approved swatch."), rejectedBy: "Mark Wilson" },
            { ...rejection("rej-12-3", 3, "The replacement leather still doesn't match the swatch, and there's a tear near the left armrest seam."), rejectedBy: "Mark Wilson" },
        ] },
    { title: "Rattan Patio Set", specialities: ["outdoor-furniture"], manufacturerIds: ["mfr-vava"], amount: 690000, projectLeadIds: ["lead-austin"], status: "in-progress", start: -15, due: 28, assigned: -15, stepsDone: 3 },
    { title: "Oak Dining Table", specialities: ["wood"], manufacturerIds: ["mfr-oak"], amount: 350000, projectLeadIds: ["lead-joke"], status: "pending", start: 5, due: 50 },
    // Rejected once — back with the manufacturer to fix
    { title: "Upholstered Headboard", specialities: ["upholstery", "beds"], manufacturerIds: ["mfr-majeurs"], amount: 275000, projectLeadIds: ["lead-latade"], status: "rejected", start: -50, due: 9, assigned: -50,
        rejections: [rejection("rej-15-1", 1, "The fabric colour doesn't match the approved sample and the stitching along the top edge is uneven. Please redo the upholstery with the approved fabric.")] },
    { title: "4 Leather Lounge Chairs", specialities: ["leather", "chairs-seating"], manufacturerIds: ["mfr-leather", "mfr-majeurs"], amount: 960000, projectLeadIds: ["lead-latade", "lead-mercury"], status: "in-progress", start: -8, due: 42, assigned: -8, stepsDone: 2, attachments: [{ name: "Lounge Chair Spec.pdf", url: "/lounge-chair-spec.pdf", kind: "document" }, { name: "Lounge chair.webp", url: "/sample-image/sarki-chair.webp", kind: "image" }] },
    // Pending with no manufacturer yet
    { title: "Modular Sectional Sofa", specialities: ["sofas", "upholstery"], manufacturerIds: [], amount: 850000, projectLeadIds: ["lead-latade"], status: "pending", start: 7, due: 49 },
    { title: "Carved Oak Executive Desk", specialities: ["desks", "wood"], manufacturerIds: ["mfr-kesino"], amount: 720000, projectLeadIds: ["lead-austin"], status: "in-progress", start: -9, due: 26, assigned: -9, stepsDone: 2 },
    { title: "Chesterfield Leather Sofa", specialities: ["leather", "sofas"], manufacturerIds: ["mfr-majeurs"], amount: 1100000, projectLeadIds: ["lead-mark"], status: "in-progress", start: -14, due: 42, assigned: -14, stepsDone: 2 },
    { title: "Low Slate TV Console", specialities: ["cabinetry"], manufacturerIds: ["mfr-oak"], amount: 390000, projectLeadIds: ["lead-joke"], status: "completed", start: -40, due: -8, assigned: -40 },
    { title: "6 Bar Stools", specialities: ["chairs-seating"], manufacturerIds: ["mfr-vava"], amount: 240000, projectLeadIds: ["lead-ted"], status: "in-review", start: -21, due: 5, assigned: -21 },
    // In progress, after an approved extension
    { title: "Kids' Bunk Bed", specialities: ["beds", "wood"], manufacturerIds: ["mfr-kesino"], amount: 330000, projectLeadIds: ["lead-latade"], status: "in-progress", start: -11, due: 30, assigned: -11, stepsDone: 2,
        extensionRequests: [
            { id: "ext-22-1", previousDueDate: daysFromNow(16), requestedDueDate: daysFromNow(30), reason: "The client changed the ladder to a staircase with storage, which adds about two weeks.", requestedAt: daysFromNow(-6), status: "approved", decidedAt: daysFromNow(-5) },
        ] },
    { title: "Reception Counter", specialities: ["cabinetry", "wood"], manufacturerIds: ["mfr-oak"], amount: 880000, projectLeadIds: ["lead-mercury"], status: "pending", start: 10, due: 60 },
    { title: "12 Conference Chairs", specialities: ["chairs-seating", "leather"], manufacturerIds: ["mfr-leather"], amount: 1320000, projectLeadIds: ["lead-austin"], status: "in-progress", start: -16, due: 24, assigned: -16, stepsDone: 4 },
];

/**
 * When sample job `index` was created — one a day going back, at a fixed
 * time of day so the generated code is the same on the server and in the
 * browser.
 */
function sampleCreatedAt(index: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - index);
    date.setHours(9 + (index % 8), (index * 7) % 60, (index * 13) % 60, 0);
    return date;
}

const ALL_STEP_KEYS = JOB_PRODUCTION_STEPS.map((step) => step.key);

export const ADMIN_JOBS: AdminJob[] = JOB_SEEDS.map((seed, index) => {
    const category = seed.specialities[0];
    const leadName = getProjectLead(seed.projectLeadIds[0])?.name ?? "Latade Dipe";
    const createdAt = sampleCreatedAt(index).toISOString();
    const dateAssigned = seed.assigned === undefined ? null : daysFromNow(seed.assigned);
    // Work that's been through review has every step done and photos in
    const hasSubmitted = ["in-review", "rejected", "completed"].includes(seed.status);

    return {
        id: `job-${index + 1}`,
        code: generateJobCode(category, sampleCreatedAt(index)),
        title: seed.title,
        category,
        manufacturerIds: seed.manufacturerIds,
        amount: seed.amount,
        projectLeadIds: seed.projectLeadIds,
        startDate: daysFromNow(seed.start),
        dueDate: daysFromNow(seed.due),
        dateAssigned,
        status: seed.status,
        description: `A short description of the ${seed.title.toLowerCase()} job, with any finishes, sizes and delivery notes.`,
        attachments: seed.attachments ?? [{ name: "Job Spec.pdf", url: "/job-spec.pdf", kind: "document" }],
        notes: seed.notes ?? [],
        // Listed newest first under "All", in seed order
        createdAt,
        completedStepKeys: hasSubmitted ? ALL_STEP_KEYS : ALL_STEP_KEYS.slice(0, seed.stepsDone ?? 0),
        completionImageUrls: hasSubmitted ? [CATEGORY_PHOTOS[category], "/images/image1.png"] : [],
        submittedForReviewAt: hasSubmitted ? minutesAgo(60 * (2 + index)) : null,
        rejections: seed.rejections ?? [],
        extensionRequests: seed.extensionRequests ?? [],
        assignmentHistory:
            seed.assignmentHistory ??
            (seed.manufacturerIds.length > 0
                ? [
                      {
                          id: `asg-${index + 1}-1`,
                          manufacturerIds: seed.manufacturerIds,
                          assignedBy: leadName,
                          assignedAt: createdAt,
                          outcome: seed.status === "pending" ? "awaiting" : "accepted",
                          outcomeAt: dateAssigned,
                      },
                  ]
                : []),
        manufacturerReview: seed.manufacturerReview ?? null,
    };
});
