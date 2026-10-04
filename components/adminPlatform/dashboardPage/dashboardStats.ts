import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import { TOTAL_PRODUCTION_STEPS, type PendingProgressReview } from "@/constant/admin";
import { JOB_PRODUCTION_STEPS } from "@/constant/jobWorkflow";
import type { DashboardStats, PendingReview } from "@/lib/services/reportsService";

// ─────────────────────────────────────────────────────────────────────────────
// The dashboard's numbers come from the API's /reports endpoints (worked out
// there from the records). Here they're shaped for the cards.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Headline stats ──────────────────────────────────────────────────────────

/** Each headline number a staff dashboard can show: the admin's four, and the super admin's. */
export type DashboardStatId = "manufacturers" | "payouts" | "subscription-revenue" | "success-rate" | "active-accounts";

export const ADMIN_DASHBOARD_STAT_IDS: DashboardStatId[] = ["manufacturers", "payouts", "success-rate", "active-accounts"];

/** Money in before money out: what the platform earns, where the admin sees what manufacturers are paid. */
export const SUPER_ADMIN_DASHBOARD_STAT_IDS: DashboardStatId[] = [
    "manufacturers",
    "subscription-revenue",
    "success-rate",
    "active-accounts",
];

export const DASHBOARD_STAT_LABELS: Record<DashboardStatId, string> = {
    manufacturers: "Total Number of Manufacturers",
    payouts: "Total Manufacturer Payouts",
    "subscription-revenue": "Total Subscription Revenue",
    "success-rate": "Production Success Rate",
    "active-accounts": "Active Manufacturer Accounts",
};

export type AdminDashboardStat = {
    id: DashboardStatId;
    label: string;
    value: string;
    /** Small, after the value: e.g. "/68" out of all accounts. */
    valueSuffix?: string;
    /** Full value for the tooltip when `value` is shortened, e.g. "₦19,400,000". */
    fullValue?: string;
    /**
     * Change since a month ago: signed, e.g. 12 or -8; percentage points
     * for a rate. Null when there was nothing a month ago to compare with.
     */
    changePercent: number | null;
};

/** The `statIds` headline numbers from /reports/dashboard, in that order. */
export function toDashboardStats(
    stats: DashboardStats,
    statIds: DashboardStatId[] = ADMIN_DASHBOARD_STAT_IDS,
): AdminDashboardStat[] {
    const money = (kobo: number) => ({
        value: formatCompactPrice(fromKobo(kobo)),
        fullValue: formatPrice(fromKobo(kobo)),
    });
    const all: Record<DashboardStatId, Omit<AdminDashboardStat, "id" | "label">> = {
        manufacturers: {
            value: String(stats.manufacturers.value),
            changePercent: stats.manufacturers.changePercent,
        },
        payouts: { ...money(stats.payoutsKobo.value), changePercent: stats.payoutsKobo.changePercent },
        "subscription-revenue": {
            ...money(stats.subscriptionRevenueKobo.value),
            changePercent: stats.subscriptionRevenueKobo.changePercent,
        },
        "success-rate": {
            value: `${stats.successRate.value ?? 0}%`,
            changePercent: stats.successRate.changePercent,
        },
        "active-accounts": {
            value: String(stats.activeManufacturers.value),
            valueSuffix: `/${stats.activeManufacturers.total}`,
            changePercent: stats.activeManufacturers.changePercent,
        },
    };
    return statIds.map((id) => ({ id, label: DASHBOARD_STAT_LABELS[id], ...all[id] }));
}

// ─── Pending progress reviews ────────────────────────────────────────────────

/**
 * A review from /reports/pending-reviews, as the card's row. The API has no
 * photo or job code: `imageUrl` and `jobCode` come from the job the
 * dashboard already has loaded, if it does.
 */
export function toPendingProgressReview(review: PendingReview): PendingProgressReview {
    const stepIndex = JOB_PRODUCTION_STEPS.findIndex((step) => step.key === review.step);
    return {
        id: `${review.jobId}-${review.kind}-${review.step ?? "finished"}`,
        jobId: review.jobId,
        jobCode: review.jobCode ?? undefined,
        jobTitle: review.jobTitle,
        manufacturerName: review.manufacturerName,
        imageUrl: review.imageUrl ?? "",
        // Counting the step this proof is for
        stepsCompleted: review.kind === "finished-work" ? TOTAL_PRODUCTION_STEPS : stepIndex + 1,
        submittedAt: review.submittedAt,
    };
}
