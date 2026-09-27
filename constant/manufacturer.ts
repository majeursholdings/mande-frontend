import type { SelectOption } from "@/components/form/types";
import type { SelectFilterItem } from "@/components/customTable/types";
import type { StatusTone } from "@/components/customTable/statusBadge";
import { DEFAULT_CURRENCY_CODE } from "@/constant/global";
import { getCountryName } from "@/constant/africanCountries";
import { formatCompactPrice } from "@/lib/currency";
import type { BillingCycle } from "@/constant/sampleData";
import {
    LayoutGrid,
    ListChecks,
    ReceiptText,
    Star,
    UserRound,
    type LucideIcon,
} from "lucide-react";

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

export type DashboardStat = {
    id: string;
    label: string;
    value: string;
    icon: "jobs" | "amount" | "delivery" | "quality";
};

export const DASHBOARD_STATS: DashboardStat[] = [
    { id: "jobs-completed", label: "Total Jobs Completed", value: "24", icon: "jobs" },
    { id: "amount-made", label: "Total Amount Made", value: formatCompactPrice(1_800_000), icon: "amount" },
    { id: "delivery-rate", label: "Delivery Success Rate", value: "92%", icon: "delivery" },
    { id: "quality-rating", label: "Quality Control Rating", value: "4 /5", icon: "quality" },
];

export type JobStatus =
    | "pending"
    | "in-progress"
    | "in-review"
    | "completed"
    | "cancelled"
    /** The finished work was sent for review and turned down by an admin. */
    | "rejected";

// ─────────────────────────────────────────────────────────────────────────────
// Job production steps — the manufacturer ticks these off, in order, from the
// job detail panel. Completing every step unlocks the finished-furniture
// photo upload, which is what actually marks the job as done.
//
// Each time an admin rejects the finished work, a "Rejected" step (recorded by
// the admin) and a "Redeliver" step (completed when the manufacturer resubmits
// with new photo proof) are appended. These are derived from the job's
// rejection history rather than stored — see getJobSteps below. A job can be
// rejected at most MAX_JOB_REJECTIONS times; after the last one it can't be
// resubmitted, so no "Redeliver" step follows it.
// ─────────────────────────────────────────────────────────────────────────────

export type ProductionStepKey =
    | "design"
    | "materials"
    | "frame"
    | "assembly"
    | "finishing"
    | "delivery";

export type ProductionStep = {
    /** A ProductionStepKey, or a derived rejection step key like "rejected-2". */
    key: string;
    label: string;
    /** "danger" renders the completed step in red with an X instead of a check. */
    tone?: "danger";
};

export const MAX_JOB_REJECTIONS = 3;

export const JOB_PRODUCTION_STEPS: { key: ProductionStepKey; label: string }[] = [
    { key: "design", label: "Design" },
    { key: "materials", label: "Materials" },
    { key: "frame", label: "Frame" },
    { key: "assembly", label: "Assembly" },
    { key: "finishing", label: "Finishing" },
    { key: "delivery", label: "Delivery" },
];


export type JobAssignee = {
    name: string;
    role: string;
    phone: string;
};

/** Every job shares the same customer-side point of contact for now. */
export const DEFAULT_JOB_ASSIGNEE: JobAssignee = {
    name: "Toni Campbell",
    role: "Project assistant",
    phone: "+2348012345678",
};

export type JobAttachment = {
    name: string;
    url: string;
};

function daysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

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
    completedStepKeys,
    rejections,
    status,
}: {
    completedStepKeys: ProductionStepKey[];
    rejections: JobRejection[];
    status: JobStatus;
}): { steps: ProductionStep[]; completedCount: number } {
    const steps: ProductionStep[] = [...JOB_PRODUCTION_STEPS];
    let completedCount = completedStepKeys.length;
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
    /** ISO date string the job is due. */
    dueDate: string;
    commentCount: number;
    /** What the manufacturer is paid for the job, in naira. */
    price: number;
    /** A COMPANY_SPECIALITY_OPTIONS value, e.g. "upholstery". */
    category: string;
    status: JobStatus;
    assignee: JobAssignee | null;
    attachments: JobAttachment[];
    /** Production steps completed so far, in `JOB_PRODUCTION_STEPS` order. */
    completedStepKeys: ProductionStepKey[];
    /** The latest finished-furniture photo(s) the manufacturer submitted. */
    completionImageUrls?: string[];
    /** Every time an admin rejected the work, oldest first (max MAX_JOB_REJECTIONS). */
    rejections?: JobRejection[];
};

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

