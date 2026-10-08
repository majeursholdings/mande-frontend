import type { SelectOption } from "@/components/form/types";
import type { SelectFilterItem } from "@/components/customTable/types";
import type { StatusTone } from "@/components/customTable/statusBadge";
import { getCountryName } from "@/constant/africanCountries";
import { getTimeAgoLabel } from "@/lib/date";
import { type BillingCycle } from "@/constant/plans";
import {
    JOB_PRODUCTION_STEPS,
    MAX_JOB_REJECTIONS,
    getApprovedStepKeys,
    getAutoApproveAt,
    getJobPayments,
    settleStepSubmissions,
    type JobFaultReport,
    type JobPaymentInput,
    type StepSubmission,
} from "@/constant/jobWorkflow";
import {
    getJobRecordCharges,
    getJobRecordPayouts,
    getManufacturerShare,
    getProjectLead,
    type DocumentVerification,
    type JobRecord,
    type ManufacturerAddress,
    type ManufacturerBankAccount,
    type ManufacturerNinCard,
    type ManufacturerRecord,
    type ManufacturerSecurity,
    type SupportFeedbackRecord,
    type TimelineExtensionRecord,
    type TwoFactorMethod,
} from "@/constant/platformRecords";
import {
    LayoutGrid,
    ListChecks,
    ReceiptText,
    Star,
    UserRound,
    type LucideIcon,
} from "lucide-react";
import { DEFAULT_IMAGE } from "@/constant/global";

export type RegistrationStep = {
    label: string;
};

export const REGISTRATION_STEPS: RegistrationStep[] = [
    { label: "User details" },
    { label: "Verify email" },
    { label: "Choose a plan" },
    { label: "About company & documents" },
    { label: "Company specifications" },
];


export const STAFF_RANGE_OPTIONS: SelectOption[] = [
    { label: "1 to 10", value: "1-10" },
    { label: "11 to 20", value: "11-20" },
    { label: "21 to 30", value: "21-30" },
    { label: "31 to 50", value: "31-50" },
    { label: "51 and above", value: "51+" },
];

export const COMPANY_SPECIALITY_OPTIONS: SelectOption[] = [
    { label: "Beds", value: "beds" },
    { label: "Desks", value: "desks" },
    { label: "Chairs & Seating", value: "chairs-seating" },
    { label: "Sofas", value: "sofas" },
    { label: "Leather", value: "leather" },
    { label: "Wood", value: "wood" },
    { label: "Upholstery", value: "upholstery" },
    { label: "Cabinetry", value: "cabinetry" },
    { label: "Outdoor Furniture", value: "outdoor-furniture" },
];

export const MAX_COMPANY_SPECIALITIES = 3;

export const PRODUCTION_LEAD_TIME_OPTIONS: SelectOption[] = [
    { label: "1 to 2 weeks", value: "1-2-weeks" },
    { label: "3 to 4 weeks", value: "3-4-weeks" },
    { label: "5 to 8 weeks", value: "5-8-weeks" },
    { label: "9 weeks and above", value: "9-weeks-plus" },
];

export const MATERIALS_INVENTORY_OPTIONS: SelectOption[] = [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
];


// ─────────────────────────────────────────────────────────────────────────────
// Manufacturer dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const MANUFACTURER_DASHBOARD_URL = "/manufacturer/dashboard";
export const MANUFACTURER_JOBS_URL = "/manufacturer/jobs";
export const MANUFACTURER_TIMELINE_URL = "/manufacturer/timeline";
export const MANUFACTURER_FILES_URL = "/manufacturer/files";
export const MANUFACTURER_TRANSACTIONS_URL = "/manufacturer/transactions";
export const MANUFACTURER_REVIEWS_URL = "/manufacturer/reviews";
export const MANUFACTURER_PROFILE_URL = "/manufacturer/profile";
// Reached from the profile page
export const MANUFACTURER_SETTINGS_URL = "/manufacturer/profile/settings";
/** Opens Settings on the Plan tab — where "Upgrade" links go. */
export const MANUFACTURER_PLAN_SETTINGS_URL = `${MANUFACTURER_SETTINGS_URL}?tab=plan`;
export const MANUFACTURER_SECURITY_URL = "/manufacturer/profile/security";
export const MANUFACTURER_COMMUNITY_URL = "/manufacturer/profile/community";
export const MANUFACTURER_LEGAL_URL = "/manufacturer/profile/legal";
export const MANUFACTURER_SUPPORT_URL = "/manufacturer/profile/support";
/** Every notification, newest first: the bell shows only the newest few. */
export const MANUFACTURER_NOTIFICATIONS_URL = "/manufacturer/profile/notifications";

