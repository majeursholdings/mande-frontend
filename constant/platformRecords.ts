// ─────────────────────────────────────────────────────────────────────────────
// Platform records — the shapes of the jobs, manufacturers, project leads
// and payments the API returns, read the same way on both platforms, and the
// helpers that work on them (job codes, payouts, charges). The registries
// (registerManufacturers, registerProjectLeads) only ever hold what the API
// sent, so a record can be looked up by id anywhere. No records live here.
// ─────────────────────────────────────────────────────────────────────────────

import {
    MAX_JOB_REJECTIONS,
    getAutoApproveAt,
    getJobPayments,
    getRejectionCharge,
    settleStepSubmissions,
    type JobFaultReport,
    type JobPaymentInput,
    type JobPaymentMilestone,
    type ProductionStepKey,
    type StepSubmission,
} from "@/constant/jobWorkflow";
import type { DEFAULT_CURRENCY_CODE } from "@/constant/global";
import { requiresBusinessDocuments, type BillingCycle } from "@/constant/plans";
import type { SuperAdminRole } from "@/constant/superAdmin";


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

/** An admin — every admin can lead jobs. */
export type ProjectLeadRecord = {
    id: string;
    /** Set at sign-up — only a super admin can change it, as with the email. */
    firstName: string;
    lastName: string;
    /** firstName and lastName. */
    name: string;
    /** Their sign-in email, on the Mande domain (ADMIN_EMAIL_DOMAIN). */
    email: string;
    /** Asked for at sign-up; they can change it in Settings. */
    phone: string;
    /** An ADMIN_POSITION_OPTIONS value, chosen at sign-up. */
    position: string;
    /** Null shows a generated avatar. */
    avatarUrl: string | null;
    /** ISO date the account was created. */
    joinedAt: string;
    /** Null when two-factor authentication is off. */
    twoFactorMethod: TwoFactorMethod | null;
};

const DYNAMIC_PROJECT_LEADS = new Map<string, ProjectLeadRecord>();

export function registerProjectLeads(
    leads: Array<{
        id: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        position?: string | null;
        phone?: string | null;
        avatarUrl?: string | null;
        joined?: number;
        joinedAt?: string;
        twoFactorMethod?: TwoFactorMethod | null;
    }>
) {
    for (const lead of leads) {
        if (!lead || !lead.id) continue;
        const nameParts = (lead.name || "").trim().split(/\s+/);
        const firstName = lead.firstName || nameParts[0] || "Admin";
        const lastName = lead.lastName || nameParts.slice(1).join(" ") || "";
        const fullName = lead.name || `${firstName} ${lastName}`.trim();
        const existing = DYNAMIC_PROJECT_LEADS.get(lead.id);

        DYNAMIC_PROJECT_LEADS.set(lead.id, {
            id: lead.id,
            firstName,
            lastName,
            name: fullName,
            email: (lead as { email?: string }).email ?? existing?.email ?? "",
            phone: lead.phone ?? existing?.phone ?? "",
            avatarUrl: lead.avatarUrl ?? existing?.avatarUrl ?? null,
            position: lead.position || existing?.position || "quality-assurance-manager",
            joinedAt: lead.joinedAt ?? existing?.joinedAt ?? new Date().toISOString(),
            twoFactorMethod: lead.twoFactorMethod ?? existing?.twoFactorMethod ?? null,
        });
    }
}

export function getProjectLead(id: string): ProjectLeadRecord | undefined {
    return DYNAMIC_PROJECT_LEADS.get(id);
}

/**
 * A super admin — runs the platform: sees everything on it, looks after the
 * admins' accounts and decides account deletions. They don't lead jobs, so
 * they have no position; their role says what else they can do (see
 * SuperAdminRole).
 */
export type SuperAdminRecord = Omit<ProjectLeadRecord, "position"> & { role: SuperAdminRole };

/** Someone asked to become a super admin, who hasn't accepted yet. */
export type SuperAdminInviteRecord = {
    id: string;
    firstName: string;
    lastName: string;
    /** On the Mande domain (ADMIN_EMAIL_DOMAIN). */
    email: string;
    /** What they'll be once they accept. */
    role: SuperAdminRole;
    invitedBy: string;
    /** ISO date the latest invite email went out. */
    invitedAt: string;
};

// ─── Manufacturers ───────────────────────────────────────────────────────────

