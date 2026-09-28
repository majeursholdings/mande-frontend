import {
    ADMIN_JOB_STATUS_CONFIG,
    ADMIN_POSITION_OPTIONS,
    type AdminJob,
    type AdminJobStatus,
    type AdminPerson,
} from "@/constant/admin";
import { getJobRecordPayouts } from "@/constant/sampleDb";

// ─────────────────────────────────────────────────────────────────────────────
// The Reporting page's numbers, worked out from the jobs, so they follow
// along as admins and manufacturers act: jobs by status and the jobs' key
// figures over a period, and how each project lead is doing.
// ─────────────────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReportPeriod = "all" | "year" | "month" | "week";

export const REPORT_PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
    { value: "all", label: "All time" },
    { value: "year", label: "Last 12 months" },
    { value: "month", label: "Last 30 days" },
    { value: "week", label: "Last 7 days" },
];

const PERIOD_DAYS: Record<Exclude<ReportPeriod, "all">, number> = { year: 365, month: 30, week: 7 };

/** Whether `date` falls in the period up to `now`. */
function isInPeriod(date: string | null, period: ReportPeriod, now: Date): boolean {
    if (!date) return false;
    const time = new Date(date).getTime();
    if (time > now.getTime()) return false;
    return period === "all" || time >= now.getTime() - PERIOD_DAYS[period] * DAY_MS;
}

// ─── Job activity ────────────────────────────────────────────────────────────

export type JobActivityCount = { status: AdminJobStatus; label: string; count: number };

/** The bars' order, as in the design: closed first, finished last. */
const ACTIVITY_STATUSES: AdminJobStatus[] = ["rejected", "pending", "in-progress", "in-review", "completed"];

/** The jobs created in the period, by where each is now. */
export function getJobActivity(jobs: AdminJob[], period: ReportPeriod, now: Date = new Date()): JobActivityCount[] {
    const created = jobs.filter((job) => isInPeriod(job.createdAt, period, now));
    return ACTIVITY_STATUSES.map((status) => ({
        status,
        label: ADMIN_JOB_STATUS_CONFIG[status].label,
        count: created.filter((job) => job.status === status).length,
    }));
}

// ─── Jobs data ───────────────────────────────────────────────────────────────

export type JobsData = {
    /** Created in the period. */
    created: number;
    /** What the jobs created in the period pay their manufacturers, in naira. */
    value: number;
    /** Paid out to manufacturers in the period, in naira. */
    paidOut: number;
    /** Signed off in the period. */
    completed: number;
    /** Of those, signed off by their due date. Null when none were signed off. */
    onTimePercent: number | null;
    /** From accepted to signed off, for those. Null when none were signed off. */
    averageDaysToComplete: number | null;
    /** Step proof sent back in the period. */
    stepsSentBack: number;
    /** Finished work rejected in the period. */
    rejections: number;
    /** Asked for in the period, and how many were given. */
    extensionsRequested: number;
    extensionsApproved: number;
    /** Found in delivered work in the period. */
    faults: number;
};

export function getJobsData(jobs: AdminJob[], period: ReportPeriod, now: Date = new Date()): JobsData {
    const inPeriod = (date: string | null) => isInPeriod(date, period, now);
    const created = jobs.filter((job) => inPeriod(job.createdAt));
    const completed = jobs.filter((job) => inPeriod(job.completedAt));
    const daysToComplete = completed.flatMap((job) =>
        job.dateAssigned && job.completedAt
            ? [(new Date(job.completedAt).getTime() - new Date(job.dateAssigned).getTime()) / DAY_MS]
            : [],
    );
    const extensions = jobs.flatMap((job) => job.extensionRequests).filter((request) => inPeriod(request.requestedAt));

    return {
        created: created.length,
        value: created.reduce((sum, job) => sum + job.amount, 0),
        paidOut: jobs
            .flatMap((job) => getJobRecordPayouts(job, now))
            .filter((payout) => inPeriod(payout.paidAt))
            .reduce((sum, payout) => sum + payout.amount, 0),
        completed: completed.length,
        onTimePercent:
            completed.length === 0
                ? null
                : Math.round(
                      (completed.filter((job) => new Date(job.completedAt as string) <= new Date(job.dueDate)).length /
                          completed.length) *
                          100,
                  ),
        averageDaysToComplete:
            daysToComplete.length === 0
                ? null
                : Math.round(daysToComplete.reduce((sum, days) => sum + days, 0) / daysToComplete.length),
        stepsSentBack: jobs
            .flatMap((job) => job.stepSubmissions)
            .filter((submission) => submission.review?.outcome === "sent-back" && inPeriod(submission.review.at)).length,
        rejections: jobs.flatMap((job) => job.rejections).filter((rejection) => inPeriod(rejection.rejectedAt)).length,
        extensionsRequested: extensions.length,
        extensionsApproved: extensions.filter((request) => request.status === "approved").length,
        faults: jobs.filter((job) => inPeriod(job.faultReport?.reportedAt ?? null)).length,
    };
}

// ─── Project lead report ─────────────────────────────────────────────────────

export type ProjectLeadReportRow = {
    id: string;
    name: string;
    avatarUrl: string | null;
    /** An ADMIN_POSITION_OPTIONS value, for the filter. */
    position: string;
    positionLabel: string;
    /** Jobs they lead or led. */
    jobsHandled: number;
    /** How many times manufacturers have rated them, once a job was completed. */
    reviews: number;
    /** What manufacturers rated them, out of 5, on average. Null before their first rating. */
    averageRating: number | null;
};

/** Each project lead's numbers — the most jobs handled first. */
export function getProjectLeadReport(jobs: AdminJob[], leads: AdminPerson[]): ProjectLeadReportRow[] {
    return leads
        .map((lead): ProjectLeadReportRow => {
            const ratings = jobs.flatMap((job) =>
                job.leadReviews.filter((review) => review.leadId === lead.id).map((review) => review.rating),
            );
            return {
                id: lead.id,
                name: lead.name,
                avatarUrl: lead.avatarUrl,
                position: lead.position,
                positionLabel: ADMIN_POSITION_OPTIONS.find((option) => option.value === lead.position)?.label ?? "",
                jobsHandled: jobs.filter((job) => job.projectLeadIds.includes(lead.id)).length,
                reviews: ratings.length,
                averageRating: ratings.length === 0 ? null : ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
            };
        })
        .sort((a, b) => b.jobsHandled - a.jobsHandled || a.name.localeCompare(b.name));
}