export type ManufacturerNavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

// Timeline and Files are left out of the menu for now — their "coming soon"
// routes still exist.
export const MANUFACTURER_NAV_ITEMS: ManufacturerNavItem[] = [
    { label: "Dashboard", href: MANUFACTURER_DASHBOARD_URL, icon: LayoutGrid },
    { label: "Jobs", href: MANUFACTURER_JOBS_URL, icon: ListChecks },
    { label: "Transactions", href: MANUFACTURER_TRANSACTIONS_URL, icon: ReceiptText },
    { label: "Reviews", href: MANUFACTURER_REVIEWS_URL, icon: Star },
    { label: "Profile", href: MANUFACTURER_PROFILE_URL, icon: UserRound },
];

export type ManufacturerBackLink = {
    label: string;
    href: string;
};

export const MANUFACTURER_PROFILE_BACK_LINK: ManufacturerBackLink = {
    label: "Back to Profile",
    href: MANUFACTURER_PROFILE_URL,
};

export const MANUFACTURER_LEGAL_BACK_LINK: ManufacturerBackLink = {
    label: "Back to Legal information",
    href: MANUFACTURER_LEGAL_URL,
};

// Most specific first — a legal document's page goes back to the legal list
const SUBPAGE_BACK_LINKS: { path: string; matchChildren?: boolean; link: ManufacturerBackLink }[] = [
    { path: MANUFACTURER_LEGAL_URL, matchChildren: true, link: MANUFACTURER_LEGAL_BACK_LINK },
    { path: MANUFACTURER_SETTINGS_URL, link: MANUFACTURER_PROFILE_BACK_LINK },
    { path: MANUFACTURER_SECURITY_URL, link: MANUFACTURER_PROFILE_BACK_LINK },
    { path: MANUFACTURER_COMMUNITY_URL, link: MANUFACTURER_PROFILE_BACK_LINK },
    { path: MANUFACTURER_LEGAL_URL, link: MANUFACTURER_PROFILE_BACK_LINK },
    { path: MANUFACTURER_SUPPORT_URL, link: MANUFACTURER_PROFILE_BACK_LINK },
    { path: MANUFACTURER_NOTIFICATIONS_URL, link: MANUFACTURER_PROFILE_BACK_LINK },
];

/**
 * The "Back to …" link for a sub-page — on mobile it replaces the top bar's
 * logo, search and notifications; on desktop it sits above the page title.
 * Null for top-level pages.
 */
export function getSubpageBackLink(pathname: string): ManufacturerBackLink | null {
    const match = SUBPAGE_BACK_LINKS.find(({ path, matchChildren }) =>
        matchChildren ? pathname.startsWith(`${path}/`) : pathname === path,
    );
    return match?.link ?? null;
}

export type JobStatus =
    | "pending"
    | "in-progress"
    | "in-review"
    | "completed"
    | "cancelled"
    /** The finished work was sent for review and turned down by an admin. */
    | "rejected";

// ─────────────────────────────────────────────────────────────────────────────
// Job production steps (see constant/jobWorkflow.ts) — the manufacturer sends
// photo proof of each one, in order, from the job detail panel, and the
// project lead approves it or sends it back. Once every step is approved,
// they upload the finished furniture, which sends the job for review.
//
// Each time an admin rejects the finished work, a "Rejected" step (recorded by
// the admin) and a "Redeliver" step (completed when the manufacturer resubmits
// with new photo proof) are appended. These are derived from the job's
// rejection history rather than stored — see getJobSteps below. A job can be
// rejected at most MAX_JOB_REJECTIONS times; after the last one it can't be
// resubmitted, so no "Redeliver" step follows it.
// ─────────────────────────────────────────────────────────────────────────────

export { JOB_PRODUCTION_STEPS };
export type { ProductionStepKey } from "@/constant/jobWorkflow";

