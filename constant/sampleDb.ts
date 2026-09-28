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
    JOB_PRODUCTION_STEPS,
    MAX_JOB_REJECTIONS,
    getAutoApproveAt,
    getJobPayments,
    getRejectionCharge,
    sampleStepSubmissions,
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

const DAY_MS = 24 * 60 * 60 * 1000;

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

function hoursAgo(hours: number): string {
    return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
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
    projectLead({ id: "lead-mark", firstName: "Mark", lastName: "Wilson", position: "inventory-manager", joined: -480, phone: "+234 813 555 0142", twoFactorMethod: "app" }),
    projectLead({ id: "lead-austin", firstName: "Austin", lastName: "Campbell", position: "furniture-surveyor", joined: -400, phone: "+234 814 555 0187" }),
    projectLead({ id: "lead-joke", firstName: "Joke", lastName: "Phillips", position: "quality-assurance-manager", joined: -310, phone: "+234 816 555 0129", twoFactorMethod: "email" }),
    projectLead({ id: "lead-ted", firstName: "Ted", lastName: "Lasso", position: "furniture-surveyor", joined: -200, phone: "+234 815 555 0110" }),
    projectLead({ id: "lead-mercury", firstName: "Mercury", lastName: "Jones", position: "inventory-manager", joined: -95, phone: "+234 817 555 0175" }),
];

