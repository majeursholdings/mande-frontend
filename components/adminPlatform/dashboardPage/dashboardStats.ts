import { formatCompactPrice, formatPrice } from "@/lib/currency";
import {
    ADMIN_JOB_STATUS_CONFIG,
    getAdminManufacturer,
    getJobPayouts,
    isRejectionFinal,
    type AdminJob,
    type AdminJobStatus,
    type AdminManufacturer,
    type AdminTransaction,
    type PendingProgressReview,
} from "@/constant/admin";
import { JOB_PRODUCTION_STEPS } from "@/constant/jobWorkflow";

// ─────────────────────────────────────────────────────────────────────────────
// The dashboard's numbers, worked out from the jobs (and manufacturers), so
// they follow along as jobs are created, approved or rejected. A job counts
// as successful once it's completed, and unsuccessful once it's rejected for
// the last time (closed).
// ─────────────────────────────────────────────────────────────────────────────

/** The date a job closed — its final rejection. Null if it hasn't. */
function getClosedAt(job: AdminJob): string | null {
    return isRejectionFinal(job) ? (job.rejections.at(-1)?.rejectedAt ?? null) : null;
}

/** Whether `date` had happened by `at`. */
const isBy = (date: string | null, at: Date) => date !== null && new Date(date) <= at;

// ─── Headline stats ──────────────────────────────────────────────────────────

export type AdminDashboardStat = {
    id: string;
    label: string;
    value: string;
    /** Small, after the value — e.g. "/68" out of all accounts. */
    valueSuffix?: string;
    /** Full value for the tooltip when `value` is shortened, e.g. "₦19,400,000". */
    fullValue?: string;
    /**
     * Change since a month ago — signed, e.g. 12 or -8; percentage points
     * for a rate. Null when there was nothing a month ago to compare with.
     */
    changePercent: number | null;
    icon: "manufacturers" | "payouts" | "success-rate" | "active-accounts";
};

type Snapshot = {
    manufacturers: number;
    /** Installments paid out to manufacturers, in naira. */
    payouts: number;
    /** Completed jobs out of every completed or closed one. Null before any finish. */
    successRate: number | null;
    /** Manufacturers with a job underway — accepted, not yet completed or closed. */
    activeManufacturers: number;
};

/** The headline numbers as they stood at `at`. */
function getSnapshot(jobs: AdminJob[], manufacturers: AdminManufacturer[], at: Date): Snapshot {
    const joined = manufacturers.filter((manufacturer) => isBy(manufacturer.joinedAt, at));
    const completed = jobs.filter((job) => isBy(job.completedAt, at));
    const closedCount = jobs.filter((job) => isBy(getClosedAt(job), at)).length;
    const underway = jobs.filter(
        (job) => isBy(job.dateAssigned, at) && !isBy(job.completedAt, at) && !isBy(getClosedAt(job), at),
    );

    return {
        manufacturers: joined.length,
        payouts: jobs
            .flatMap((job) => getJobPayouts(job, at))
            .filter((payout) => isBy(payout.date, at))
            .reduce((sum, payout) => sum + payout.amount, 0),
        successRate:
            completed.length + closedCount === 0 ? null : (completed.length / (completed.length + closedCount)) * 100,
        activeManufacturers: joined.filter((manufacturer) =>
            underway.some((job) => job.manufacturerIds.includes(manufacturer.id)),
        ).length,
    };
}

/** 0 → 0 is no change; anything from 0 has nothing to compare with. */
function percentChange(now: number, before: number): number | null {
    if (before === 0) return now === 0 ? 0 : null;
    return Math.round(((now - before) / before) * 100);
}

function pointChange(now: number | null, before: number | null): number | null {
    if (before === null) return now === null ? 0 : null;
    return Math.round((now ?? 0) - before);
}

export function getDashboardStats(
    jobs: AdminJob[],
    manufacturers: AdminManufacturer[],
    now: Date = new Date(),
): AdminDashboardStat[] {
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const current = getSnapshot(jobs, manufacturers, now);
    const previous = getSnapshot(jobs, manufacturers, monthAgo);

    return [
        {
            id: "manufacturers",
            label: "Total Number of Manufacturers",
            value: String(current.manufacturers),
            changePercent: percentChange(current.manufacturers, previous.manufacturers),
            icon: "manufacturers",
        },
        {
            id: "payouts",
            label: "Total Manufacturer Payouts",
            value: formatCompactPrice(current.payouts),
            fullValue: formatPrice(current.payouts),
            changePercent: percentChange(current.payouts, previous.payouts),
            icon: "payouts",
        },
        {
            id: "success-rate",
            label: "Production Success Rate",
            value: `${Math.round(current.successRate ?? 0)}%`,
            changePercent: pointChange(current.successRate, previous.successRate),
            icon: "success-rate",
        },
        {
            id: "active-accounts",
            label: "Active Manufacturer Accounts",
            value: String(current.activeManufacturers),
            valueSuffix: `/${current.manufacturers}`,
            changePercent: percentChange(current.activeManufacturers, previous.activeManufacturers),
            icon: "active-accounts",
        },
    ];
}