export const JOBS: Job[] = [
    {
        id: "job-1",
        code: "MD00133",
        title: "4 Cushions & Seating Fabric",
        description: "A short description of this job goes here.",
        assignedLabel: "Yet to be assigned",
        assignedDaysAgo: null,
        dateAssigned: null,
        dueDate: daysFromNow(49),
        commentCount: 0,
        price: 180000,
        category: "upholstery",
        status: "pending",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [
            {
                name: "Blueprint DEMO.pdf",
                url: "/blueprint-DEMO.pdf",
            },
        ],
        completedStepKeys: [],
    },
    {
        id: "job-2",
        code: "MD00125",
        title: "Metal Fabrication",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 2 days ago",
        assignedDaysAgo: 2,
        dateAssigned: daysFromNow(-2),
        dueDate: daysFromNow(7),
        commentCount: 1,
        price: 450000,
        category: "outdoor-furniture",
        status: "in-progress",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [
            { name: "M.F Blueprint.pdf", url: "/mf-blueprint.pdf" },
            { name: "Blueprint DEMO.pdf", url: "/blueprint-DEMO.pdf" },
        ],
        completedStepKeys: ["design", "materials"],
    },
    {
        id: "job-3",
        code: "MD00126",
        title: "2 Beds & 1 Desk",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 4 days ago",
        assignedDaysAgo: 4,
        dateAssigned: daysFromNow(-4),
        dueDate: daysFromNow(21),
        commentCount: 6,
        price: 620000,
        category: "beds",
        status: "in-progress",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [{ name: "Bed Design.pdf", url: "/bed-design.pdf" }],
        completedStepKeys: ["design"],
    },
    {
        id: "job-4",
        code: "MD00127",
        title: "3 Tables & Carver Chairs",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 1 week ago",
        assignedDaysAgo: 7,
        dateAssigned: daysFromNow(-7),
        dueDate: daysFromNow(14),
        commentCount: 3,
        price: 540000,
        category: "chairs-seating",
        status: "in-progress",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [
            { name: "Table Blueprint.pdf", url: "/table-design.pdf" },
        ],
        completedStepKeys: ["design", "materials", "frame"],
    },
    {
        id: "job-5",
        code: "MD00128",
        title: "4 Desks",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 2 weeks ago",
        assignedDaysAgo: 14,
        dateAssigned: daysFromNow(-14),
        dueDate: daysFromNow(3),
        commentCount: 1,
        price: 380000,
        category: "desks",
        status: "in-review",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [{ name: "Desk Blueprint.pdf", url: "/desk-design.pdf" }],
        completedStepKeys: JOB_PRODUCTION_STEPS.map((step) => step.key),
        completionImageUrls: ["/images/image1.png"],
    },
    {
        id: "job-6",
        code: "MD00129",
        title: "3 Chairs & Seating",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 6 weeks ago",
        assignedDaysAgo: 42,
        dateAssigned: daysFromNow(-42),
        dueDate: daysFromNow(-14),
        commentCount: 9,
        price: 300000,
        category: "chairs-seating",
        status: "completed",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [
            { name: "Chair Blueprint.pdf", url: "/chair-design.pdf" },
        ],
        completedStepKeys: JOB_PRODUCTION_STEPS.map((step) => step.key),
        completionImageUrls: ["/images/image1.png"],
    },
    {
        id: "job-7",
        code: "MD00130",
        title: "2 Leather Seats",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 8 weeks ago",
        assignedDaysAgo: 56,
        dateAssigned: daysFromNow(-56),
        dueDate: daysFromNow(-28),
        commentCount: 6,
        price: 420000,
        category: "leather",
        status: "completed",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [
            {
                name: "Leather Seat Blueprint.pdf",
                url: "/leather-seat-design.pdf",
            },
        ],
        completedStepKeys: JOB_PRODUCTION_STEPS.map((step) => step.key),
        completionImageUrls: ["/images/default-img.png"],
    },
    {
        id: "job-8",
        code: "MD00131",
        title: "Metal Fabrication",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 8 weeks ago",
        assignedDaysAgo: 56,
        dateAssigned: daysFromNow(-56),
        dueDate: daysFromNow(-30),
        commentCount: 4,
        price: 450000,
        category: "outdoor-furniture",
        status: "completed",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [{ name: "M.F Blueprint.pdf", url: "/MF-Blueprint.pdf" }],
        completedStepKeys: JOB_PRODUCTION_STEPS.map((step) => step.key),
        completionImageUrls: ["/images/image1.png"],
    },
    {
        id: "job-9",
        code: "MD00132",
        title: "8 Throw Pillows",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 10 weeks ago",
        assignedDaysAgo: 70,
        dateAssigned: daysFromNow(-70),
        dueDate: daysFromNow(-45),
        commentCount: 12,
        price: 96000,
        category: "upholstery",
        status: "completed",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [{ name: "Pillow Spec.pdf", url: "/pillow-spec.pdf" }],
        completedStepKeys: JOB_PRODUCTION_STEPS.map((step) => step.key),
        completionImageUrls: ["/images/default-img.png"],
    },
    {
        id: "job-10",
        code: "MD00134",
        title: "Oak Dining Table",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 3 weeks ago",
        assignedDaysAgo: 21,
        dateAssigned: daysFromNow(-21),
        dueDate: daysFromNow(10),
        commentCount: 2,
        price: 350000,
        category: "wood",
        status: "cancelled",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [
            { name: "Dining Table Blueprint.pdf", url: "/dining-table-design.pdf" },
        ],
        completedStepKeys: ["design", "materials"],
    },
    {
        id: "job-11",
        code: "MD00135",
        title: "Upholstered Headboard",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 5 weeks ago",
        assignedDaysAgo: 35,
        dateAssigned: daysFromNow(-35),
        dueDate: daysFromNow(-2),
        commentCount: 5,
        price: 275000,
        category: "upholstery",
        status: "rejected",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [
            { name: "Headboard Spec.pdf", url: "/headboard-spec.pdf" },
        ],
        completedStepKeys: JOB_PRODUCTION_STEPS.map((step) => step.key),
        completionImageUrls: ["/images/image1.png", "/images/default-img.png"],
        rejections: [
            {
                reason: "The fabric colour doesn't match the approved sample and the stitching along the top edge is uneven. Please redo the upholstery using the approved fabric.",
                rejectedAt: daysFromNow(-1),
                imageUrls: ["/images/image1.png", "/images/default-img.png"],
            },
        ],
    },
    // Rejected twice — one resubmission left
    {
        id: "job-12",
        code: "MD00136",
        title: "Walnut Bookshelf",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 6 weeks ago",
        assignedDaysAgo: 42,
        dateAssigned: daysFromNow(-42),
        dueDate: daysFromNow(-5),
        commentCount: 8,
        price: 310000,
        category: "cabinetry",
        status: "rejected",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [
            { name: "Bookshelf Blueprint.pdf", url: "/bookshelf-design.pdf" },
        ],
        completedStepKeys: JOB_PRODUCTION_STEPS.map((step) => step.key),
        completionImageUrls: ["/images/default-img.png", "/images/image1.png"],
        rejections: [
            {
                reason: "Two of the shelves are visibly warped and don't sit level. Please replace them with properly dried walnut.",
                rejectedAt: daysFromNow(-10),
                imageUrls: ["/images/image1.png"],
            },
            {
                reason: "The shelves are fixed, but the finish has drip marks along the left side panel. Please sand it back and refinish.",
                rejectedAt: daysFromNow(-2),
                imageUrls: ["/images/default-img.png", "/images/image1.png"],
            },
        ],
    },
    // Rejected the maximum number of times — can no longer be resubmitted
    {
        id: "job-13",
        code: "MD00137",
        title: "Leather Recliner",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 9 weeks ago",
        assignedDaysAgo: 63,
        dateAssigned: daysFromNow(-63),
        dueDate: daysFromNow(-12),
        commentCount: 14,
        price: 520000,
        category: "leather",
        status: "rejected",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [
            { name: "Recliner Spec.pdf", url: "/recliner-spec.pdf" },
        ],
        completedStepKeys: JOB_PRODUCTION_STEPS.map((step) => step.key),
        completionImageUrls: ["/images/image1.png"],
        rejections: [
            {
                reason: "The recline mechanism sticks halfway and the leather is creased across the seat.",
                rejectedAt: daysFromNow(-20),
                imageUrls: ["/images/default-img.png"],
            },
            {
                reason: "The mechanism now works, but the leather colour is noticeably lighter than the approved swatch.",
                rejectedAt: daysFromNow(-11),
                imageUrls: ["/images/image1.png", "/images/default-img.png"],
            },
            {
                reason: "The replacement leather still doesn't match the approved swatch, and there is a tear near the left armrest seam.",
                rejectedAt: daysFromNow(-3),
                imageUrls: ["/images/image1.png"],
            },
        ],
    },
    // Rejected once, then resubmitted — back in review
    {
        id: "job-14",
        code: "MD00138",
        title: "Rattan Patio Set",
        description: "A short description of this job goes here.",
        assignedLabel: "Assigned 4 weeks ago",
        assignedDaysAgo: 28,
        dateAssigned: daysFromNow(-28),
        dueDate: daysFromNow(4),
        commentCount: 3,
        price: 690000,
        category: "outdoor-furniture",
        status: "in-review",
        assignee: DEFAULT_JOB_ASSIGNEE,
        attachments: [
            { name: "Patio Set Spec.pdf", url: "/patio-set-spec.pdf" },
        ],
        completedStepKeys: JOB_PRODUCTION_STEPS.map((step) => step.key),
        completionImageUrls: ["/images/image1.png"],
        rejections: [
            {
                reason: "One of the chair legs is shorter than the others, so the chair rocks. Please level all four legs.",
                rejectedAt: daysFromNow(-4),
                imageUrls: ["/images/default-img.png"],
            },
        ],
    },
];