export type ProductionStep = {
    /** A ProductionStepKey, or a derived rejection step key like "rejected-2". */
    key: string;
    label: string;
    /** "danger" renders the completed step in red with an X instead of a check. */
    tone?: "danger";
};

export { MAX_JOB_REJECTIONS };


export type JobAssignee = {
    name: string;
    role: string;
    phone: string;
};


export type JobAttachment = {
    name: string;
    url: string;
};

export type JobRejection = {
    reason: string;
    /** ISO date string the admin rejected the work. */
    rejectedAt: string;
    /** The submitted photos this rejection was for. */
    imageUrls: string[];
};

/**
 * Every step to show for a job — the fixed production steps, then a
 * "Rejected" + "Redeliver" pair per rejection — plus how many of them are
 * done (steps are always completed in order, so that's a prefix).
 */
export function getJobSteps({
    stepSubmissions,
    rejections,
    status,
}: {
    stepSubmissions: StepSubmission[];
    rejections: JobRejection[];
    status: JobStatus;
}): { steps: ProductionStep[]; completedCount: number } {
    const steps: ProductionStep[] = [...JOB_PRODUCTION_STEPS];
    let completedCount = getApprovedStepKeys(stepSubmissions).length;
    const numbered = rejections.length > 1;

    rejections.forEach((_, index) => {
        const n = index + 1;
        const suffix = numbered ? ` #${n}` : "";
        steps.push({ key: `rejected-${n}`, label: `Rejected${suffix}`, tone: "danger" });
        completedCount += 1;

        // No resubmission is allowed after the final rejection
        if (n >= MAX_JOB_REJECTIONS) return;
        steps.push({ key: `redeliver-${n}`, label: `Redeliver${suffix}` });
        // Redelivered if a later rejection exists, or it's been resubmitted
        // since the latest one (i.e. the job has moved on from "rejected")
        const isLatest = n === rejections.length;
        if (!isLatest || status !== "rejected") completedCount += 1;
    });

    return { steps, completedCount };
}

export type Job = {
    id: string;
    code: string;
    title: string;
    description: string;
    assignedLabel: string;
    /** Days since assignment, used only for the "Date assigned" sort. Unassigned jobs sort last. */
    assignedDaysAgo: number | null;
    /** ISO date string, null for jobs yet to be assigned a start date. */
    dateAssigned: string | null;
    /** ISO date the work is planned to start. Null if none was set. */
    startDate: string | null;
    /** ISO date string the job is due. */
    dueDate: string;
    commentCount: number;
    /** What the manufacturer is paid for the job, in naira. */
    price: number;
    /** A COMPANY_SPECIALITY_OPTIONS value, e.g. "upholstery". */
    category: string;
    imageUrl?: string;
    deliveryLocation?: { city: string; state: string } | null;
    status: JobStatus;
    assignee: JobAssignee | null;
    attachments: JobAttachment[];
    /** Proof sent of each production step, and how it was reviewed — oldest first. */
    stepSubmissions: StepSubmission[];
    /** The latest finished-furniture photo(s) the manufacturer submitted. */
    completionImageUrls?: string[];
    /** ISO date the finished furniture was last sent for review. */
    submittedForReviewAt?: string | null;
    /** Every time an admin rejected the work, oldest first (max MAX_JOB_REJECTIONS). */
    rejections?: JobRejection[];
    /** ISO date the job was signed off. */
    completedAt?: string | null;
    /** A fault found in the days after sign-off, which cancels the bonus. */
    faultReport?: JobFaultReport | null;
    /** Their requests for a later due date, newest first. */
    extensionRequests: TimelineExtensionRecord[];
    /** The job's project lead — a project lead's id, who they rate once it's completed. Null before one's set. */
    leadId: string | null;
    /** Their rating of the project lead, once they've given it. */
    leadReview: { rating: number; comment: string; createdAt: string } | null;
    /** The lead rated the finished work 3 stars or less: a super admin is taking a second look before it's signed off. */
    isHeldForReview: boolean;
};

/** What a job's payments are worked out from (see constant/jobWorkflow.ts). */
export function getJobPaymentInput(
    job: Pick<Job, "price" | "dueDate" | "dateAssigned" | "stepSubmissions" | "completedAt" | "rejections" | "faultReport">,
): JobPaymentInput {
    return {
        amount: job.price,
        dueDate: job.dueDate,
        acceptedAt: job.dateAssigned,
        stepSubmissions: job.stepSubmissions,
        signedOffAt: job.completedAt ?? null,
        rejectionCount: job.rejections?.length ?? 0,
        faultReport: job.faultReport ?? null,
    };
}

