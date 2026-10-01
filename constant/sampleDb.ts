// ─────────────────────────────────────────────────────────────────────────────
// The sample database — one set of records that both platforms read: the
// admin platform uses them as they are, and the manufacturer platform
// derives its view of them (its own jobs, the open jobs it can apply for,
// its pay and reviews — see the jobs section of constant/manufacturer.ts).
// The records are in the shape the API will return, so the same job,
// manufacturer or payment reads the same everywhere.
//
// Once the backend is connected, load these records from the API instead
// and delete the sample rows here (the seeds and the generator); the record
// types and the helpers that work on them stay.
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
import { getPlanListPrice, getPricingPlan, requiresBusinessDocuments, type BillingCycle } from "@/constant/sampleData";
import type { SuperAdminRole } from "@/constant/superAdmin";


/**
 * Midnight `days` from today. Anchored to the day, not the moment, so the
 * server and the browser work out the same dates whenever each loads the
 * sample data — and dates on the same day tie the same way on both.
 */
function daysFromNow(days: number): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

/** `days` from today (in the past, for these) at a time of day — "14:05" reads better than midnight in a log. */
function dayAt(days: number, hour: number, minute = 0): string {
    const date = new Date(daysFromNow(days));
    date.setHours(hour, minute);
    return date.toISOString();
}

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

/** The signed-in admin, among the project leads. */
export const SIGNED_IN_LEAD_ID = "lead-latade";
/** The signed-in manufacturer — the manufacturer platform shows their jobs, pay and reviews. */
export const SIGNED_IN_MANUFACTURER_ID = "mfr-majeurs";

function projectLead({
    joined,
    ...seed
}: Pick<ProjectLeadRecord, "id" | "firstName" | "lastName" | "position" | "phone"> &
    Partial<Pick<ProjectLeadRecord, "twoFactorMethod">> & {
        /** Days from today. */
        joined: number;
    }): ProjectLeadRecord {
    return {
        avatarUrl: null,
        twoFactorMethod: null,
        ...seed,
        name: `${seed.firstName} ${seed.lastName}`,
        email: `${seed.firstName.toLowerCase()}@mande.com.ng`,
        joinedAt: daysFromNow(joined),
    };
}

export const PROJECT_LEADS: ProjectLeadRecord[] = [
    projectLead({ id: "lead-latade", firstName: "Latade", lastName: "Dipe", position: "quality-assurance-manager", joined: -540, phone: "+234 812 555 0163", twoFactorMethod: "email" }),
    projectLead({ id: "lead-mark", firstName: "Mark", lastName: "Wilson", position: "inventory-manager", joined: -480, phone: "+234 813 555 0142", twoFactorMethod: "email" }),
    projectLead({ id: "lead-austin", firstName: "Austin", lastName: "Campbell", position: "furniture-surveyor", joined: -400, phone: "+234 814 555 0187" }),
    projectLead({ id: "lead-joke", firstName: "Joke", lastName: "Phillips", position: "quality-assurance-manager", joined: -310, phone: "+234 816 555 0129", twoFactorMethod: "email" }),
    projectLead({ id: "lead-ted", firstName: "Ted", lastName: "Lasso", position: "furniture-surveyor", joined: -200, phone: "+234 815 555 0110" }),
    projectLead({ id: "lead-mercury", firstName: "Mercury", lastName: "Jones", position: "inventory-manager", joined: -95, phone: "+234 817 555 0175" }),
];

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
        const existing = DYNAMIC_PROJECT_LEADS.get(lead.id) || PROJECT_LEADS.find((l) => l.id === lead.id);

        DYNAMIC_PROJECT_LEADS.set(lead.id, {
            id: lead.id,
            firstName,
            lastName,
            name: fullName,
            email: existing?.email ?? `${firstName.toLowerCase()}@mande.com.ng`,
            phone: lead.phone ?? existing?.phone ?? "",
            avatarUrl: lead.avatarUrl ?? existing?.avatarUrl ?? null,
            position: lead.position || existing?.position || "quality-assurance-manager",
            joinedAt: lead.joinedAt ?? existing?.joinedAt ?? new Date().toISOString(),
            twoFactorMethod: lead.twoFactorMethod ?? existing?.twoFactorMethod ?? null,
        });
    }
}