/** Dashboard "Recent Jobs": active jobs, newest assignment first (unassigned count as newest). */
export const RECENT_JOBS: Job[] = JOBS.filter(
    (job) => job.status === "pending" || job.status === "in-progress",
)
    .sort((a, b) => (a.assignedDaysAgo ?? -1) - (b.assignedDaysAgo ?? -1))
    .slice(0, 4);

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
    /** ISO date the finished furniture is due. */
    dueDate: string;
    /** ISO date the job was posted. */
    postedAt: string;
    /** A photo of the furniture to make — every open job has one. */
    imageUrl: string;
    attachments: JobAttachment[];
};

export const OPEN_JOB_SORT_OPTIONS: SelectFilterItem[] = [
    { label: "Name", value: "name" },
    { label: "Date posted", value: "date" },
    { label: "Due date", value: "due-date" },
    { label: "Category", value: "category" },
    { label: "Pay", value: "price" },
];

export const OPEN_JOBS: OpenJob[] = [
    {
        id: "open-1",
        code: "MD00139",
        title: "Modular Sectional Sofa",
        description:
            "A three-piece modular sectional in oatmeal bouclé, with loose back cushions and hidden plinth legs. Each module needs to work on its own and together.",
        category: "sofas",
        price: 850000,
        dueDate: daysFromNow(42),
        postedAt: daysFromNow(0),
        imageUrl: "/sample-image/sectional-sofa.png",
        attachments: [{ name: "Sectional Spec.pdf", url: "/sectional-spec.pdf" }],
    },
    {
        id: "open-2",
        code: "MD00140",
        title: "Carved Oak Executive Desk",
        description:
            "A solid oak executive desk with a hand-carved diamond pattern across the front and sides, sitting on two block plinths. Oiled, not lacquered.",
        category: "desks",
        price: 720000,
        dueDate: daysFromNow(35),
        postedAt: daysFromNow(-1),
        imageUrl: "/sample-image/table.webp",
        attachments: [{ name: "Desk Drawings.pdf", url: "/desk-drawings.pdf" }],
    },
    {
        id: "open-3",
        code: "MD00141",
        title: "Upholstered King Bed Frame",
        description:
            "A king-size bed frame fully upholstered in teal performance velvet, with a curved headboard that wraps into the side rails.",
        category: "beds",
        price: 540000,
        dueDate: daysFromNow(28),
        postedAt: daysFromNow(-2),
        imageUrl: "/sample-image/bed.webp",
        attachments: [{ name: "Bed Frame Spec.pdf", url: "/bed-frame-spec.pdf" }],
    },
    {
        id: "open-4",
        code: "MD00142",
        title: "4 Leather Lounge Chairs",
        description:
            "Four lounge chairs in tan leather with open wooden arms and tapered dark legs, for a hotel lobby. All four need to match exactly.",
        category: "chairs-seating",
        price: 960000,
        dueDate: daysFromNow(49),
        postedAt: daysFromNow(-4),
        imageUrl: "/sample-image/sarki-chair.webp",
        attachments: [{ name: "Lounge Chair Spec.pdf", url: "/lounge-chair-spec.pdf" }],
    },
    {
        id: "open-5",
        code: "MD00143",
        title: "Low Slate TV Console",
        description:
            "A long, low TV console with a honed slate top on two blackened steel slab legs. Cable routing through the back of the legs.",
        category: "cabinetry",
        price: 390000,
        dueDate: daysFromNow(21),
        postedAt: daysFromNow(-6),
        imageUrl: "/sample-image/tv-console.webp",
        attachments: [],
    },
    {
        id: "open-6",
        code: "MD00144",
        title: "Chesterfield Leather Sofa",
        description:
            "A classic three-seat Chesterfield in oxblood leather, with deep button tufting, rolled arms and turned wooden feet.",
        category: "leather",
        price: 1100000,
        dueDate: daysFromNow(56),
        postedAt: daysFromNow(-9),
        imageUrl: "/images/image1.png",
        attachments: [{ name: "Chesterfield Spec.pdf", url: "/chesterfield-spec.pdf" }],
    },
];