export type ManufacturerAddress = {
    streetAddress: string;
    city: string;
    state: string;
    /** ISO country code, e.g. "NG" — African countries only (see AFRICAN_COUNTRIES). */
    country: string;
};

/** Where a submitted document (NIN card, tax number, business license number) is in verification. */
export type VerificationStatus = "pending" | "processing" | "verified" | "rejected" | "manual_review";

export type DocumentVerification = {
    /**
     * "pending" once submitted, "processing" while it's being checked, and
     * "manual_review" when it needs a person to look at it — then "verified"
     * or "rejected". Submitting it again after a rejection puts it back to
     * "pending".
     */
    status: VerificationStatus;
    /** Why it was rejected, e.g. "The photo is too blurry to read." Null unless rejected. */
    rejectionReason: string | null;
};

export type ManufacturerNinCard = DocumentVerification & {
    /** Null when no photo has been uploaded. */
    imageUrl: string | null;
};

export type ManufacturerBankAccount = {
    /** The bank's code from the banking API's bank list, e.g. "058". */
    bankCode: string;
    bankName: string;
    accountNumber: string;
    /** The name the account is registered to, as returned by the bank lookup. */
    accountName: string;
    /** Only naira accounts are supported for now. */
    currency: typeof DEFAULT_CURRENCY_CODE;
};

/**
 * "flagged" — they can hold one job at a time; "suspended" — everything is
 * paused, and all they can do is send an appeal.
 */
export type ManufacturerAccountStatus = "active" | "flagged" | "suspended";

/**
 * An admin changing the account's status — flagging or suspending it, or
 * lifting a flag or suspension ("active" again).
 */
export type AccountStatusEventRecord = {
    status: ManufacturerAccountStatus;
    /** Why — the manufacturer sees it. */
    reason: string | null;
    by: string;
    /** ISO date. */
    at: string;
};

/**
 * A suspended manufacturer asking for the suspension to be lifted. Approving
 * it lifts the suspension; turning it down keeps it, and they can appeal
 * again.
 */
export type AccountAppealRecord = {
    id: string;
    message: string;
    attachments: JobAttachmentRecord[];
    /** ISO date. */
    sentAt: string;
    status: "pending" | "approved" | "declined";
    /** The admin's reply — why it was turned down, or a note with the approval. */
    response: string | null;
    decidedBy: string | null;
    /** ISO date. Null while pending. */
    decidedAt: string | null;
};

export type SocialLoginProvider = "google" | "facebook";

/** How the second step of two-factor authentication is done. */
export type TwoFactorMethod = "email" | "app";

export type ManufacturerSecurity = {
    /** Accounts linked for one-click login — the linked account's email, null when not linked. */
    linkedAccounts: Record<SocialLoginProvider, string | null>;
    /** Null when two-factor authentication is off. */
    twoFactorMethod: TwoFactorMethod | null;
};

/**
 * Something the manufacturer did to how they sign in, keep the account safe
 * or get paid — what admins see as the account's activity history.
 */
export type AccountActivityRecord = {
    id: string;
    /** ISO date. */
    at: string;
    /** Where it was done from, e.g. "Chrome on macOS · Lekki, Lagos". */
    device: string;
} & (
    | { type: "account-created" | "signed-in-new-device" | "password-changed" | "password-reset" | "phone-changed" }
    | { type: "social-linked" | "social-unlinked"; provider: SocialLoginProvider }
    /** "two-factor-changed" switches from one method to another. */
    | { type: "two-factor-enabled" | "two-factor-changed" | "two-factor-disabled"; method: TwoFactorMethod }
    | { type: "bank-added" | "bank-removed"; bankName: string; accountNumber: string }
);

/** An admin asking a super admin to delete the account — admins can't delete it themselves. */
export type DeletionRequestRecord = {
    reason: string;
    attachments: JobAttachmentRecord[];
    requestedBy: string;
    /** ISO date. */
    requestedAt: string;
};