export function getProjectLead(id: string): ProjectLeadRecord | undefined {
    return DYNAMIC_PROJECT_LEADS.get(id) || PROJECT_LEADS.find((lead) => lead.id === id);
}

export function getAllProjectLeads(): ProjectLeadRecord[] {
    const dynamicList = Array.from(DYNAMIC_PROJECT_LEADS.values());
    if (dynamicList.length > 0) return dynamicList;
    return PROJECT_LEADS;
}


/**
 * A super admin — runs the platform: sees everything on it, looks after the
 * admins' accounts and decides account deletions. They don't lead jobs, so
 * they have no position; their role says what else they can do (see
 * SuperAdminRole).
 */
export type SuperAdminRecord = Omit<ProjectLeadRecord, "position"> & { role: SuperAdminRole };

/** The signed-in super admin. */
export const SIGNED_IN_SUPER_ADMIN_ID = "super-ashley";

export const SUPER_ADMINS: SuperAdminRecord[] = [
    {
        id: "super-ashley",
        firstName: "Ashley",
        lastName: "Cole",
        name: "Ashley Cole",
        email: "ashley@mande.com.ng",
        phone: "+234 818 555 0101",
        avatarUrl: null,
        joinedAt: daysFromNow(-900),
        twoFactorMethod: "email",
        role: "owner",
    },
    {
        id: "super-tobi",
        firstName: "Tobi",
        lastName: "Adeyemi",
        name: "Tobi Adeyemi",
        email: "tobi@mande.com.ng",
        phone: "+234 818 555 0144",
        avatarUrl: null,
        joinedAt: daysFromNow(-610),
        twoFactorMethod: "email",
        role: "tech-support",
    },
    {
        id: "super-zainab",
        firstName: "Zainab",
        lastName: "Musa",
        name: "Zainab Musa",
        email: "zainab@mande.com.ng",
        phone: "+234 818 555 0152",
        avatarUrl: null,
        joinedAt: daysFromNow(-240),
        twoFactorMethod: "email",
        role: "manager",
    },
];

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

export const SUPER_ADMIN_INVITES: SuperAdminInviteRecord[] = [
    {
        id: "invite-funmi",
        firstName: "Funmi",
        lastName: "Okafor",
        email: "funmi@mande.com.ng",
        role: "manager",
        invitedBy: "Ashley Cole",
        invitedAt: dayAt(-3, 10, 15),
    },
];

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

const VERIFIED: DocumentVerification = { status: "verified", rejectionReason: null };
const NOT_SUBMITTED: DocumentVerification = { status: "pending", rejectionReason: null };

type ManufacturerSeed = Pick<ManufacturerRecord, "id" | "companyName" | "firstName" | "lastName" | "email" | "phone" | "specialities"> & {
    /** Days from today. */
    joined: number;
    city: string;
    state: string;
    streetAddress?: string;
    planId?: string;
    subscription?: Partial<ManufacturerRecord["subscription"]>;
    /** Their activity after signing up, oldest first — see withAccountActivity. */
    activity?: ActivitySeed[];
    /** The device they signed up on. */
    signUpDevice?: string;
} & Partial<Omit<ManufacturerRecord, "address" | "joinedAt" | "contactName" | "subscription" | "activity" | "security">>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type ActivitySeed = DistributiveOmit<AccountActivityRecord, "id">;

/**
 * A manufacturer's activity log, newest first: signing up, adding the bank
 * account they have now (unless the seed says when), then the seed's own
 * events. Their sign-in settings are what the log leaves them with, so the
 * two never disagree.
 */