export type JobApplication = {
    /** An OPEN_JOBS id. */
    jobId: string;
    /** ISO date the manufacturer applied. */
    appliedAt: string;
};

export const MANUFACTURER_JOB_APPLICATIONS: JobApplication[] = [
    { jobId: "open-3", appliedAt: daysFromNow(-1) },
];

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

export const NOTIFICATIONS: NotificationItem[] = [
    {
        id: "notif-1",
        message: "Metal Fabrication job is currently under review",
        timestamp: "4 hrs ago",
        isRead: false,
    },
    {
        id: "notif-2",
        message: "Toni Campbell sent an attachment to you",
        timestamp: "12 hrs ago",
        isRead: false,
        avatarName: "Toni Campbell",
    },
    {
        id: "notif-3",
        message: "You have 3 pending jobs awaiting a response",
        timestamp: "1 day ago",
        isRead: false,
    },
    {
        id: "notif-4",
        message: "Toni Campbell has assigned a new job order to you.",
        linkLabel: "View details",
        href: MANUFACTURER_JOBS_URL,
        timestamp: "3 days ago",
        isRead: true,
        avatarName: "Toni Campbell",
    },
    {
        id: "notif-5",
        message: "Toni Campbell has been assigned as your project assistant",
        timestamp: "4 days ago",
        isRead: true,
    },
];