export type ManufacturerRecord = {
    id: string;
    userId?: string | null;
    companyName: string;
    firstName: string;
    lastName: string;
    /** The person who runs the account — firstName and lastName. */
    contactName: string;
    email: string;
    phone: string;
    /** ISO date. Null until set. */
    dateOfBirth: string | null;
    /** Null shows the initials avatar. */
    avatarUrl: string | null;
    /** ISO date the account was created. */
    joinedAt: string;
    address: ManufacturerAddress;
    /** COMPANY_SPECIALITY_OPTIONS values, e.g. "beds". */
    specialities: string[];
    /** A STAFF_RANGE_OPTIONS value, e.g. "21-30". */
    staffRange: string;
    /** A PRODUCTION_LEAD_TIME_OPTIONS value, e.g. "5-8-weeks". */
    productionLeadTime: string;
    /** A MATERIALS_INVENTORY_OPTIONS value — whether they keep their own materials. */
    materialsInventory: string;
    ninCard: ManufacturerNinCard;
    /** Empty until submitted (optional on the Solo plan). */
    companyTaxNumber: string;
    companyTaxNumberVerification: DocumentVerification;
    /** Empty until submitted (optional on the Solo plan). */
    businessLicenseNumber: string;
    businessLicenseNumberVerification: DocumentVerification;
    subscription: {
        /** A PRICING_PLANS id. */
        planId: string;
        billingCycle: BillingCycle;
        /** ISO date the plan renews. */
        renewsAt: string;
        /** How renewals are paid — a saved card, or the wallet balance. The first payment, at sign-up, is always by card. */
        renewalsPaidFrom: "card" | "wallet";
    };
    /** Where withdrawals go. Null until one is added. */
    bankAccount: ManufacturerBankAccount | null;
    /** Sign-in settings — as the latest activity left them. */
    security: ManufacturerSecurity;
    /** Sign-ins, password, linked-account, two-factor and bank account changes — newest first. */
    activity: AccountActivityRecord[];
    accountStatus: ManufacturerAccountStatus;
    /** Every flag, suspension and lifting of one — newest first. */
    statusHistory: AccountStatusEventRecord[];
    /** Their appeals against a suspension — newest first. */
    appeals: AccountAppealRecord[];
    /** Waiting for a super admin. Null unless an admin has asked for it. */
    deletionRequest: DeletionRequestRecord | null;
};

const DYNAMIC_MANUFACTURERS = new Map<string, ManufacturerRecord>();

export function registerManufacturers(
    manufacturers: Array<{
        id: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        companyName?: string | null;
        phone?: string | null;
        email?: string | null;
        accountStatus?: ManufacturerAccountStatus;
        avatarUrl?: string | null;
        specialities?: string[];
        joinedAt?: string | null;
        subscription?: ManufacturerRecord["subscription"];
        [key: string]: unknown;
    }>,
) {
    for (const m of manufacturers) {
        if (!m || !m.id) continue;
        const existing = DYNAMIC_MANUFACTURERS.get(m.id);
        const companyName = m.companyName || existing?.companyName || m.name || "Manufacturer";
        const firstName = m.firstName || existing?.firstName || companyName;
        const lastName = m.lastName || existing?.lastName || "";
        const contactName = existing?.contactName || m.name || `${firstName} ${lastName}`.trim() || companyName;

        const sub = (m.subscription as ManufacturerRecord["subscription"]) || existing?.subscription;
        const planId = sub?.planId || ((m as Record<string, unknown>).planId as string) || "";
        const billingCycle =
            sub?.billingCycle ||
            (((m as Record<string, unknown>).billingCycle === "yearly" ? "annual" : "monthly") as BillingCycle) ||
            "monthly";
        const renewsAt = sub?.renewsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const renewalsPaidFrom = sub?.renewalsPaidFrom || "wallet";

        const record: ManufacturerRecord = {
            ...(existing ?? {}),
            id: m.id,
            userId: (m.userId as string) || existing?.userId || null,
            firstName,
            lastName,
            contactName,
            companyName,
            email: m.email || existing?.email || "",
            accountStatus: m.accountStatus || existing?.accountStatus || "active",
            phone: m.phone || existing?.phone || "",
            dateOfBirth: (m.dateOfBirth as string) || existing?.dateOfBirth || null,
            address: (m.address as ManufacturerRecord["address"]) || existing?.address || { streetAddress: "", city: "", state: "", country: "NG" },
            specialities: m.specialities || existing?.specialities || [],
            staffRange: (m.staffRange as string) || existing?.staffRange || "",
            productionLeadTime: (m.productionLeadTime as string) || existing?.productionLeadTime || "",
            materialsInventory: (m.materialsInventory as string) || existing?.materialsInventory || "",
            joinedAt: m.joinedAt || existing?.joinedAt || new Date().toISOString(),
            avatarUrl: m.avatarUrl || existing?.avatarUrl || null,
            ninCard: (m.ninCard as ManufacturerRecord["ninCard"]) || existing?.ninCard || { imageUrl: "", status: "pending", rejectionReason: null },
            companyTaxNumber: (m.companyTaxNumber as string) || existing?.companyTaxNumber || "",
            companyTaxNumberVerification: (m.companyTaxNumberVerification as ManufacturerRecord["companyTaxNumberVerification"]) || existing?.companyTaxNumberVerification || { status: "pending", rejectionReason: null },
            businessLicenseNumber: (m.businessLicenseNumber as string) || existing?.businessLicenseNumber || "",
            businessLicenseNumberVerification: (m.businessLicenseNumberVerification as ManufacturerRecord["businessLicenseNumberVerification"]) || existing?.businessLicenseNumberVerification || { status: "pending", rejectionReason: null },
            subscription: {
                planId,
                billingCycle,
                renewsAt,
                renewalsPaidFrom,
            },
            bankAccount: (m.bankAccount as ManufacturerRecord["bankAccount"]) || existing?.bankAccount || null,
            security: (m.security as ManufacturerRecord["security"]) || existing?.security || { twoFactorMethod: null, linkedAccounts: { google: null, facebook: null } },
            activity: (m.activity as ManufacturerRecord["activity"]) || existing?.activity || [],
            statusHistory: (m.statusHistory as ManufacturerRecord["statusHistory"]) || existing?.statusHistory || [],
            appeals: (m.appeals as ManufacturerRecord["appeals"]) || existing?.appeals || [],
            deletionRequest: (m.deletionRequest as ManufacturerRecord["deletionRequest"]) || existing?.deletionRequest || null,
        };
        DYNAMIC_MANUFACTURERS.set(m.id, record);
    }
}