function withAccountActivity(
    record: Omit<ManufacturerRecord, "activity" | "security">,
    seeds: ActivitySeed[],
    signUpDevice: string,
): Pick<ManufacturerRecord, "activity" | "security"> {
    const events: ActivitySeed[] = [{ type: "account-created", at: shiftHours(record.joinedAt, 9), device: signUpDevice }];
    const { bankAccount } = record;
    const seedsAddBank = seeds.some((seed) => seed.type === "bank-added" && seed.accountNumber === bankAccount?.accountNumber);
    if (bankAccount && !seedsAddBank) {
        events.push({
            type: "bank-added",
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            at: shiftHours(record.joinedAt, 3 * 24 + 11),
            device: signUpDevice,
        });
    }
    events.push(...seeds);
    const ordered = events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    const security: ManufacturerSecurity = { linkedAccounts: { google: null, facebook: null }, twoFactorMethod: null };
    for (const event of ordered) {
        if (event.type === "social-linked") security.linkedAccounts[event.provider] = record.email;
        if (event.type === "social-unlinked") security.linkedAccounts[event.provider] = null;
        if (event.type === "two-factor-enabled" || event.type === "two-factor-changed") security.twoFactorMethod = event.method;
        if (event.type === "two-factor-disabled") security.twoFactorMethod = null;
    }
    return {
        security,
        activity: ordered.map((event, index) => ({ ...event, id: `activity-${record.id}-${index + 1}` })).reverse(),
    };
}

function shiftHours(iso: string, hours: number): string {
    return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString();
}

/** When the plan renews — the first billing-period boundary after today, counted from the day they joined. */
function nextRenewal(joinedAt: string, billingCycle: BillingCycle): string {
    const now = new Date();
    for (let period = 1; ; period++) {
        const renewsAt = addBillingPeriods(joinedAt, billingCycle, period);
        if (renewsAt > now) return renewsAt.toISOString();
    }
}

function manufacturer({
    joined,
    city,
    state,
    streetAddress,
    planId = "solo",
    subscription,
    activity = [],
    signUpDevice = `Chrome on Android · ${city}, ${state}`,
    ...seed
}: ManufacturerSeed): ManufacturerRecord {
    const joinedAt = daysFromNow(joined);
    const billingCycle = subscription?.billingCycle ?? "monthly";
    const record: Omit<ManufacturerRecord, "activity" | "security"> = {
        dateOfBirth: null,
        avatarUrl: null,
        staffRange: "1-10",
        productionLeadTime: "3-4-weeks",
        materialsInventory: "yes",
        ninCard: { imageUrl: "/sample-image/nin-card-sample.svg", ...VERIFIED },
        companyTaxNumber: "",
        companyTaxNumberVerification: NOT_SUBMITTED,
        businessLicenseNumber: "",
        businessLicenseNumberVerification: NOT_SUBMITTED,
        bankAccount: null,
        accountStatus: "active",
        statusHistory: [],
        appeals: [],
        deletionRequest: null,
        ...seed,
        contactName: `${seed.firstName} ${seed.lastName}`,
        joinedAt,
        address: { streetAddress: streetAddress ?? "12, Allen Avenue", city, state, country: "NG" },
        subscription: {
            planId,
            billingCycle,
            renewsAt: nextRenewal(joinedAt, billingCycle),
            renewalsPaidFrom: "card",
            ...subscription,
        },
    };
    return { ...record, ...withAccountActivity(record, activity, signUpDevice) };
}