export const RECENT_SEARCHES = ["Cushions", "Desks", "Fabrication"];

// ─────────────────────────────────────────────────────────────────────────────
// Manufacturer profile — the signed-in manufacturer's account and company
// details, wallet (balance, bank account, transactions) and reviews. Sample
// data until the backend is connected. The EMPTY_* shapes (and an empty
// reviews list) are what a brand-new account looks like — every profile
// screen has an empty state for them.
// ─────────────────────────────────────────────────────────────────────────────

export type SocialLoginProvider = "google" | "facebook";

/** How the second step of two-factor authentication is done. */
export type TwoFactorMethod = "email" | "app";

export type ManufacturerSecurity = {
    /** Accounts linked for one-click login — the linked account's email, null when not linked. */
    linkedAccounts: Record<SocialLoginProvider, string | null>;
    /** Null when two-factor authentication is off. */
    twoFactorMethod: TwoFactorMethod | null;
};

export type ManufacturerAddress = {
    streetAddress: string;
    city: string;
    state: string;
    /** ISO country code, e.g. "NG" — African countries only (see AFRICAN_COUNTRIES). */
    country: string;
};

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

/** Where a submitted document (NIN card, tax number, business license number) is in verification. */
export type VerificationStatus =
    | "pending"
    | "processing"
    | "verified"
    | "rejected"
    | "manual_review";

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

/** A new or resubmitted document, waiting to be checked. */
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

export type ManufacturerNinCard = DocumentVerification & {
    /** Null when no photo has been uploaded. */
    imageUrl: string | null;
};

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

