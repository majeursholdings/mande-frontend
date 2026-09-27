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
    sampleStepSubmissions,
    settleStepSubmissions,
    type JobFaultReport,
    type JobPaymentInput,
    type JobPaymentMilestone,
    type StepSubmission,
} from "@/constant/jobWorkflow";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

function hoursAgo(hours: number): string {
    return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
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

export type ProjectLeadRecord = {
    id: string;
    name: string;
    /** Null shows a generated avatar. */
    avatarUrl: string | null;
};

/** The signed-in admin, among the project leads. */
export const SIGNED_IN_LEAD_ID = "lead-latade";
/** The signed-in manufacturer — the manufacturer platform shows their jobs, pay and reviews. */
export const SIGNED_IN_MANUFACTURER_ID = "mfr-majeurs";

export const PROJECT_LEADS: ProjectLeadRecord[] = [
    { id: "lead-latade", name: "Latade Dipe", avatarUrl: null },
    { id: "lead-mark", name: "Mark Wilson", avatarUrl: null },
    { id: "lead-austin", name: "Austin Campbell", avatarUrl: null },
    { id: "lead-joke", name: "Joke Phillips", avatarUrl: null },
    { id: "lead-ted", name: "Ted Lasso", avatarUrl: null },
    { id: "lead-mercury", name: "Mercury Jones", avatarUrl: null },
];

export function getProjectLead(id: string): ProjectLeadRecord | undefined {
    return PROJECT_LEADS.find((lead) => lead.id === id);
}

export type ManufacturerRecord = {
    id: string;
    companyName: string;
    /** The person at the company who posts on jobs. */
    contactName: string;
    phone: string;
    email: string;
    /** ISO date the account was created. */
    joinedAt: string;
};

export const MANUFACTURERS: ManufacturerRecord[] = [
    { id: "mfr-majeurs", companyName: "Majeurs Chesterfield", contactName: "Demi Semande", phone: "+2348012345678", email: "demi@majeurs.ng", joinedAt: daysFromNow(-420) },
    { id: "mfr-vava", companyName: "Vava Furniture Nig. Ltd", contactName: "Samuel Vava", phone: "+2348023456789", email: "samuel@vavafurniture.ng", joinedAt: daysFromNow(-300) },
    { id: "mfr-kesino", companyName: "Kesino Furnitures", contactName: "Kesi Nwosu", phone: "+2348034567890", email: "kesi@kesino.ng", joinedAt: daysFromNow(-210) },
    { id: "mfr-oak", companyName: "Oak & Iron Works", contactName: "Tunde Bakare", phone: "+2348045678901", email: "tunde@oakandiron.ng", joinedAt: daysFromNow(-150) },
    { id: "mfr-leather", companyName: "Lagos Leather Co.", contactName: "Amaka Obi", phone: "+2348056789012", email: "amaka@lagosleather.ng", joinedAt: daysFromNow(-90) },
];

export function getManufacturer(id: string): ManufacturerRecord | undefined {
    return MANUFACTURERS.find((manufacturer) => manufacturer.id === id);
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
    if (job.status !== "in-review" || !job.submittedForReviewAt) return settled;
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
        message: "Job created. Blueprints are attached — the powder coat should be matte black.",
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
        waitingHours: [6, 1] },
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
            { id: "ext-7-1", previousDueDate: daysFromNow(7), requestedDueDate: daysFromNow(13), reason: "Our leather supplier delayed the hides by about a week, so upholstery can't start until they arrive.", requestedAt: daysFromNow(-1), status: "pending", decidedAt: null },
        ] },
    { title: "8 Throw Pillows", specialities: ["upholstery"], manufacturerIds: ["mfr-majeurs"], amount: 96000, projectLeadIds: ["lead-joke"], status: "in-progress", start: -18, due: 3, assigned: -18, stepsDone: 4 },
    { title: "8 Office Desks & Chairs", specialities: ["desks", "chairs-seating"], manufacturerIds: ["mfr-oak", "mfr-kesino"], amount: 2400000, projectLeadIds: ["lead-ted", "lead-latade"], status: "completed", start: -70, due: -5, assigned: -70, completed: -5,
        manufacturerReview: { rating: 4, comment: "Solid build and delivered on time. One chair base had a scuff, which they replaced the same week.", authorName: "Ted Lasso", createdAt: daysFromNow(-4) } },
    { title: "2 Cushions", specialities: ["upholstery"], manufacturerIds: ["mfr-vava"], amount: 60000, projectLeadIds: ["lead-mercury"], status: "in-progress", start: -6, due: 21, assigned: -6, stepsDone: 1 },
    // Completed, waiting for the lead's rating
    { title: "Walnut Bookshelf", specialities: ["cabinetry", "wood"], manufacturerIds: ["mfr-kesino"], amount: 310000, projectLeadIds: ["lead-latade"], status: "completed", start: -60, due: -10, assigned: -60, completed: -36, completedBy: null },
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
        rejections: [rejection("rej-15-1", 1, "The fabric colour doesn't match the approved sample and the stitching along the top edge is uneven. Please redo the upholstery with the approved fabric.")] },
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
    { title: "Chesterfield Leather Sofa", specialities: ["leather", "sofas"], manufacturerIds: ["mfr-majeurs"], amount: 1100000, projectLeadIds: ["lead-mark"], status: "in-progress", start: -14, due: 42, assigned: -14, stepsDone: 2 },
    { title: "Low Slate TV Console", specialities: ["cabinetry"], manufacturerIds: ["mfr-majeurs"], amount: 390000, projectLeadIds: ["lead-joke"], status: "completed", start: -40, due: -8, assigned: -40, completed: -33,
        manufacturerReview: { rating: 3, comment: "Looks great, but the steel legs weren't sealed against rust as the spec asked.", authorName: "Joke Phillips", createdAt: daysFromNow(-31) },
        faultReport: { reason: "One of the steel legs has started to rust at the base, and the slate top rocks slightly.", reportedAt: daysFromNow(-30), reportedBy: "Joke Phillips" } },
    { title: "6 Bar Stools", specialities: ["chairs-seating"], manufacturerIds: ["mfr-majeurs"], amount: 240000, projectLeadIds: ["lead-ted"], status: "in-review", start: -21, due: 5, assigned: -21 },
    // In progress, after an approved extension
    { title: "Kids' Bunk Bed", specialities: ["beds", "wood"], manufacturerIds: ["mfr-kesino"], amount: 330000, projectLeadIds: ["lead-latade"], status: "in-progress", start: -11, due: 21, assigned: -11, stepsDone: 2,
        extensionRequests: [
            { id: "ext-22-1", previousDueDate: daysFromNow(16), requestedDueDate: daysFromNow(21), reason: "The client changed the ladder to a staircase with storage, which adds about five days.", requestedAt: daysFromNow(-6), status: "approved", decidedAt: daysFromNow(-5) },
        ] },
    { title: "Reception Counter", specialities: ["cabinetry", "wood"], manufacturerIds: ["mfr-oak"], amount: 880000, projectLeadIds: ["lead-mercury"], status: "pending", start: 10, due: 60,
        applications: [{ id: "app-23-1", manufacturerId: "mfr-kesino", appliedAt: hoursAgo(5), status: "pending", decidedAt: null }] },
    { title: "12 Conference Chairs", specialities: ["chairs-seating", "leather"], manufacturerIds: ["mfr-leather"], amount: 1320000, projectLeadIds: ["lead-austin"], status: "in-progress", start: -16, due: 24, assigned: -16, stepsDone: 4 },
    // Completed on time — the bonus paid out
    { title: "Leather Club Chairs", specialities: ["leather", "chairs-seating"], manufacturerIds: ["mfr-majeurs"], amount: 420000, projectLeadIds: ["lead-latade"], status: "completed", start: -56, due: -28, assigned: -56, completed: -29, created: -60,
        manufacturerReview: { rating: 5, comment: "Beautiful stitching, and delivered a day early. The client loved them.", authorName: "Latade Dipe", createdAt: daysFromNow(-28) } },
    // Completed after the due date — no bonus
    { title: "Cushion Arm Rests", specialities: ["upholstery"], manufacturerIds: ["mfr-majeurs"], amount: 250000, projectLeadIds: ["lead-mark"], status: "completed", start: -80, due: -50, assigned: -80, completed: -40, created: -84,
        manufacturerReview: { rating: 3, comment: "Would have preferred a deeper shade of brown for the cushions, and they arrived after the due date.", authorName: "Mark Wilson", createdAt: daysFromNow(-39) } },
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

// ─── Wallets ─────────────────────────────────────────────────────────────────

/**
 * Money a manufacturer took out of their wallet — a withdrawal to their
 * bank, or a plan paid from the balance. What's paid in comes from their
 * jobs (see getJobRecordPayouts).
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
    {
        id: "debit-1",
        manufacturerId: "mfr-majeurs",
        type: "withdrawal",
        label: "Withdrawal",
        amount: 300000,
        date: daysFromNow(-20),
    },
];