export function getManufacturer(id: string): ManufacturerRecord | undefined {
    return DYNAMIC_MANUFACTURERS.get(id);
}

/** The flag or suspension the account is under now — null while it's active. */
export function getAccountHold(
    manufacturer: Pick<ManufacturerRecord, "accountStatus" | "statusHistory">,
): AccountStatusEventRecord | null {
    if (!manufacturer || manufacturer.accountStatus === "active") return null;
    const found = manufacturer.statusHistory?.find((event) => event.status === manufacturer.accountStatus);
    if (found) {
        return {
            ...found,
            by: found.by || (found as unknown as { byName?: string }).byName || "Admin",
        };
    }
    return {
        status: manufacturer.accountStatus,
        reason: null,
        by: "Admin",
        at: new Date().toISOString(),
    };
}

/**
 * Where a manufacturer's documents stand as a whole: rejected if any one
 * is, verified only once every one their plan needs is, otherwise the least
 * far along. The Solo plan doesn't need the tax or business license number.
 */
export function getManufacturerVerification(
    manufacturer: Pick<
        ManufacturerRecord,
        | "ninCard"
        | "subscription"
        | "companyTaxNumber"
        | "companyTaxNumberVerification"
        | "businessLicenseNumber"
        | "businessLicenseNumberVerification"
    >,
): VerificationStatus {
    const planId = manufacturer?.subscription?.planId ?? "growth";
    const needsBusinessDocuments = requiresBusinessDocuments(planId);
    const statuses: VerificationStatus[] = [manufacturer?.ninCard?.status ?? "pending"];
    if (manufacturer?.companyTaxNumber || needsBusinessDocuments) {
        if (manufacturer?.companyTaxNumberVerification?.status) {
            statuses.push(manufacturer.companyTaxNumberVerification.status);
        }
    }
    if (manufacturer?.businessLicenseNumber || needsBusinessDocuments) {
        if (manufacturer?.businessLicenseNumberVerification?.status) {
            statuses.push(manufacturer.businessLicenseNumberVerification.status);
        }
    }
    if (statuses.includes("rejected")) return "rejected";
    if (statuses.every((status) => status === "verified")) return "verified";
    if (statuses.includes("manual_review")) return "manual_review";
    if (statuses.includes("processing")) return "processing";
    return "pending";
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
export const JOB_DESCRIPTION_MAX_LENGTH = 500;

/** Where a job is in its lifecycle — see the top of this section. */
export type JobRecordStatus = "pending" | "in-progress" | "in-review" | "rejected" | "completed";

/**
 * A note, comment or feedback on a job — left by its project lead or the
 * manufacturer. Not a chat: no live updates or read receipts, just a
 * running record on the job.
 */
export type JobNoteRecord = {
    id: string;
    authorName: string;
    /** e.g. "Project lead", or the manufacturer's company name. */
    authorRole: string;
    message: string;
    /** ISO date. */
    createdAt: string;
};

export type JobAttachmentRecord = {
    name: string;
    url: string;
    /** A PDF document, or a photo/render of the furniture. */
    kind: "document" | "image";
    publicId?: string;
};

/** A lead turning down the finished work, with what needs fixing. */
export type JobRejectionRecord = {
    id: string;
    /** The lead's review — why, and what to fix. */
    reason: string;
    /** Optional photos or documents showing the problems. */
    attachments: JobAttachmentRecord[];
    rejectedBy: string;
    /** ISO date. */
    rejectedAt: string;
    /** The finished-furniture photos this rejection was about. */
    submissionImageUrls: string[];
};

/** A manufacturer asking for a later due date, e.g. after a delay. */
export type TimelineExtensionRecord = {
    id: string;
    /** ISO dates. */
    previousDueDate: string;
    requestedDueDate: string;
    reason: string;
    requestedAt: string;
    /** "pending" until the lead approves (the due date moves) or rejects it. */
    status: "pending" | "approved" | "rejected";
    decidedAt: string | null;
    /** The production step the job was on when the delay was reported. */
    step: ProductionStepKey | null;
};

/** One offer of the job to manufacturer(s). */
export type JobAssignmentRecord = {
    id: string;
    manufacturerIds: string[];
    assignedBy: string;
    /** ISO date. */
    assignedAt: string;
    /** Still waiting for an answer, taken on, turned down, or replaced by a reassignment. */
    outcome: "awaiting" | "accepted" | "declined" | "reassigned";
    outcomeAt: string | null;
};

/** A manufacturer's rating of the job's project lead, asked for as soon as the job is completed. */
export type LeadReviewRecord = {
    manufacturerId: string;
    /** A PROJECT_LEADS id — the job's (first) lead. */
    leadId: string;
    /** 1–5. */
    rating: number;
    comment: string;
    /** ISO date. */
    createdAt: string;
    /**
     * A low rating (under MIN_SIGN_OFF_RATING) waits for a super admin to
     * follow it up with the lead — what they did about it, once they have.
     */
    followUp?: { note: string; by: string; at: string } | null;
};

/** The lead's rating of the manufacturer once the job is completed. */
export type ManufacturerReviewRecord = {
    /** 1–5. */
    rating: number;
    comment: string;
    authorName: string;
    /** ISO date. */
    createdAt: string;
};

export type JobRecord = {
    id: string;
    code: string;
    title: string;
    /** A COMPANY_SPECIALITY_OPTIONS value — also part of the job code. */
    category: string;
    /** Up to MAX_JOB_MANUFACTURERS; empty until one is chosen. */
    manufacturerIds: string[];
    /** Manufacturer profiles carrying their company names, populated from the API. */
    manufacturers?: { id: string; name: string; companyName: string | null }[];
    /** What the manufacturer is paid, in naira. */
    amount: number;
    projectLeadIds: string[];
    /** ISO dates — the planned schedule. The start date is optional. */
    startDate: string | null;
    dueDate: string;
    /** ISO date a manufacturer accepted the job. Null while pending. */
    dateAssigned: string | null;
    status: JobRecordStatus;
    description: string;
    deliveryLocation?: {
        street?: string;
        city: string;
        state: string;
        country?: string;
    } | null;
    /** A photo of the furniture to make — shown with open jobs. */
    imageUrl: string;
    imagePublicId?: string;
    attachments: JobAttachmentRecord[];
    /** Newest first. */
    notes: JobNoteRecord[];
    /** ISO date — "All" lists the newest first. */
    createdAt: string;
    /** Proof the manufacturer sent of each production step, and its review — oldest first. */
    stepSubmissions: StepSubmission[];
    /** The latest photos of the finished furniture, submitted for review. */
    completionImageUrls: string[];
    /** ISO date of the latest submission. Null until the first. */
    submittedForReviewAt: string | null;
    /** Oldest first — at most MAX_JOB_REJECTIONS. */
    rejections: JobRejectionRecord[];
    /** Newest first. */
    extensionRequests: TimelineExtensionRecord[];
    /** Newest first. */
    assignmentHistory: JobAssignmentRecord[];
    /** Null until the lead rates the manufacturer on a completed job. */
    manufacturerReview: ManufacturerReviewRecord | null;
    /**
     * The lead's rating of the finished work when it was under
     * MIN_SIGN_OFF_RATING: it isn't signed off (or approved automatically)
     * while it waits for a super admin to sign it off or send it back.
     */
    furtherReview: ManufacturerReviewRecord | null;
    /** Each manufacturer's rating of the lead, once the job is completed — one each at most. */
    leadReviews: LeadReviewRecord[];
    /** ISO date the work was signed off. Null until the job is completed. */
    completedAt: string | null;
    /** Who signed it off. Null when it was approved automatically. */
    completedBy: string | null;
    /** A fault the lead found in the FAULT_REPORT_DAYS after sign-off, which cancels the bonus. */
    faultReport: JobFaultReport | null;
    /** Manufacturers asking for the job while it's pending — newest first. */
    applications: JobApplicationRecord[];
};

/** A manufacturer asking for a pending job. Accepting it gives them the job. */
export type JobApplicationRecord = {
    id: string;
    manufacturerId: string;
    /** ISO date. */
    appliedAt: string;
    status: "pending" | "accepted" | "declined";
    /** ISO date the lead decided. Null while pending. */
    decidedAt: string | null;
};

/** What the job's payments are worked out from (see constant/jobWorkflow.ts). */
export function getJobRecordPaymentInput(job: JobRecord): JobPaymentInput {
    return {
        amount: job.amount,
        dueDate: job.dueDate,
        acceptedAt: job.dateAssigned,
        stepSubmissions: job.stepSubmissions,
        signedOffAt: job.completedAt,
        rejectionCount: job.rejections.length,
        faultReport: job.faultReport,
    };
}

export const getJobRecordPayments = (job: JobRecord, now: Date = new Date()) =>
    getJobPayments(getJobRecordPaymentInput(job), now);

/**
 * The job with every auto-approval that's come due by `now` applied — step
 * proof, and finished work, left unreviewed for REVIEW_WINDOW_HOURS (not
 * counting Sundays).
 */
export function settleJobRecord(job: JobRecord, now: Date = new Date()): JobRecord {
    const settled = { ...job, stepSubmissions: settleStepSubmissions(job.stepSubmissions, now) };
    // Held for further review: waiting for a super admin, not the clock
    if (job.status !== "in-review" || !job.submittedForReviewAt || job.furtherReview) return settled;
    const approveAt = getAutoApproveAt(job.submittedForReviewAt);
    return approveAt <= now
        ? { ...settled, status: "completed", completedAt: approveAt.toISOString(), completedBy: null }
        : settled;
}

/** Rejected for the last time — the manufacturer can't resubmit it. */
export function isRejectionFinal(job: Pick<JobRecord, "status" | "rejections">): boolean {
    return job.status === "rejected" && job.rejections.length >= MAX_JOB_REJECTIONS;
}

/** Open for applications — pending, with no manufacturer on it yet. */
export const isOpenJobRecord = (job: Pick<JobRecord, "status" | "manufacturerIds">) =>
    job.status === "pending" && job.manufacturerIds.length === 0;

// ─── Payouts ─────────────────────────────────────────────────────────────────

/** One payment made into a manufacturer's wallet for a job. */
export type JobPayoutRecord = {
    id: string;
    jobId: string;
    jobTitle: string;
    manufacturerId: string;
    milestone: JobPaymentMilestone | "bonus";
    label: string;
    /** In naira. */
    amount: number;
    /** ISO date it was paid. */
    paidAt: string;
};

export const getPayoutId = (jobId: string, milestone: JobPayoutRecord["milestone"], manufacturerId: string) =>
    `${jobId}-${milestone}-${manufacturerId}`;

/**
 * A manufacturer's part of a job's amount — two sharing a job split it
 * evenly, the first taking the rounding remainder.
 */
export function getManufacturerShare(job: Pick<JobRecord, "amount" | "manufacturerIds">, manufacturerId: string): number {
    const count = Math.max(1, job.manufacturerIds.length);
    const share = Math.floor(job.amount / count);
    return job.manufacturerIds[0] === manufacturerId ? job.amount - share * (count - 1) : share;
}

/** Every payment made on a job so far (see JOB_PAYMENT_SCHEDULE), for each manufacturer on it. */
export function getJobRecordPayouts(job: JobRecord, now: Date = new Date()): JobPayoutRecord[] {
    return job.manufacturerIds.flatMap((manufacturerId) => {
        const { payments, bonus } = getJobPayments(
            { ...getJobRecordPaymentInput(job), amount: getManufacturerShare(job, manufacturerId) },
            now,
        );
        const paid: Pick<JobPayoutRecord, "milestone" | "label" | "amount" | "paidAt">[] = payments.flatMap(
            ({ milestone, label, amount, releasedAt }) => (releasedAt ? [{ milestone, label, amount, paidAt: releasedAt }] : []),
        );
        if (bonus.status === "released" && bonus.releaseAt) {
            paid.push({ milestone: "bonus", label: "On-time bonus", amount: bonus.amount, paidAt: bonus.releaseAt });
        }
        return paid.map(
            (payout): JobPayoutRecord => ({
                ...payout,
                id: getPayoutId(job.id, payout.milestone, manufacturerId),
                jobId: job.id,
                jobTitle: job.title,
                manufacturerId,
            }),
        );
    });
}

// ─── Rejection charges ───────────────────────────────────────────────────────

/** Taken from a manufacturer's wallet when their finished work on a job is rejected (see REJECTION_CHARGE_PERCENT). */
export type JobChargeRecord = {
    id: string;
    jobId: string;
    jobTitle: string;
    manufacturerId: string;
    /** Which rejection it was for, from 1. */
    rejectionNumber: number;
    /** In naira. */
    amount: number;
    /** ISO date — when the work was rejected. */
    chargedAt: string;
};

/** Every charge on a job so far — one per rejection, for each manufacturer on it, on their part of the amount. */
export function getJobRecordCharges(job: JobRecord): JobChargeRecord[] {
    return job.rejections.flatMap((rejection, index) =>
        job.manufacturerIds.map(
            (manufacturerId): JobChargeRecord => ({
                id: `${rejection.id}-charge-${manufacturerId}`,
                jobId: job.id,
                jobTitle: job.title,
                manufacturerId,
                rejectionNumber: index + 1,
                amount: getRejectionCharge(getManufacturerShare(job, manufacturerId)),
                chargedAt: rejection.rejectedAt,
            }),
        ),
    );
}

// ─── Wallets ─────────────────────────────────────────────────────────────────

/**
 * Money a manufacturer took out of their wallet — a withdrawal to their
 * bank, or a plan paid from the balance. What's paid in comes from their
 * jobs (see getJobRecordPayouts); what's charged, from rejections (see
 * getJobRecordCharges).
 */
export type WalletDebitRecord = {
    id: string;
    manufacturerId: string;
    type: "withdrawal" | "subscription";
    label: string;
    /** In naira. */
    amount: number;
    /** ISO date. */
    date: string;
};

// ─── Support ─────────────────────────────────────────────────────────────────

/** What a manufacturer shared from Talk to support › Share feedback. */
export type SupportFeedbackRecord = {
    id: string;
    manufacturerId: string;
    /** A FEEDBACK_CATEGORY_OPTIONS value. */
    category: "feedback" | "suggestion" | "problem";
    message: string;
    /** Null when none was attached. */
    screenshotUrl: string | null;
    /** ISO date. */
    sentAt: string;
};

// ─── Subscriptions ───────────────────────────────────────────────────────────

/**
 * A payment for a manufacturer's plan — one per billing period. Paid from
 * the wallet it's a wallet transaction too; paid by card it isn't, and
 * doesn't touch their balance.
 */
export type SubscriptionPaymentRecord = {
    id: string;
    manufacturerId: string;
    /** A PRICING_PLANS id. */
    planId: string;
    billingCycle: BillingCycle;
    /** In naira. */
    amount: number;
    /** ISO date. */
    paidAt: string;
    paidFrom: "card" | "wallet";
};