export const MANUFACTURERS: ManufacturerRecord[] = [
    manufacturer({
        id: "mfr-majeurs", companyName: "Majeurs Chesterfield", firstName: "Demi", lastName: "Semande",
        email: "demi@majeurs.ng", phone: "+234 801 234 5678", joined: -420, dateOfBirth: "1990-05-14T12:00:00.000Z",
        streetAddress: "20, Peacock Drive", city: "Lekki", state: "Lagos",
        specialities: ["beds", "desks", "chairs-seating"], staffRange: "21-30", productionLeadTime: "5-8-weeks",
        // A person needs to look at the ID — admins can verify or reject it
        ninCard: { imageUrl: "/sample-image/nin-card-sample.svg", status: "manual_review", rejectionReason: null },
        bankAccount: { bankCode: "058", bankName: "Guaranty Trust Bank", accountNumber: "0233000994", accountName: "Demi Semande", currency: "NGN" },
        signUpDevice: "Chrome on macOS · Lekki, Lagos",
        activity: [
            { type: "bank-added", bankName: "Access Bank", accountNumber: "0012345678", at: dayAt(-405, 10, 12), device: "Chrome on macOS · Lekki, Lagos" },
            { type: "social-linked", provider: "google", at: dayAt(-380, 19, 40), device: "Chrome on macOS · Lekki, Lagos" },
            { type: "two-factor-enabled", method: "app", at: dayAt(-300, 8, 55), device: "Chrome on macOS · Lekki, Lagos" },
            { type: "bank-added", bankName: "Guaranty Trust Bank", accountNumber: "0233000994", at: dayAt(-201, 13, 20), device: "Chrome on macOS · Lekki, Lagos" },
            { type: "bank-removed", bankName: "Access Bank", accountNumber: "0012345678", at: dayAt(-201, 13, 24), device: "Chrome on macOS · Lekki, Lagos" },
            { type: "signed-in-new-device", at: dayAt(-120, 7, 30), device: "Safari on iPhone · Lekki, Lagos" },
            { type: "two-factor-changed", method: "email", at: dayAt(-119, 21, 5), device: "Safari on iPhone · Lekki, Lagos" },
            { type: "password-changed", at: dayAt(-60, 16, 45), device: "Chrome on macOS · Lekki, Lagos" },
            { type: "social-linked", provider: "facebook", at: dayAt(-45, 11, 2), device: "Safari on iPhone · Lekki, Lagos" },
            { type: "social-unlinked", provider: "facebook", at: dayAt(-31, 9, 18), device: "Chrome on macOS · Lekki, Lagos" },
            { type: "phone-changed", at: dayAt(-14, 15, 10), device: "Safari on iPhone · Lekki, Lagos" },
            { type: "password-changed", at: dayAt(-3, 10, 26), device: "Chrome on macOS · Lekki, Lagos" },
        ],
    }),
    manufacturer({
        id: "mfr-vava", companyName: "Vava Furniture Nig. Ltd", firstName: "Samuel", lastName: "Vava",
        email: "samuel@vavafurniture.ng", phone: "+234 802 345 6789", joined: -300, city: "Ikeja", state: "Lagos",
        specialities: ["chairs-seating", "upholstery"], planId: "workshop", staffRange: "11-20",
        activity: [
            { type: "social-linked", provider: "google", at: dayAt(-280, 12, 0), device: "Chrome on Android · Ikeja, Lagos" },
            { type: "password-reset", at: dayAt(-150, 22, 41), device: "Chrome on Android · Ikeja, Lagos" },
            { type: "signed-in-new-device", at: dayAt(-66, 8, 14), device: "Edge on Windows · Ikeja, Lagos" },
        ],
        statusHistory: [
            { status: "active", reason: "Both late jobs were delivered and signed off.", by: "Latade Dipe", at: daysFromNow(-40) },
            { status: "flagged", reason: "Two missed due dates in a row.", by: "Austin Campbell", at: daysFromNow(-65) },
        ],
        companyTaxNumber: "TIN-20448871", companyTaxNumberVerification: VERIFIED,
        businessLicenseNumber: "RC-3389201", businessLicenseNumberVerification: VERIFIED,
    }),
    manufacturer({
        id: "mfr-kesino", companyName: "Kesino Furnitures", firstName: "Kesi", lastName: "Nwosu",
        email: "kesi@kesino.ng", phone: "+234 803 456 7890", joined: -210, city: "Enugu", state: "Enugu",
        specialities: ["desks", "wood", "cabinetry"], planId: "workshop",
        subscription: { renewalsPaidFrom: "wallet" },
        bankAccount: { bankCode: "044", bankName: "Access Bank", accountNumber: "0690000031", accountName: "Kesi Nwosu", currency: "NGN" },
        activity: [
            { type: "two-factor-enabled", method: "app", at: dayAt(-150, 9, 30), device: "Chrome on Android · Enugu, Enugu" },
            { type: "social-linked", provider: "facebook", at: dayAt(-100, 18, 12), device: "Chrome on Android · Enugu, Enugu" },
            { type: "password-changed", at: dayAt(-8, 7, 50), device: "Chrome on Android · Enugu, Enugu" },
        ],
        companyTaxNumber: "TIN-11843092", companyTaxNumberVerification: VERIFIED,
        businessLicenseNumber: "RC-1928374", businessLicenseNumberVerification: { status: "processing", rejectionReason: null },
    }),
    manufacturer({
        id: "mfr-oak", companyName: "Oak & Iron Works", firstName: "Tunde", lastName: "Bakare",
        email: "tunde@oakandiron.ng", phone: "+234 804 567 8901", joined: -150, city: "Ibadan", state: "Oyo",
        specialities: ["wood", "outdoor-furniture"], planId: "studio-enterprise", staffRange: "31-50",
        subscription: { billingCycle: "annual" },
        bankAccount: { bankCode: "057", bankName: "Zenith Bank", accountNumber: "2081234567", accountName: "Oak & Iron Works", currency: "NGN" },
        signUpDevice: "Firefox on Windows · Ibadan, Oyo",
        activity: [
            { type: "two-factor-enabled", method: "email", at: dayAt(-140, 10, 5), device: "Firefox on Windows · Ibadan, Oyo" },
            { type: "password-changed", at: dayAt(-20, 17, 33), device: "Firefox on Windows · Ibadan, Oyo" },
        ],
        companyTaxNumber: "TIN-55012983", companyTaxNumberVerification: VERIFIED,
        businessLicenseNumber: "RC-7730915", businessLicenseNumberVerification: VERIFIED,
    }),
    manufacturer({
        id: "mfr-leather", companyName: "Lagos Leather Co.", firstName: "Amaka", lastName: "Obi",
        email: "amaka@lagosleather.ng", phone: "+234 805 678 9012", joined: -90, city: "Yaba", state: "Lagos",
        specialities: ["leather", "sofas"], planId: "workshop",
        subscription: { renewalsPaidFrom: "wallet" },
        bankAccount: { bankCode: "033", bankName: "United Bank for Africa", accountNumber: "1023456789", accountName: "Amaka Obi", currency: "NGN" },
        activity: [
            { type: "social-linked", provider: "google", at: dayAt(-80, 14, 22), device: "Chrome on Android · Yaba, Lagos" },
            { type: "social-unlinked", provider: "google", at: dayAt(-10, 9, 3), device: "Safari on iPhone · Yaba, Lagos" },
        ],
        companyTaxNumber: "TIN-30918274", companyTaxNumberVerification: VERIFIED,
        businessLicenseNumber: "RC-4418290", businessLicenseNumberVerification: VERIFIED,
        accountStatus: "flagged",
        statusHistory: [{ status: "flagged", reason: "Two jobs delivered late this quarter.", by: "Mark Wilson", at: daysFromNow(-6) }],
    }),
    manufacturer({
        id: "mfr-shavings", companyName: "Shavings Furnitures", firstName: "Dansteve", lastName: "Kanbi",
        email: "dansteve@shavings.ng", phone: "+234 806 789 0123", joined: -60, city: "Port Harcourt", state: "Rivers",
        specialities: ["beds", "desks"],
        ninCard: { imageUrl: "/sample-image/nin-card-sample.svg", status: "pending", rejectionReason: null },
    }),
    manufacturer({
        id: "mfr-makeshift", companyName: "Makeshift Global", firstName: "Ajit", lastName: "Johnson",
        email: "ajit@makeshift.ng", phone: "+234 807 890 1234", joined: -240, city: "Wuse", state: "FCT",
        specialities: ["desks", "upholstery"], planId: "workshop",
        companyTaxNumber: "TIN-88120034", companyTaxNumberVerification: { status: "rejected", rejectionReason: "The tax number doesn't match the company name on record." },
        businessLicenseNumber: "RC-6621039", businessLicenseNumberVerification: VERIFIED,
    }),
    manufacturer({
        id: "mfr-brown", companyName: "Brown Furnitures", firstName: "Bidemi", lastName: "Brown",
        email: "bidemi@brownfurnitures.ng", phone: "+234 808 901 2345", joined: -760, city: "Surulere", state: "Lagos",
        specialities: ["upholstery"],
        activity: [
            { type: "bank-added", bankName: "First Bank of Nigeria", accountNumber: "3012345678", at: dayAt(-700, 11, 40), device: "Chrome on Android · Surulere, Lagos" },
            { type: "two-factor-enabled", method: "email", at: dayAt(-500, 20, 15), device: "Chrome on Android · Surulere, Lagos" },
            { type: "password-changed", at: dayAt(-200, 8, 5), device: "Chrome on Android · Surulere, Lagos" },
            { type: "bank-removed", bankName: "First Bank of Nigeria", accountNumber: "3012345678", at: dayAt(-30, 13, 52), device: "Chrome on Android · Surulere, Lagos" },
        ],
        accountStatus: "suspended",
        statusHistory: [
            { status: "suspended", reason: "Materials money for one job was spent on another. The finance team is looking into it.", by: "Latade Dipe", at: daysFromNow(-12) },
        ],
        // One turned down, then a second waiting for an admin
        appeals: [
            {
                id: "appeal-brown-2",
                message: "The materials were bought for this job. The supplier put the wrong job code on the invoice. I've attached the corrected one.",
                attachments: [{ name: "Corrected invoice.pdf", url: "/corrected-invoice.pdf", kind: "document" }],
                sentAt: daysFromNow(-7), status: "pending", response: null, decidedBy: null, decidedAt: null,
            },
            {
                id: "appeal-brown-1",
                message: "I didn't spend the materials money on another job.",
                attachments: [],
                sentAt: daysFromNow(-11), status: "declined",
                response: "We need to see the supplier's invoice for this job before we can lift the suspension.",
                decidedBy: "Latade Dipe", decidedAt: daysFromNow(-10),
            },
        ],
    }),
    manufacturer({
        id: "mfr-layan", companyName: "Layan Furnitures", firstName: "Kunle", lastName: "Layan",
        email: "kunle@layan.ng", phone: "+234 809 012 3456", joined: -45, city: "Abeokuta", state: "Ogun",
        specialities: ["beds", "chairs-seating"],
    }),
    manufacturer({
        id: "mfr-williams", companyName: "Williams Chesterfield", firstName: "Tiambi", lastName: "Williams",
        email: "tiambi@williamschesterfield.ng", phone: "+234 810 123 4567", joined: -20, city: "Lekki", state: "Lagos",
        specialities: ["sofas", "leather"], planId: "workshop",
        ninCard: { imageUrl: "/sample-image/nin-card-sample.svg", status: "processing", rejectionReason: null },
        companyTaxNumber: "TIN-40291187", companyTaxNumberVerification: NOT_SUBMITTED,
        businessLicenseNumber: "RC-9981320", businessLicenseNumberVerification: NOT_SUBMITTED,
    }),
    manufacturer({
        id: "mfr-boney", companyName: "Boney Furnitures", firstName: "John", lastName: "Jones",
        email: "john@boney.ng", phone: "+234 811 234 5678", joined: -130, city: "Kano", state: "Kano",
        specialities: ["wood"],
        // Waiting for a super admin
        deletionRequest: {
            reason: "John emailed to ask us to close the account. He's retiring and closing the workshop at the end of the month.",
            attachments: [],
            requestedBy: "Mark Wilson",
            requestedAt: dayAt(-2, 11, 20),
        },
    }),
    manufacturer({
        id: "mfr-metalworks", companyName: "Metal Works Ltd", firstName: "Kemi", lastName: "Adeyemi",
        email: "kemi@metalworks.ng", phone: "+234 812 345 6789", joined: -35, city: "Ilorin", state: "Kwara",
        specialities: ["outdoor-furniture"],
        ninCard: { imageUrl: "/sample-image/nin-card-sample.svg", status: "rejected", rejectionReason: "The photo is too blurry to read." },
    }),
];

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
        const existing = DYNAMIC_MANUFACTURERS.get(m.id) || MANUFACTURERS.find((item) => item.id === m.id);
        const companyName = m.companyName || existing?.companyName || m.name || "Manufacturer";
        const firstName = m.firstName || existing?.firstName || companyName;
        const lastName = m.lastName || existing?.lastName || "";
        const contactName = existing?.contactName || m.name || `${firstName} ${lastName}`.trim() || companyName;

        const sub = (m.subscription as ManufacturerRecord["subscription"]) || existing?.subscription;
        const planId = sub?.planId || ((m as Record<string, unknown>).planId as string) || "growth";
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
            ninCard: (m.ninCard as ManufacturerRecord["ninCard"]) || existing?.ninCard || { imageUrl: "", status: "verified", rejectionReason: null },
            companyTaxNumber: (m.companyTaxNumber as string) || existing?.companyTaxNumber || "",
            companyTaxNumberVerification: (m.companyTaxNumberVerification as ManufacturerRecord["companyTaxNumberVerification"]) || existing?.companyTaxNumberVerification || { status: "verified", rejectionReason: null },
            businessLicenseNumber: (m.businessLicenseNumber as string) || existing?.businessLicenseNumber || "",
            businessLicenseNumberVerification: (m.businessLicenseNumberVerification as ManufacturerRecord["businessLicenseNumberVerification"]) || existing?.businessLicenseNumberVerification || { status: "verified", rejectionReason: null },
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
    return DYNAMIC_MANUFACTURERS.get(id) || MANUFACTURERS.find((manufacturer) => manufacturer.id === id);
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