export const MANUFACTURER_PROFILE: ManufacturerProfile = {
    firstName: "Demi",
    lastName: "Semande",
    email: "demi@example.com",
    phoneNumber: "+234 801 234 5678",
    dateOfBirth: "1990-05-14T12:00:00.000Z",
    avatarUrl: null,
    joinedAt: "2022-01-12T12:00:00.000Z",
    companyName: "Majeurs Chesterfield",
    // Not submitted yet — the sample account is on the Solo plan, which doesn't need them.
    // Fill a number in and set its verification status to see that on the About Company tab
    companyTaxNumber: "",
    companyTaxNumberVerification: PENDING_VERIFICATION,
    businessLicenseNumber: "",
    businessLicenseNumberVerification: PENDING_VERIFICATION,
    companyAddress: {
        streetAddress: "20, Peacock Drive",
        city: "Lekki",
        state: "Lagos",
        country: "NG",
    },
    specialities: ["beds", "desks", "chairs-seating"],
    staffRange: "21-30",
    productionLeadTime: "5-8-weeks",
    // Set status to any VerificationStatus to see that state. A rejectionReason
    // (e.g. "The photo is too blurry to read.") is optional, and only shown when rejected
    ninCard: {
        imageUrl: "/sample-image/nin-card-sample.svg",
        status: "rejected",
        rejectionReason: null,
    },
    security: {
        linkedAccounts: { google: null, facebook: null },
        twoFactorMethod: null,
    },
};

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
     * account, "subscription" for a plan paid from the wallet balance.
     */
    type: "payment" | "withdrawal" | "subscription";
    /** e.g. "First installment", or "Withdrawal". */
    label: string;
    /** Title of the job a payment is for. Null for withdrawals. */
    projectName: string | null;
    /** ISO date of the transaction. */
    date: string;
    /** In naira — always positive; `type` says which way it went. */
    amount: number;
};

export const TRANSACTION_SORT_OPTIONS: SelectFilterItem[] = [
    { label: "Project name", value: "project-name" },
    { label: "Date", value: "date" },
    { label: "Amount", value: "amount" },
];

/** Newest first — the order the profile preview and "All" sort show. */
const SAMPLE_TRANSACTIONS: ManufacturerTransaction[] = [
    {
        id: "txn-1",
        type: "payment",
        label: "First installment",
        projectName: "Metal Fabrication",
        date: "2022-03-04T12:00:00.000Z",
        amount: 100000,
    },
    {
        id: "txn-2",
        type: "payment",
        label: "Second installment",
        projectName: "Metal Fabrication",
        date: "2022-02-24T12:00:00.000Z",
        amount: 80000,
    },
    {
        id: "txn-3",
        type: "payment",
        label: "Third installment",
        projectName: "4 Cushions & Seating Fabric",
        date: "2022-02-01T12:00:00.000Z",
        amount: 300000,
    },
    {
        id: "txn-4",
        type: "payment",
        label: "First installment",
        projectName: "3 Tables & Carver Chairs",
        date: "2022-01-13T12:00:00.000Z",
        amount: 250000,
    },
    {
        id: "txn-5",
        type: "payment",
        label: "Second installment",
        projectName: "2 Leather Seats",
        date: "2022-01-10T12:00:00.000Z",
        amount: 250000,
    },
    {
        id: "txn-6",
        type: "payment",
        label: "Third installment",
        projectName: "3 Tables & Carver Chairs",
        date: "2022-01-04T12:00:00.000Z",
        amount: 250000,
    },
    {
        id: "txn-7",
        type: "withdrawal",
        label: "Withdrawal",
        projectName: null,
        date: "2021-12-28T12:00:00.000Z",
        amount: 300000,
    },
    {
        id: "txn-8",
        type: "payment",
        label: "Third installment",
        projectName: "Cushion Arm Rests",
        date: "2021-12-23T12:00:00.000Z",
        amount: 250000,
    },
    {
        id: "txn-9",
        type: "payment",
        label: "First installment",
        projectName: "8 Throw Pillows",
        date: "2021-12-15T12:00:00.000Z",
        amount: 250000,
    },
];

/** Account numbers are 10-digit NUBANs. */
export const BANK_ACCOUNT_NUMBER_LENGTH = 10;

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