/**
 * The job with every auto-approval that's come due by `now` applied — step
 * proof, and finished work, left unreviewed for a day (not counting Sundays).
 */
export function settleJob<
    T extends Pick<Job, "status" | "stepSubmissions" | "submittedForReviewAt" | "completedAt"> &
        Partial<Pick<Job, "isHeldForReview">>,
>(job: T, now: Date = new Date()): T {
    const settled = { ...job, stepSubmissions: settleStepSubmissions(job.stepSubmissions, now) };
    // Held for further review: waiting for a super admin, not the clock
    if (job.status !== "in-review" || !job.submittedForReviewAt || job.isHeldForReview) return settled;
    const approveAt = getAutoApproveAt(job.submittedForReviewAt);
    return approveAt <= now ? { ...settled, status: "completed", completedAt: approveAt.toISOString() } : settled;
}


export const JOB_STATUS_ORDER: JobStatus[] = [
    "pending",
    "in-progress",
    "in-review",
    "completed",
    "cancelled",
    "rejected",
];

export const JOB_STATUS_CONFIG: Record<
    JobStatus,
    { label: string; badgeLabel: string; tone: StatusTone; dotClass: string }
> = {
    pending: { label: "Pending", badgeLabel: "Pending", tone: "gray", dotClass: "bg-mist-900" },
    "in-progress": {
        label: "In Progress",
        badgeLabel: "In progress",
        tone: "indigo",
        dotClass: "bg-indigo-500",
    },
    "in-review": {
        label: "In Review",
        badgeLabel: "In review",
        tone: "amber",
        dotClass: "bg-amber-500",
    },
    completed: {
        label: "Completed",
        badgeLabel: "Completed",
        tone: "green",
        dotClass: "bg-primary-500",
    },
    cancelled: {
        label: "Cancelled",
        badgeLabel: "Job cancelled",
        tone: "red",
        dotClass: "bg-secondary-500",
    },
    rejected: {
        label: "Rejected",
        badgeLabel: "Rejected",
        tone: "red",
        dotClass: "bg-red-600",
    },
};

/** A jobs page tab/filter — every job, or just one status. */
export type JobsFilter = "all" | JobStatus;

export const JOBS_FILTER_ORDER: JobsFilter[] = ["all", ...JOB_STATUS_ORDER];

export function getJobsFilterLabel(filter: JobsFilter): string {
    return filter === "all" ? "All" : JOB_STATUS_CONFIG[filter].label;
}

/** "upholstery" → "Upholstery" — job categories share the registration speciality list. */
export function getJobCategoryLabel(category: string): string {
    return COMPANY_SPECIALITY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}