/** A furniture photo per category, standing in for manufacturers' uploads and the jobs' own photos. */
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

/** A stand-in photo for a job in `category` — for jobs created before photos can be uploaded. */
export const getSampleCategoryPhoto = (category: string) => CATEGORY_PHOTOS[category] ?? "/images/image1.png";

/** Open for applications — pending, with no manufacturer on it yet. */
export const isOpenJobRecord = (job: Pick<JobRecord, "status" | "manufacturerIds">) =>
    job.status === "pending" && job.manufacturerIds.length === 0;

/**
 * Sample jobs have been migrated to the backend database (see mande-backend/src/scripts/seed.ts).
 * Live jobs are loaded dynamically from the server (GET /api/v1/jobs and GET /api/v1/open-jobs).
 */
export const SAMPLE_JOBS: JobRecord[] = [];

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

export const SAMPLE_WALLET_DEBITS: WalletDebitRecord[] = [
    { id: "debit-1", manufacturerId: "mfr-majeurs", type: "withdrawal", label: "Withdrawal", amount: 300000, date: daysFromNow(-20) },
    { id: "debit-2", manufacturerId: "mfr-kesino", type: "withdrawal", label: "Withdrawal", amount: 500000, date: daysFromNow(-45) },
    { id: "debit-3", manufacturerId: "mfr-oak", type: "withdrawal", label: "Withdrawal", amount: 800000, date: daysFromNow(-30) },
    { id: "debit-4", manufacturerId: "mfr-leather", type: "withdrawal", label: "Withdrawal", amount: 200000, date: daysFromNow(-12) },
];

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