export function getProjectLead(id: string): ProjectLeadRecord | undefined {
    return PROJECT_LEADS.find((lead) => lead.id === id);
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
        twoFactorMethod: "app",
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
        staffRange: "6-10",
        productionLeadTime: "2-4-weeks",
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

export function getManufacturer(id: string): ManufacturerRecord | undefined {
    return MANUFACTURERS.find((manufacturer) => manufacturer.id === id);
}

/** The flag or suspension the account is under now — null while it's active. */
export function getAccountHold(
    manufacturer: Pick<ManufacturerRecord, "accountStatus" | "statusHistory">,
): AccountStatusEventRecord | null {
    if (manufacturer.accountStatus === "active") return null;
    return manufacturer.statusHistory.find((event) => event.status === manufacturer.accountStatus) ?? null;
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
    const needsBusinessDocuments = requiresBusinessDocuments(manufacturer.subscription.planId);
    const statuses: VerificationStatus[] = [manufacturer.ninCard.status];
    if (manufacturer.companyTaxNumber || needsBusinessDocuments) {
        statuses.push(manufacturer.companyTaxNumberVerification.status);
    }
    if (manufacturer.businessLicenseNumber || needsBusinessDocuments) {
        statuses.push(manufacturer.businessLicenseNumberVerification.status);
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
export const JOB_DESCRIPTION_MAX_LENGTH = 120;

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
    /** A photo of the furniture to make — shown with open jobs. */
    imageUrl: string;
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

function minutesAgo(minutes: number): string {
    return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

const METAL_FABRICATION_NOTES: JobNoteRecord[] = [
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
        message: "Job created. Blueprints are attached, and the powder coat should be matte black.",
        createdAt: minutesAgo(60 * 50),
    },
];

const MARK_WILSON_NOTES: JobNoteRecord[] = [
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

type JobSeed = Pick<JobRecord, "title" | "manufacturerIds" | "amount" | "projectLeadIds" | "status"> & {
    /** The first is the job's category. */
    specialities: string[];
    /** Days from today. */
    start: number;
    due: number;
    /** Days from today; omit while pending. */
    assigned?: number;
    attachments?: JobAttachmentRecord[];
    notes?: JobNoteRecord[];
    /** In progress: how many production steps are approved. */
    stepsDone?: number;
    /** In progress: hours ago proof of each step after the approved ones was sent — still waiting for review. */
    waitingHours?: number[];
    /** Days from today the job was created; defaults to one a day going back, in seed order. */
    created?: number;
    /** The job's photo; defaults to one for its category. */
    imageUrl?: string;
    description?: string;
    /** In progress: proof of the next step the lead sent back, hours ago, and why. */
    sentBack?: { hoursAgo: number; reason: string };
    /** Days from today the job was signed off; completed jobs only. */
    completed?: number;
    /** Who signed it off, when not the lead — null if it was approved automatically. */
    completedBy?: string | null;
    faultReport?: JobFaultReport;
    applications?: JobApplicationRecord[];
    rejections?: JobRejectionRecord[];
    extensionRequests?: TimelineExtensionRecord[];
    /** Overrides the default single assignment. */
    assignmentHistory?: JobAssignmentRecord[];
    manufacturerReview?: ManufacturerReviewRecord;
    furtherReview?: ManufacturerReviewRecord;
    leadReviews?: LeadReviewRecord[];
};

const BLUEPRINTS: JobAttachmentRecord[] = [
    { name: "M.F Blueprint.pdf", url: "/mf-blueprint.pdf", kind: "document" },
    { name: "Blueprint DEMO.pdf", url: "/blueprint-DEMO.pdf", kind: "document" },
];

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

const rejection = (id: string, daysAgo: number, reason: string, withPhoto = false): JobRejectionRecord => ({
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
    { title: "4 Cushions & Seating Fabric", specialities: ["upholstery", "leather"], manufacturerIds: ["mfr-majeurs"], amount: 1500000, projectLeadIds: ["lead-mark"], status: "in-progress", start: -10, due: 35, assigned: -10, attachments: BLUEPRINTS, notes: MARK_WILSON_NOTES, stepsDone: 2,
        // Proof of the Frame and the Assembly both waiting — sent without waiting for the first review
        waitingHours: [6, 1],
        extensionRequests: [
            { id: "ext-2-1", previousDueDate: daysFromNow(35), requestedDueDate: daysFromNow(42), reason: "The fabric supplier is out of the oatmeal weave until next week.", requestedAt: hoursAgo(20), status: "pending", decidedAt: null, step: "finishing" },
        ] },
    { title: "2 Beds & 1 Desk", specialities: ["beds", "desks"], manufacturerIds: ["mfr-vava"], amount: 620000, projectLeadIds: ["lead-austin"], status: "in-progress", start: -30, due: 4, assigned: -30, stepsDone: 3, waitingHours: [5] },
    // Pending, after the first manufacturer (Majeurs) turned it down
    { title: "3 Tables & Carver Chairs", specialities: ["wood", "chairs-seating"], manufacturerIds: ["mfr-kesino"], amount: 540000, projectLeadIds: ["lead-latade"], status: "pending", start: 3, due: 45,
        assignmentHistory: [
            { id: "asg-4-2", manufacturerIds: ["mfr-kesino"], assignedBy: "Latade Dipe", assignedAt: daysFromNow(-1), outcome: "awaiting", outcomeAt: null },
            { id: "asg-4-1", manufacturerIds: ["mfr-majeurs"], assignedBy: "Latade Dipe", assignedAt: daysFromNow(-4), outcome: "declined", outcomeAt: daysFromNow(-2) },
        ] },
    { title: "4 Desks", specialities: ["desks"], manufacturerIds: ["mfr-oak"], amount: 380000, projectLeadIds: ["lead-joke"], status: "in-progress", start: -40, due: 2, assigned: -40, stepsDone: 5 },
    { title: "3 Chairs & Seating", specialities: ["chairs-seating"], manufacturerIds: ["mfr-majeurs"], amount: 300000, projectLeadIds: ["lead-ted"], status: "in-progress", start: -12, due: 21, assigned: -12, stepsDone: 1,
        sentBack: { hoursAgo: 26, reason: "The photos only show the timber. Add one of the seat foam and fabric you bought for this job, with the labels showing." } },
    // In progress, asking for more time
    { title: "2 Leather Seats", specialities: ["leather"], manufacturerIds: ["mfr-leather"], amount: 420000, projectLeadIds: ["lead-latade"], status: "in-progress", start: -25, due: 7, assigned: -25, stepsDone: 3,
        extensionRequests: [
            { id: "ext-7-1", previousDueDate: daysFromNow(7), requestedDueDate: daysFromNow(13), reason: "Our leather supplier delayed the hides by about a week, so upholstery can't start until they arrive.", requestedAt: daysFromNow(-1), status: "pending", decidedAt: null, step: "assembly" },
        ] },
    { title: "8 Throw Pillows", specialities: ["upholstery"], manufacturerIds: ["mfr-majeurs"], amount: 96000, projectLeadIds: ["lead-joke"], status: "in-progress", start: -18, due: 3, assigned: -18, stepsDone: 4 },
    { title: "8 Office Desks & Chairs", specialities: ["desks", "chairs-seating"], manufacturerIds: ["mfr-oak", "mfr-kesino"], amount: 2400000, projectLeadIds: ["lead-ted", "lead-latade"], status: "completed", start: -70, due: -5, assigned: -70, completed: -5,
        manufacturerReview: { rating: 4, comment: "Solid build and delivered on time. One chair base had a scuff, which they replaced the same week.", authorName: "Ted Lasso", createdAt: daysFromNow(-4) },
        leadReviews: [
            { manufacturerId: "mfr-oak", leadId: "lead-ted", rating: 4, comment: "Clear specs and quick reviews. The first site visit was rescheduled twice.", createdAt: daysFromNow(-4) },
            { manufacturerId: "mfr-kesino", leadId: "lead-ted", rating: 5, comment: "Ted kept both workshops in step and answered every call.", createdAt: daysFromNow(-3) },
        ] },
    { title: "2 Cushions", specialities: ["upholstery"], manufacturerIds: ["mfr-vava"], amount: 60000, projectLeadIds: ["lead-mercury"], status: "in-progress", start: -6, due: 21, assigned: -6, stepsDone: 1 },
    // Completed, waiting for the lead's rating
    { title: "Walnut Bookshelf", specialities: ["cabinetry", "wood"], manufacturerIds: ["mfr-kesino"], amount: 310000, projectLeadIds: ["lead-latade"], status: "completed", start: -60, due: -10, assigned: -60, completed: -36, completedBy: null,
        leadReviews: [
            { manufacturerId: "mfr-kesino", leadId: "lead-latade", rating: 4, comment: "Good communication. The work was approved automatically in the end, as no one reviewed it in time.", createdAt: daysFromNow(-35) },
        ] },
    // Rejected for the last time
    { title: "Leather Recliner", specialities: ["leather", "sofas"], manufacturerIds: ["mfr-majeurs"], amount: 520000, projectLeadIds: ["lead-mark"], status: "rejected", start: -45, due: 6, assigned: -45,
        rejections: [
            { ...rejection("rej-12-1", 20, "The recline mechanism sticks halfway and the leather is creased across the seat."), rejectedBy: "Mark Wilson" },
            { ...rejection("rej-12-2", 11, "The mechanism works now, but the leather is noticeably lighter than the approved swatch."), rejectedBy: "Mark Wilson" },
            { ...rejection("rej-12-3", 3, "The replacement leather still doesn't match the swatch, and there's a tear near the left armrest seam."), rejectedBy: "Mark Wilson" },
        ] },
    { title: "Rattan Patio Set", specialities: ["outdoor-furniture"], manufacturerIds: ["mfr-vava"], amount: 690000, projectLeadIds: ["lead-austin"], status: "in-progress", start: -15, due: 28, assigned: -15, stepsDone: 3, waitingHours: [20] },
    // Offered to Majeurs, waiting for their answer
    { title: "Oak Dining Table", specialities: ["wood"], manufacturerIds: ["mfr-majeurs"], amount: 350000, projectLeadIds: ["lead-joke"], status: "pending", start: 5, due: 50 },
    // Rejected once — back with the manufacturer to fix
    { title: "Upholstered Headboard", specialities: ["upholstery", "beds"], manufacturerIds: ["mfr-majeurs"], amount: 275000, projectLeadIds: ["lead-latade"], status: "rejected", start: -50, due: 9, assigned: -50,
        rejections: [rejection("rej-15-1", 1, "The fabric colour doesn't match the approved sample and the stitching along the top edge is uneven. Please redo the upholstery with the approved fabric.")],
        extensionRequests: [
            { id: "ext-15-1", previousDueDate: daysFromNow(4), requestedDueDate: daysFromNow(9), reason: "The approved fabric was back-ordered for five days.", requestedAt: daysFromNow(-22), status: "approved", decidedAt: daysFromNow(-21), step: "assembly" },
        ] },
    { title: "4 Leather Lounge Chairs", specialities: ["leather", "chairs-seating"], manufacturerIds: ["mfr-leather", "mfr-majeurs"], amount: 960000, projectLeadIds: ["lead-latade", "lead-mercury"], status: "in-progress", start: -8, due: 42, assigned: -8, stepsDone: 2, waitingHours: [3], attachments: [{ name: "Lounge Chair Spec.pdf", url: "/lounge-chair-spec.pdf", kind: "document" }, { name: "Lounge chair.webp", url: "/sample-image/sarki-chair.webp", kind: "image" }] },
    // Pending with no manufacturer yet
    { title: "Modular Sectional Sofa", specialities: ["sofas", "upholstery"], manufacturerIds: [], amount: 850000, projectLeadIds: ["lead-latade"], status: "pending", start: 7, due: 67, created: -1,
        description: "A three-piece modular sectional in oatmeal bouclé, with loose back cushions and hidden plinth legs. Each module needs to work on its own and together.",
        applications: [
            { id: "app-17-3", manufacturerId: "mfr-majeurs", appliedAt: hoursAgo(3), status: "pending", decidedAt: null },
            { id: "app-17-2", manufacturerId: "mfr-vava", appliedAt: hoursAgo(26), status: "pending", decidedAt: null },
            { id: "app-17-1", manufacturerId: "mfr-leather", appliedAt: daysFromNow(-3), status: "declined", decidedAt: daysFromNow(-2) },
        ] },
    { title: "Carved Oak Executive Desk", specialities: ["desks", "wood"], manufacturerIds: ["mfr-kesino"], amount: 720000, projectLeadIds: ["lead-austin"], status: "in-progress", start: -9, due: 26, assigned: -9, stepsDone: 2 },
    { title: "Chesterfield Leather Sofa", specialities: ["leather", "sofas"], manufacturerIds: ["mfr-majeurs"], amount: 1100000, projectLeadIds: ["lead-mark"], status: "in-progress", start: -14, due: 42, assigned: -14, stepsDone: 2,
        extensionRequests: [
            { id: "ext-19-1", previousDueDate: daysFromNow(42), requestedDueDate: daysFromNow(50), reason: "The oxblood leather batch arrived with blemishes, and the tannery needs a week to replace it.", requestedAt: daysFromNow(-5), status: "rejected", decidedAt: daysFromNow(-4), step: "frame" },
        ] },
    { title: "Low Slate TV Console", specialities: ["cabinetry"], manufacturerIds: ["mfr-majeurs"], amount: 390000, projectLeadIds: ["lead-joke"], status: "completed", start: -40, due: -8, assigned: -40, completed: -33,
        manufacturerReview: { rating: 4, comment: "Looks great, though the steel legs should have been sealed against rust as the spec asked.", authorName: "Joke Phillips", createdAt: daysFromNow(-33) },
        faultReport: { reason: "One of the steel legs has started to rust at the base, and the slate top rocks slightly.", reportedAt: daysFromNow(-30), reportedBy: "Joke Phillips" },
        leadReviews: [
            { manufacturerId: "mfr-majeurs", leadId: "lead-joke", rating: 5, comment: "Joke answered every question the same day and approved each step quickly.", createdAt: daysFromNow(-32) },
        ] },
    // In review, rated 3 stars by the lead: held for a super admin to review further
    { title: "6 Bar Stools", specialities: ["chairs-seating"], manufacturerIds: ["mfr-majeurs"], amount: 240000, projectLeadIds: ["lead-ted"], status: "in-review", start: -21, due: 5, assigned: -21,
        furtherReview: { rating: 3, comment: "Two of the stools wobble and the footrest welds are rough. I'd like a second opinion before signing off.", authorName: "Ted Lasso", createdAt: hoursAgo(3) } },
    // In progress, after an approved extension
    { title: "Kids' Bunk Bed", specialities: ["beds", "wood"], manufacturerIds: ["mfr-kesino"], amount: 330000, projectLeadIds: ["lead-latade"], status: "in-progress", start: -11, due: 21, assigned: -11, stepsDone: 2,
        extensionRequests: [
            { id: "ext-22-1", previousDueDate: daysFromNow(16), requestedDueDate: daysFromNow(21), reason: "The client changed the ladder to a staircase with storage, which adds about five days.", requestedAt: daysFromNow(-6), status: "approved", decidedAt: daysFromNow(-5), step: "frame" },
        ] },
    { title: "Reception Counter", specialities: ["cabinetry", "wood"], manufacturerIds: ["mfr-oak"], amount: 880000, projectLeadIds: ["lead-mercury"], status: "pending", start: 10, due: 60,
        applications: [{ id: "app-23-1", manufacturerId: "mfr-kesino", appliedAt: hoursAgo(5), status: "pending", decidedAt: null }] },
    { title: "12 Conference Chairs", specialities: ["chairs-seating", "leather"], manufacturerIds: ["mfr-leather"], amount: 1320000, projectLeadIds: ["lead-austin"], status: "in-progress", start: -16, due: 24, assigned: -16, stepsDone: 4 },
    // Completed on time — the bonus paid out
    { title: "Leather Club Chairs", specialities: ["leather", "chairs-seating"], manufacturerIds: ["mfr-majeurs"], amount: 420000, projectLeadIds: ["lead-latade"], status: "completed", start: -56, due: -28, assigned: -56, completed: -29, created: -60,
        manufacturerReview: { rating: 5, comment: "Beautiful stitching, and delivered a day early. The client loved them.", authorName: "Latade Dipe", createdAt: daysFromNow(-28) } },
    // Completed after the due date — no bonus
    { title: "Cushion Arm Rests", specialities: ["upholstery"], manufacturerIds: ["mfr-majeurs"], amount: 250000, projectLeadIds: ["lead-mark"], status: "completed", start: -80, due: -50, assigned: -80, completed: -40, created: -84,
        manufacturerReview: { rating: 4, comment: "Good work overall, though I'd have preferred a deeper shade of brown, and they arrived after the due date.", authorName: "Mark Wilson", createdAt: daysFromNow(-40) },
        leadReviews: [
            { manufacturerId: "mfr-majeurs", leadId: "lead-mark", rating: 3, comment: "Reviews took a while, and the feedback on the cushion colour only came at the end.", createdAt: daysFromNow(-39) },
        ] },
    // Open for applications
    { title: "Upholstered King Bed Frame", specialities: ["beds", "upholstery"], manufacturerIds: [], amount: 540000, projectLeadIds: ["lead-joke"], status: "pending", start: 5, due: 28, created: -2,
        description: "A king-size bed frame fully upholstered in teal performance velvet, with a curved headboard that wraps into the side rails.",
        applications: [
            { id: "app-26-2", manufacturerId: "mfr-kesino", appliedAt: hoursAgo(10), status: "pending", decidedAt: null },
            { id: "app-26-1", manufacturerId: "mfr-majeurs", appliedAt: daysFromNow(-1), status: "pending", decidedAt: null },
        ] },
    { title: "Walnut Media Wall Unit", specialities: ["cabinetry", "wood"], manufacturerIds: [], amount: 780000, projectLeadIds: ["lead-austin"], status: "pending", start: 7, due: 97, created: -3,
        description: "A floor-to-ceiling media wall in oiled walnut, with a floating TV shelf, push-to-open cupboards and hidden cable channels." },
    { title: "Bouclé Accent Chairs", specialities: ["chairs-seating"], manufacturerIds: [], amount: 360000, projectLeadIds: ["lead-mercury"], status: "pending", start: 4, due: 30, created: -5,
        description: "A pair of curved accent chairs in cream bouclé on turned oak legs. Both need to match, with a 45cm seat height." },
    { title: "Custom 4-Door Wardrobe", specialities: ["cabinetry", "wood"], manufacturerIds: [], amount: 420000, projectLeadIds: ["lead-ted"], status: "pending", start: 6, due: 66, created: -6, imageUrl: "/images/image1.png",
        description: "A four-door wardrobe in white oak veneer, with a full-length hanging rail, four inside drawers and soft-close hinges." },
    { title: "Solid Oak Dining Table", specialities: ["wood"], manufacturerIds: [], amount: 185000, projectLeadIds: ["lead-latade"], status: "pending", start: 3, due: 13, created: -7,
        description: "A six-seater dining table in solid oak with a natural oil finish and chamfered square legs." },
];

/** Open for applications — pending, with no manufacturer on it yet. */
export const isOpenJobRecord = (job: Pick<JobRecord, "status" | "manufacturerIds">) =>
    job.status === "pending" && job.manufacturerIds.length === 0;

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

const shiftDays = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();

export const SAMPLE_JOBS: JobRecord[] = JOB_SEEDS.map((seed, index) => {
    const category = seed.specialities[0];
    const photo = seed.imageUrl ?? CATEGORY_PHOTOS[category];
    const leadName = getProjectLead(seed.projectLeadIds[0])?.name ?? "Latade Dipe";
    const created = sampleCreatedAt(seed.created === undefined ? index : -seed.created);
    const createdAt = created.toISOString();
    const dateAssigned = seed.assigned === undefined ? null : daysFromNow(seed.assigned);
    const rejections = seed.rejections ?? [];
    const completedAt = seed.completed === undefined ? null : daysFromNow(seed.completed);
    // Work that's been through review has every step approved and photos in
    const hasSubmitted = ["in-review", "rejected", "completed"].includes(seed.status);
    // The latest finished work sent for review — the day before it was signed off or last rejected
    const submittedForReviewAt = !hasSubmitted
        ? null
        : completedAt
          ? shiftDays(completedAt, -1)
          : seed.status === "rejected" && rejections.length > 0
            ? shiftDays(rejections[rejections.length - 1].rejectedAt, -1)
            : minutesAgo(60 * (2 + index));
    // Step proof went in between acceptance and the day before the work was first sent (or yesterday)
    const firstSentAt = rejections[0] ? shiftDays(rejections[0].rejectedAt, -1) : submittedForReviewAt;
    const stepSubmissions = dateAssigned
        ? sampleStepSubmissions({
              approved: hasSubmitted ? JOB_PRODUCTION_STEPS.length : (seed.stepsDone ?? 0),
              from: new Date(dateAssigned),
              to: new Date(shiftDays(firstSentAt ?? new Date().toISOString(), -1)),
              reviewer: leadName,
              imageUrl: photo,
              waitingSince: (seed.waitingHours ?? []).map((hours) => new Date(hoursAgo(hours))),
          })
        : [];
    const sentBackStep = JOB_PRODUCTION_STEPS[(seed.stepsDone ?? 0) + (seed.waitingHours?.length ?? 0)];
    if (seed.sentBack && sentBackStep) {
        stepSubmissions.push({
            step: sentBackStep.key,
            imageUrls: [photo],
            submittedAt: hoursAgo(seed.sentBack.hoursAgo + 4),
            review: { outcome: "sent-back", at: hoursAgo(seed.sentBack.hoursAgo), by: leadName, reason: seed.sentBack.reason },
        });
    }

    return {
        id: `job-${index + 1}`,
        code: generateJobCode(category, created),
        title: seed.title,
        category,
        manufacturerIds: seed.manufacturerIds,
        amount: seed.amount,
        projectLeadIds: seed.projectLeadIds,
        startDate: daysFromNow(seed.start),
        dueDate: daysFromNow(seed.due),
        dateAssigned,
        status: seed.status,
        description:
            seed.description ?? `A short description of the ${seed.title.toLowerCase()} job, with any finishes, sizes and delivery notes.`,
        imageUrl: photo,
        attachments: seed.attachments ?? [{ name: "Job Spec.pdf", url: "/job-spec.pdf", kind: "document" }],
        notes: seed.notes ?? [],
        // Listed newest first under "All", in seed order
        createdAt,
        stepSubmissions,
        completionImageUrls: hasSubmitted ? [photo, "/images/image1.png"] : [],
        submittedForReviewAt,
        rejections,
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
        furtherReview: seed.furtherReview ?? null,
        leadReviews: seed.leadReviews ?? [],
        completedAt,
        completedBy: completedAt ? (seed.completedBy === undefined ? leadName : seed.completedBy) : null,
        faultReport: seed.faultReport ?? null,
        applications: seed.applications ?? [],
    };
});

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
    const { planId, billingCycle, renewalsPaidFrom } = manufacturer.subscription;
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