export const MANUFACTURER_WALLET: ManufacturerWallet = {
    balance: 400000,
    bankAccount: null,
    transactions: SAMPLE_TRANSACTIONS,
};

/**
 * Nigerian banks, labelled by name with the bank's code as the value. Sample
 * list until the banking API provides it.
 */
export const NIGERIAN_BANKS: SelectOption[] = [
    { label: "Access Bank", value: "044" },
    { label: "Citibank Nigeria", value: "023" },
    { label: "Ecobank Nigeria", value: "050" },
    { label: "Fidelity Bank", value: "070" },
    { label: "First Bank of Nigeria", value: "011" },
    { label: "First City Monument Bank", value: "214" },
    { label: "Globus Bank", value: "00103" },
    { label: "Guaranty Trust Bank", value: "058" },
    { label: "Heritage Bank", value: "030" },
    { label: "Keystone Bank", value: "082" },
    { label: "Kuda Bank", value: "50211" },
    { label: "Moniepoint MFB", value: "50515" },
    { label: "OPay", value: "999992" },
    { label: "PalmPay", value: "999991" },
    { label: "Polaris Bank", value: "076" },
    { label: "Providus Bank", value: "101" },
    { label: "Stanbic IBTC Bank", value: "221" },
    { label: "Standard Chartered Bank", value: "068" },
    { label: "Sterling Bank", value: "232" },
    { label: "Union Bank of Nigeria", value: "032" },
    { label: "United Bank for Africa", value: "033" },
    { label: "Unity Bank", value: "215" },
    { label: "Wema Bank", value: "035" },
    { label: "Zenith Bank", value: "057" },
];

export type ManufacturerReview = {
    id: string;
    customerName: string;
    /** 1–5 stars. */
    rating: number;
    comment: string;
};

/** Newest first — the order the profile preview and reviews page show. */
export const MANUFACTURER_REVIEWS: ManufacturerReview[] = [
    {
        id: "review-1",
        customerName: "Latade Dipe",
        rating: 4,
        comment:
            "The office table I ordered from Mande actually exceeded my expectation, the specifications were 100% accurate! 👍🏽",
    },
    {
        id: "review-2",
        customerName: "James O.",
        rating: 4,
        comment:
            "The throw pillows came right on time, the attention to detail is second to none. 🙌🏽🙌🏽",
    },
    {
        id: "review-3",
        customerName: "Priscilla Adams",
        rating: 3,
        comment: "Would have preferred a deeper shade of brown for my cushions. 🤔",
    },
    {
        id: "review-4",
        customerName: "Vanessa Jacobs",
        rating: 3,
        comment: "Would have preferred a deeper shade of brown for my cushions. 🤔",
    },
    {
        id: "review-5",
        customerName: "Christian Adams",
        rating: 3,
        comment: "Would have preferred a deeper shade of brown for my cushions. 🤔",
    },
    {
        id: "review-6",
        customerName: "Ebun Bento",
        rating: 3,
        comment: "Would have preferred a deeper shade of brown for my cushions. 🤔",
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Subscription — the manufacturer's plan (a PRICING_PLANS id) and the cards
// saved for paying for it. Sample data until the backend is connected.
// ─────────────────────────────────────────────────────────────────────────────

export type ManufacturerSubscription = {
    /** A PRICING_PLANS id, e.g. "workshop". */
    planId: string;
    billingCycle: BillingCycle;
    /** ISO date the current billing period ends and the plan renews. */
    renewsAt: string;
    /** Cancelled by the manufacturer — the plan stays active until renewsAt, then ends. */
    cancelAtPeriodEnd: boolean;
    /** A downgrade waiting to take effect at renewsAt. Null when none is scheduled. */
    scheduledPlanId: string | null;
};

export type SavedCard = {
    id: string;
    brand: "Visa" | "Mastercard" | "Verve";
    last4: string;
    /** "MM/YY" */
    expiry: string;
};

export const MANUFACTURER_SUBSCRIPTION: ManufacturerSubscription = {
    planId: "solo",
    billingCycle: "monthly",
    renewsAt: daysFromNow(18),
    cancelAtPeriodEnd: false,
    scheduledPlanId: null,
};

export const MANUFACTURER_SAVED_CARDS: SavedCard[] = [
    { id: "card-1", brand: "Visa", last4: "4242", expiry: "08/27" },
];
