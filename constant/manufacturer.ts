import type { SelectOption } from "@/components/form/types";
import type { SelectFilterItem } from "@/components/customTable/types";
import type { StatusTone } from "@/components/customTable/statusBadge";
import {
    LayoutGrid,
    ListChecks,
    GitBranch,
    FolderClosed,
    UserRound,
    type LucideIcon,
} from "lucide-react";

export type RegistrationStep = {
    label: string;
};

export const REGISTRATION_STEPS: RegistrationStep[] = [
    { label: "User details" },
    { label: "Verify email" },
    { label: "About company" },
    { label: "Company specifications" },
];

export const OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 59;

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

export const AUTH_HEADLINE = "Top quality furniture delivered to your doorstep.";
export const AUTH_HERO_IMAGE = "/images/carpenter_working.png";

// ─────────────────────────────────────────────────────────────────────────────
// Manufacturer dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const MANUFACTURER_DASHBOARD_URL = "/manufacturer/dashboard";
export const MANUFACTURER_JOBS_URL = "/manufacturer/jobs";
export const MANUFACTURER_TIMELINE_URL = "/manufacturer/timeline";
export const MANUFACTURER_FILES_URL = "/manufacturer/files";
export const MANUFACTURER_PROFILE_URL = "/manufacturer/profile";

export type ManufacturerNavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
};

export const MANUFACTURER_NAV_ITEMS: ManufacturerNavItem[] = [
    { label: "Dashboard", href: MANUFACTURER_DASHBOARD_URL, icon: LayoutGrid },
    { label: "Jobs", href: MANUFACTURER_JOBS_URL, icon: ListChecks },
    { label: "Timeline", href: MANUFACTURER_TIMELINE_URL, icon: GitBranch },
    { label: "Files", href: MANUFACTURER_FILES_URL, icon: FolderClosed },
    { label: "Profile", href: MANUFACTURER_PROFILE_URL, icon: UserRound },
];

export const CURRENT_MANUFACTURER_USER = {
    name: "Demi Semande",
};

export type DashboardStat = {
    id: string;
    label: string;
    value: string;
    icon: "jobs" | "amount" | "delivery" | "quality";
};

export const DASHBOARD_STATS: DashboardStat[] = [
    { id: "jobs-completed", label: "Total Jobs Completed", value: "24", icon: "jobs" },
    { id: "amount-made", label: "Total Amount Made", value: "₦1,800,000", icon: "amount" },
    { id: "delivery-rate", label: "Delivery Success Rate", value: "92%", icon: "delivery" },
    { id: "quality-rating", label: "Quality Control Rating", value: "4 /5", icon: "quality" },
];

export type JobStatisticsRange = "weekly" | "monthly";

export type JobStatisticsPoint = {
    label: string;
    successful: number;
    unsuccessful: number;
};

type JobStatisticsValues = {
    axisMax: number;
    axisStep: number;
    performance: number;
    values: { successful: number; unsuccessful: number }[];
};

// Sample successful/unsuccessful counts, oldest first — labels are generated
// at read time relative to "today" (see getJobStatistics below) so the chart
// always shows the last 7 days / last 12 months instead of a fixed Sun–Sat
// or Jan–Dec range.
const JOB_STATISTICS_VALUES: Record<JobStatisticsRange, JobStatisticsValues> = {
    weekly: {
        axisMax: 8,
        axisStep: 2,
        performance: 86,
        values: [
            { successful: 5, unsuccessful: 1 },
            { successful: 3, unsuccessful: 0 },
            { successful: 1, unsuccessful: 1 },
            { successful: 8, unsuccessful: 0 },
            { successful: 1, unsuccessful: 4 },
            { successful: 1, unsuccessful: 2 },
            { successful: 6, unsuccessful: 0 },
        ],
    },
    monthly: {
        axisMax: 20,
        axisStep: 5,
        performance: 88,
        values: [
            { successful: 12, unsuccessful: 0 },
            { successful: 4, unsuccessful: 0 },
            { successful: 1, unsuccessful: 0 },
            { successful: 19, unsuccessful: 0 },
            { successful: 3, unsuccessful: 10 },
            { successful: 1, unsuccessful: 1 },
            { successful: 13, unsuccessful: 0 },
            { successful: 17, unsuccessful: 0 },
            { successful: 2, unsuccessful: 3 },
            { successful: 2, unsuccessful: 0 },
            { successful: 11, unsuccessful: 0 },
            { successful: 18, unsuccessful: 0 },
        ],
    },
};

function getLastNDayLabels(n: number, referenceDate: Date): string[] {
    const labels: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
        const date = new Date(referenceDate);
        date.setDate(referenceDate.getDate() - i);
        labels.push(date.toLocaleDateString("en-US", { weekday: "short" }));
    }
    return labels;
}

function getLastNMonthLabels(n: number, referenceDate: Date): string[] {
    const labels: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
        const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
        labels.push(date.toLocaleDateString("en-US", { month: "short" }));
    }
    return labels;
}

/**
 * Builds job statistics for the given range with labels relative to
 * `referenceDate` (defaults to now) — the last 7 days for "weekly", the
 * last 12 months for "monthly" — instead of a fixed calendar range.
 */
export function getJobStatistics(
    range: JobStatisticsRange,
    referenceDate: Date = new Date(),
): { axisMax: number; axisStep: number; performance: number; data: JobStatisticsPoint[] } {
    const { axisMax, axisStep, performance, values } = JOB_STATISTICS_VALUES[range];
    const labels =
        range === "weekly"
            ? getLastNDayLabels(values.length, referenceDate)
            : getLastNMonthLabels(values.length, referenceDate);

    return {
        axisMax,
        axisStep,
        performance,
        data: values.map((point, index) => ({ label: labels[index], ...point })),
    };
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