// ─── Job statistics ──────────────────────────────────────────────────────────

export type JobStatisticsRange = "weekly" | "monthly";

export type JobStatisticsPoint = {
    label: string;
    successful: number;
    unsuccessful: number;
};

/** Each bar group: its label, and whether a date falls in it. */
function getPeriods(range: JobStatisticsRange, now: Date): { label: string; contains: (date: Date) => boolean }[] {
    if (range === "monthly") {
        // The last 12 months, this one included
        return Array.from({ length: 12 }, (_, index) => {
            const month = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
            return {
                label: month.toLocaleString("en-US", { month: "short" }),
                contains: (date) =>
                    date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth(),
            };
        });
    }
    // The last 7 days, today included
    return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index);
        return {
            label: day.toLocaleString("en-US", { weekday: "short" }),
            contains: (date) => date.toDateString() === day.toDateString(),
        };
    });
}

const AXIS_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500];

/** Jobs completed (successful) and closed (unsuccessful) per month or day, with a y-axis of four steps. */
export function getJobStatistics(
    jobs: AdminJob[],
    range: JobStatisticsRange,
    now: Date = new Date(),
): { data: JobStatisticsPoint[]; axisMax: number; axisStep: number } {
    const completedDates = jobs.flatMap((job) => (job.completedAt ? [new Date(job.completedAt)] : []));
    const closedDates = jobs.flatMap((job) => {
        const closedAt = getClosedAt(job);
        return closedAt ? [new Date(closedAt)] : [];
    });

    const data = getPeriods(range, now).map(({ label, contains }) => ({
        label,
        successful: completedDates.filter(contains).length,
        unsuccessful: closedDates.filter(contains).length,
    }));

    const tallest = Math.max(...data.map((point) => Math.max(point.successful, point.unsuccessful)));
    const axisStep = AXIS_STEPS.find((step) => step * 4 >= tallest) ?? Math.ceil(tallest / 4);
    return { data, axisMax: axisStep * 4, axisStep };
}

// ─── Jobs by status ──────────────────────────────────────────────────────────

export type JobStatusCount = {
    status: AdminJobStatus;
    label: string;
    count: number;
};

/** Donut order, from 12 o'clock. */
const DONUT_STATUSES: AdminJobStatus[] = ["completed", "in-progress", "in-review", "rejected", "pending"];

export function getJobStatusCounts(jobs: AdminJob[]): JobStatusCount[] {
    return DONUT_STATUSES.map((status) => ({
        status,
        label: ADMIN_JOB_STATUS_CONFIG[status].label,
        count: jobs.filter((job) => job.status === status).length,
    }));
}

// ─── Recent transactions ─────────────────────────────────────────────────────

/** The latest installments paid out, newest first. */
export function getRecentTransactions(jobs: AdminJob[], limit = 4, now: Date = new Date()): AdminTransaction[] {
    return jobs
        .flatMap((job) => getJobPayouts(job, now))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
}

// ─── Pending progress reviews ────────────────────────────────────────────────

/**
 * Updates waiting for a lead, newest first: finished work on every job in
 * review, and step proof on jobs in progress.
 */
export function getPendingProgressReviews(jobs: AdminJob[]): PendingProgressReview[] {
    const manufacturerName = (job: AdminJob) =>
        getAdminManufacturer(job.manufacturerIds[0])?.contactName ?? "Manufacturer";

    return jobs
        .flatMap((job): PendingProgressReview[] => {
            if (job.status === "in-review" && job.submittedForReviewAt && job.completionImageUrls[0]) {
                return [
                    {
                        id: `review-${job.id}`,
                        jobId: job.id,
                        jobTitle: job.title,
                        manufacturerName: manufacturerName(job),
                        imageUrl: job.completionImageUrls[0],
                        stepsCompleted: JOB_PRODUCTION_STEPS.length,
                        submittedAt: job.submittedForReviewAt,
                    },
                ];
            }
            if (job.status !== "in-progress") return [];
            return job.stepSubmissions.flatMap((submission) =>
                submission.review || !submission.imageUrls[0]
                    ? []
                    : [
                          {
                              id: `review-${job.id}-${submission.step}`,
                              jobId: job.id,
                              jobTitle: job.title,
                              manufacturerName: manufacturerName(job),
                              imageUrl: submission.imageUrls[0],
                              // Counting the step this proof is for
                              stepsCompleted: JOB_PRODUCTION_STEPS.findIndex((step) => step.key === submission.step) + 1,
                              submittedAt: submission.submittedAt,
                          },
                      ],
            );
        })
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}