const SAMPLE_SCREENSHOT = "/sample-image/feedback-screenshot-sample.svg";

/** Newest first. */
export const SAMPLE_SUPPORT_FEEDBACK: SupportFeedbackRecord[] = [
    {
        id: "feedback-1",
        manufacturerId: "mfr-majeurs",
        category: "problem",
        message: "When I upload proof for the Frame step from my phone, the second photo doesn't show until I refresh the page. It happened on two jobs this week.",
        screenshotUrl: SAMPLE_SCREENSHOT,
        sentAt: dayAt(-9, 18, 22),
    },
    {
        id: "feedback-2",
        manufacturerId: "mfr-oak",
        category: "suggestion",
        message: "Please add a downloadable invoice for the yearly plan. Our accountant needs one for the books.",
        screenshotUrl: null,
        sentAt: dayAt(-15, 10, 40),
    },
    {
        id: "feedback-3",
        manufacturerId: "mfr-kesino",
        category: "problem",
        message: "My last withdrawal took almost two hours to reach my Access Bank account. The app said a few minutes.",
        screenshotUrl: null,
        sentAt: dayAt(-22, 16, 5),
    },
    {
        id: "feedback-4",
        manufacturerId: "mfr-majeurs",
        category: "suggestion",
        message: "It would help to see all my payments for a job in one place, with what's still to come after each step.",
        screenshotUrl: null,
        sentAt: dayAt(-40, 9, 12),
    },
    {
        id: "feedback-5",
        manufacturerId: "mfr-vava",
        category: "suggestion",
        message: "Let us message the project lead from the job page instead of having to call. Calls are hard to take on the workshop floor.",
        screenshotUrl: null,
        sentAt: dayAt(-55, 13, 30),
    },
    {
        id: "feedback-6",
        manufacturerId: "mfr-majeurs",
        category: "feedback",
        message: "The new job cards are much easier to read. Seeing how long a job runs before applying helps me plan the workshop.",
        screenshotUrl: null,
        sentAt: dayAt(-70, 20, 48),
    },
    {
        id: "feedback-7",
        manufacturerId: "mfr-brown",
        category: "feedback",
        message: "Getting paid at each step has made buying materials much easier for us. Thank you.",
        screenshotUrl: null,
        sentAt: dayAt(-95, 11, 15),
    },
];

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