export const JOB_SORT_OPTIONS: SelectFilterItem[] = [
    { label: "Name", value: "name" },
    { label: "Date assigned", value: "date" },
    { label: "Due date", value: "due-date" },
    { label: "Category", value: "category" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The signed-in manufacturer's latest offer of a job — null if it was never
 * offered to them, or was withdrawn before they answered.
 */
function getOwnAssignment(record: JobRecord, manufacturerId: string) {
    const assignment = record.assignmentHistory.find((candidate) =>
        candidate.manufacturerIds.includes(manufacturerId),
    );
    return assignment && assignment.outcome !== "reassigned" ? assignment : null;
}

/**
 * A job as the signed-in manufacturer sees it: offered to them (pending),
 * taken on (its status and progress), or turned down (cancelled).
 */
function toManufacturerJob(
    record: JobRecord,
    outcome: "awaiting" | "accepted" | "declined",
    manufacturerId: string,
): Job {
    const isTheirs = outcome === "accepted";
    const dateAssigned = isTheirs ? record.dateAssigned : null;
    const lead = getProjectLead(record.projectLeadIds[0]);
    const leadReview = record.leadReviews.find((review) => review.manufacturerId === manufacturerId);
    return {
        id: record.id,
        code: record.code,
        title: record.title,
        description: record.description,
        assignedLabel: dateAssigned ? `Assigned ${getTimeAgoLabel(new Date(dateAssigned))}` : "Yet to be assigned",
        assignedDaysAgo: dateAssigned ? Math.floor((Date.now() - new Date(dateAssigned).getTime()) / DAY_MS) : null,
        dateAssigned,
        startDate: record.startDate,
        dueDate: record.dueDate,
        commentCount: record.notes.length,
        price: getManufacturerShare(record, manufacturerId),
        category: record.category,
        imageUrl: record.imageUrl || DEFAULT_IMAGE,
        deliveryLocation: record.deliveryLocation ? { city: record.deliveryLocation.city, state: record.deliveryLocation.state } : null,
        status: outcome === "awaiting" ? "pending" : isTheirs ? record.status : "cancelled",
        // Who they call about the job — its project lead
        assignee: lead ? { name: lead.name, role: "Project lead", phone: lead.phone } : null,
        attachments: record.attachments.map(({ name, url }) => ({ name, url })),
        stepSubmissions: isTheirs ? record.stepSubmissions : [],
        completionImageUrls: isTheirs ? record.completionImageUrls : [],
        submittedForReviewAt: isTheirs ? record.submittedForReviewAt : null,
        rejections: isTheirs
            ? record.rejections.map(({ reason, rejectedAt, submissionImageUrls }) => ({
                  reason,
                  rejectedAt,
                  imageUrls: submissionImageUrls,
              }))
            : [],
        completedAt: isTheirs ? record.completedAt : null,
        faultReport: isTheirs ? record.faultReport : null,
        extensionRequests: isTheirs ? record.extensionRequests : [],
        leadId: lead?.id ?? null,
        leadReview: isTheirs && leadReview ? { rating: leadReview.rating, comment: leadReview.comment, createdAt: leadReview.createdAt } : null,
        isHeldForReview: isTheirs && record.status === "in-review" && !!record.furtherReview,
    };
}

/** Every job offered to a manufacturer, as they see it, from the API's job `records`. */
export function getManufacturerJobs(manufacturerId: string, records: JobRecord[]): Job[] {
    return records.flatMap((record) => {
        const assignment = getOwnAssignment(record, manufacturerId);
        return assignment && assignment.outcome !== "reassigned"
            ? [toManufacturerJob(record, assignment.outcome, manufacturerId)]
            : [];
    });
}

/** Feedback as the manufacturer sees theirs — their own, so no need to say whose. */
export type ManufacturerFeedback = Omit<SupportFeedbackRecord, "manufacturerId">;

/**
 * Whether an assigned job still takes up one of the plan's concurrent job
 * slots — from assignment until it's completed, cancelled, or rejected for
 * the last time (when it can no longer be resubmitted).
 */
export function isActiveJob(job: Pick<Job, "status" | "rejections">): boolean {
    switch (job.status) {
        case "completed":
        case "cancelled":
            return false;
        case "rejected":
            return (job.rejections?.length ?? 0) < MAX_JOB_REJECTIONS;
        default:
            return true;
    }
}

/**
 * The jobs the manufacturer is working on — accepted and not yet signed off
 * (a rejected job goes back to them to fix) — what they're worth, and how
 * much of that is still to be paid as the jobs move (the bonus aside).
 */
export function getCurrentJobsWorth(
    jobs: Job[],
    now: Date = new Date(),
): { count: number; worth: number; stillToCome: number } {
    const current = jobs.filter((job) => job.status !== "pending" && isActiveJob(job));
    return current.reduce(
        (total, job) => ({
            count: total.count + 1,
            worth: total.worth + job.price,
            stillToCome:
                total.stillToCome +
                getJobPayments(getJobPaymentInput(job), now)
                    .payments.filter((payment) => !payment.releasedAt)
                    .reduce((sum, payment) => sum + payment.amount, 0),
        }),
        { count: 0, worth: 0, stillToCome: 0 },
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Open jobs — posted to every manufacturer, who can apply for them. An
// application takes up one of the plan's concurrent job slots (as does every
// active job) until it's withdrawn or turned down; if it's accepted, the job
// is assigned to the manufacturer and keeps the slot as an active job.
// ─────────────────────────────────────────────────────────────────────────────

/** The jobs page's two tabs — open jobs to apply for, and the manufacturer's own assigned jobs. */
export type JobsPageTab = "open" | "active";

export const MANUFACTURER_ACTIVE_JOBS_URL = `${MANUFACTURER_JOBS_URL}?tab=active`;

export type OpenJob = {
    id: string;
    code: string;
    title: string;
    description: string;
    /** A COMPANY_SPECIALITY_OPTIONS value, e.g. "upholstery". */
    category: string;
    /** What the manufacturer is paid for the job, in naira. */
    price: number;
    /** ISO date the work is planned to start. */
    startDate: string;
    /** ISO date the finished furniture is due. */
    dueDate: string;
    /** ISO date the job was posted. */
    postedAt: string;
    /** A photo of the furniture to make — every open job has one. */
    imageUrl: string;
    deliveryLocation?: { city: string; state: string } | null;
    attachments: JobAttachment[];
    hasApplied?: boolean;
};

export const OPEN_JOB_SORT_OPTIONS: SelectFilterItem[] = [
    { label: "Name", value: "name" },
    { label: "Date posted", value: "date" },
    { label: "Due date", value: "due-date" },
    { label: "Category", value: "category" },
    { label: "Pay", value: "price" },
];

export type JobApplication = {
    /** An OPEN_JOBS id. */
    jobId: string;
    /** ISO date the manufacturer applied. */
    appliedAt: string;
};

export type NotificationItem = {
    id: string;
    message: string;
    href?: string;
    linkLabel?: string;
    timestamp: string;
    isRead: boolean;
    /** Sender's name, rendered as an initials avatar. Omit for a system notification. */
    avatarName?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Manufacturer profile — the signed-in manufacturer's account and company
// details, wallet (balance, bank account, transactions) and reviews, as
// the API returns them. The EMPTY_* shapes are what a brand-new account (or
// one still loading) looks like — every profile screen has an empty state.
// ─────────────────────────────────────────────────────────────────────────────



export type ManufacturerProfile = {
    firstName: string;
    lastName: string;
    /** Sign-in email — shown on the edit page, but can't be changed there. */
    email: string;
    phoneNumber: string;
    /** ISO date. Null until set. */
    dateOfBirth: string | null;
    /** Profile photo URL. Null shows the initials avatar instead. */
    avatarUrl: string | null;
    /** ISO date the account was created. Null hides the "Joined" line. */
    joinedAt: string | null;
    /** Set at registration; can't be changed from the profile. */
    companyName: string;
    /** Empty until submitted (optional on the Solo plan). Can't be changed once submitted, unless it's rejected. */
    companyTaxNumber: string;
    /** Ignored while companyTaxNumber is empty. */
    companyTaxNumberVerification: DocumentVerification;
    /** Empty until submitted (optional on the Solo plan). Can't be changed once submitted, unless it's rejected. */
    businessLicenseNumber: string;
    /** Ignored while businessLicenseNumber is empty. */
    businessLicenseNumberVerification: DocumentVerification;
    companyAddress: ManufacturerAddress;
    /** COMPANY_SPECIALITY_OPTIONS values, e.g. "beds". Up to MAX_COMPANY_SPECIALITIES. */
    specialities: string[];
    /** A STAFF_RANGE_OPTIONS value, e.g. "21-30". Empty until set. */
    staffRange: string;
    /** A PRODUCTION_LEAD_TIME_OPTIONS value, e.g. "5-8-weeks". Empty until set. */
    productionLeadTime: string;
    /** The NIN card photo uploaded at sign-up (or re-uploaded after a rejection), and where it is in verification. */
    ninCard: ManufacturerNinCard;
    security: ManufacturerSecurity;
};

export type {
    DocumentVerification,
    ManufacturerAddress,
    ManufacturerBankAccount,
    ManufacturerNinCard,
    ManufacturerSecurity,
    SocialLoginProvider,
    TwoFactorMethod,
    VerificationStatus,
} from "@/constant/platformRecords";

export const PENDING_VERIFICATION: DocumentVerification = { status: "pending", rejectionReason: null };

/**
 * A document's verification once `newValue` is saved over `savedValue` — a
 * new or changed value goes back to waiting to be checked.
 */
export function getVerificationAfterSave(
    savedValue: string,
    newValue: string,
    verification: DocumentVerification,
): DocumentVerification {
    return newValue === savedValue ? verification : PENDING_VERIFICATION;
}


export const EMPTY_MANUFACTURER_PROFILE: ManufacturerProfile = {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: null,
    avatarUrl: null,
    joinedAt: null,
    companyName: "",
    companyTaxNumber: "",
    companyTaxNumberVerification: PENDING_VERIFICATION,
    businessLicenseNumber: "",
    businessLicenseNumberVerification: PENDING_VERIFICATION,
    companyAddress: { streetAddress: "", city: "", state: "", country: "" },
    specialities: [],
    staffRange: "",
    productionLeadTime: "",
    ninCard: { imageUrl: null, ...PENDING_VERIFICATION },
    security: {
        linkedAccounts: { google: null, facebook: null },
        twoFactorMethod: null,
    },
};

/** A manufacturer's record in the shape the profile and settings pages use. */
export function toManufacturerProfile(record: ManufacturerRecord): ManufacturerProfile {
    return {
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        phoneNumber: record.phone,
        dateOfBirth: record.dateOfBirth,
        avatarUrl: record.avatarUrl,
        joinedAt: record.joinedAt,
        companyName: record.companyName,
        companyTaxNumber: record.companyTaxNumber,
        companyTaxNumberVerification: record.companyTaxNumberVerification,
        businessLicenseNumber: record.businessLicenseNumber,
        businessLicenseNumberVerification: record.businessLicenseNumberVerification,
        companyAddress: record.address,
        specialities: record.specialities,
        staffRange: record.staffRange,
        productionLeadTime: record.productionLeadTime,
        ninCard: record.ninCard,
        security: record.security,
    };
}

/**
 * Where a one-time code for a sensitive action (password change, withdrawal)
 * comes from — the authenticator app if that's the manufacturer's
 * two-factor method, otherwise their email.
 */
export function getOtpChannel(profile: Pick<ManufacturerProfile, "security">): TwoFactorMethod {
    return profile.security.twoFactorMethod === "app" ? "app" : "email";
}

/** Whether both the company tax number and business license number are on file. */
export function hasBusinessDocuments(
    profile: Pick<ManufacturerProfile, "companyTaxNumber" | "businessLicenseNumber">,
): boolean {
    return !!profile.companyTaxNumber.trim() && !!profile.businessLicenseNumber.trim();
}

/** "Demi" + "Semande" → "Demi Semande". Empty when neither name is set. */
export function getManufacturerFullName(
    profile: Pick<ManufacturerProfile, "firstName" | "lastName">,
): string {
    return [profile.firstName, profile.lastName]
        .map((name) => name.trim())
        .filter(Boolean)
        .join(" ");
}

/** "20, Peacock Drive, Lekki, Lagos, Nigeria" — empty when no part of the address is set. */
export function formatAddress(address: ManufacturerAddress): string {
    return [address.streetAddress, address.city, address.state, getCountryName(address.country)]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(", ");
}

/** "21-30" → "21 to 30". Empty for an unset value; an unknown one is shown as-is. */
export function getOptionLabel(options: SelectOption[], value: string): string {
    return options.find((option) => option.value === value)?.label ?? value;
}

export type ManufacturerTransaction = {
    id: string;
    /**
     * "payment" is money in for a job. Money out: "withdrawal" to the bank
     * account, "subscription" for a plan paid from the wallet balance,
     * "charge" when their finished work on a job was rejected.
     */
    type: "payment" | "withdrawal" | "subscription" | "charge";
    /** e.g. "First installment", or "Withdrawal". */
    label: string;
    /** Title of the job a payment is for. Null for withdrawals and plans. */
    projectName: string | null;
    /** ISO date of the transaction. */
    date: string;
    /** In naira — always positive; `type` says which way it went. */
    amount: number;
    /**
     * A plan paid by card, not from the balance — so not a wallet
     * transaction. Only admins see these (see getManufacturerTransactions).
     */
    paidByCard?: boolean;
};

export const TRANSACTION_SORT_OPTIONS: SelectFilterItem[] = [
    { label: "Project name", value: "project-name" },
    { label: "Date", value: "date" },
    { label: "Amount", value: "amount" },
];

/**
 * A manufacturer's job money, newest first, worked out from `records`: every
 * payment made to them for a job, and every charge for rejected work.
 * Withdrawals and plan payments aren't in the jobs, so they're not here: the
 * wallet and reports APIs have the full ledger.
 */
export function getManufacturerTransactions(manufacturerId: string, records: JobRecord[]): ManufacturerTransaction[] {
    return [
        ...records
            .flatMap((record) => getJobRecordPayouts(record))
            .filter((payout) => payout.manufacturerId === manufacturerId)
            .map(
                (payout): ManufacturerTransaction => ({
                    id: payout.id,
                    type: "payment",
                    label: payout.label,
                    projectName: payout.jobTitle,
                    date: payout.paidAt,
                    amount: payout.amount,
                }),
            ),
        ...records
            .flatMap((record) => getJobRecordCharges(record))
            .filter((charge) => charge.manufacturerId === manufacturerId)
            .map(
                (charge): ManufacturerTransaction => ({
                    id: charge.id,
                    type: "charge",
                    label: "Rejection charge",
                    projectName: charge.jobTitle,
                    date: charge.chargedAt,
                    amount: charge.amount,
                }),
            ),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a.id.localeCompare(b.id));
}

export type TransactionSummary = {
    /** Paid in for jobs. */
    earned: number;
    withdrawn: number;
    /** Plans paid for — from the balance or by card. */
    subscriptions: number;
    /** Charged for rejected work. */
    charges: number;
    /** What's left in the wallet: earned, less withdrawals, charges and plans paid from the balance. */
    balance: number;
    counts: Record<ManufacturerTransaction["type"], number>;
};

/** The totals of a set of transactions — one manufacturer's, or everyone's. */
export function getTransactionSummary(transactions: ManufacturerTransaction[]): TransactionSummary {
    const summary: TransactionSummary = {
        earned: 0,
        withdrawn: 0,
        subscriptions: 0,
        charges: 0,
        balance: 0,
        counts: { payment: 0, withdrawal: 0, subscription: 0, charge: 0 },
    };
    for (const transaction of transactions) {
        summary.counts[transaction.type] += 1;
        if (transaction.type === "payment") summary.earned += transaction.amount;
        else if (transaction.type === "withdrawal") summary.withdrawn += transaction.amount;
        else if (transaction.type === "charge") summary.charges += transaction.amount;
        else summary.subscriptions += transaction.amount;
        if (!transaction.paidByCard) {
            summary.balance += transaction.type === "payment" ? transaction.amount : -transaction.amount;
        }
    }
    return summary;
}

/** Account numbers are 10-digit NUBANs. */
export const BANK_ACCOUNT_NUMBER_LENGTH = 10;


export type ManufacturerWallet = {
    /** Available balance, in naira. */
    balance: number;
    /** Where withdrawals are paid out to. Null until one is added. */
    bankAccount: ManufacturerBankAccount | null;
    /** Newest first. */
    transactions: ManufacturerTransaction[];
};

export const EMPTY_MANUFACTURER_WALLET: ManufacturerWallet = {
    balance: 0,
    bankAccount: null,
    transactions: [],
};


export type ManufacturerReview = {
    id: string;
    /** Who left it — the job's project lead. */
    customerName: string;
    /** 1–5 stars. */
    rating: number;
    comment: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Subscription — the manufacturer's plan (a PRICING_PLANS id) and the cards
// saved for paying for it, as the API returns them.
// ─────────────────────────────────────────────────────────────────────────────

export type ManufacturerSubscription = {
    /** A PRICING_PLANS id, e.g. "workshop". */
    planId: string;
    billingCycle: BillingCycle;
    /**
     * "pending_payment": chosen at sign-up but never paid for. "past_due": the
     * period ended without a renewal. "cancelled": ended after a cancellation.
     * Only an active plan can be upgraded, downgraded or cancelled.
     */
    status: "active" | "past_due" | "pending_payment" | "cancelled";
    /** ISO date the current billing period ends and the plan renews. */
    renewsAt: string;
    /** Cancelled by the manufacturer — the plan stays active until renewsAt, then ends. */
    cancelAtPeriodEnd: boolean;
    /** A downgrade waiting to take effect at renewsAt. Null when none is scheduled. */
    scheduledPlanId: string | null;
};

export type SavedCard = {
    id: string;
    /** As the payment partner names it, e.g. "Visa", "Mastercard", "Verve". */
    brand: string;
    last4: string;
    /** "MM/YY" */
    expiry: string;
};