/** `periods` billing periods on from `from` — calendar months, or years. */
function addBillingPeriods(from: string, billingCycle: BillingCycle, periods: number): Date {
    const date = new Date(from);
    if (billingCycle === "annual") date.setFullYear(date.getFullYear() + periods);
    else date.setMonth(date.getMonth() + periods);
    return date;
}

/**
 * Every plan payment a manufacturer has made, oldest first — one at the
 * start of each billing period since they joined, at their plan's price.
 * Sample data doesn't track plan changes, so all are for the plan they're
 * on now.
 */
export function getSubscriptionPayments(
    manufacturer: ManufacturerRecord,
    now: Date = new Date(),
): SubscriptionPaymentRecord[] {
    if (!manufacturer?.subscription?.planId) return [];
    const { planId, billingCycle = "monthly", renewalsPaidFrom = "wallet" } = manufacturer.subscription;
    const plan = getPricingPlan(planId);
    if (!plan) return [];
    const payments: SubscriptionPaymentRecord[] = [];
    for (let period = 0; ; period++) {
        const paidAt = addBillingPeriods(manufacturer.joinedAt, billingCycle, period);
        if (paidAt > now) return payments;
        payments.push({
            id: `sub-${manufacturer.id}-${period + 1}`,
            manufacturerId: manufacturer.id,
            planId,
            billingCycle,
            // The sample history predates the plan offer, so each paid the usual price
            amount: getPlanListPrice(plan, billingCycle),
            paidAt: paidAt.toISOString(),
            paidFrom: period === 0 ? "card" : renewalsPaidFrom,
        });
    }
}
