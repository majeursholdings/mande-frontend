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
export type DashboardStatId =
    | "manufacturers"
    | "payouts"
    | "subscription-revenue"
    | "revenue"
    | "shop-sales"
    | "machine-bookings"
    | "success-rate"
    | "active-accounts";

export const ADMIN_DASHBOARD_STAT_IDS: DashboardStatId[] = ["manufacturers", "payouts", "success-rate", "active-accounts"];

/**
 * What the platform earns (from every source), where the admin sees what
 * manufacturers are paid, then the shop and machine bookings, and the work.
 */
export const SUPER_ADMIN_DASHBOARD_STAT_IDS: DashboardStatId[] = [
    "revenue",
    "shop-sales",
    "machine-bookings",
    "manufacturers",
    "success-rate",
    "active-accounts",
];

/** Short, as the overview card design keeps a label to one line. */
export const DASHBOARD_STAT_LABELS: Record<DashboardStatId, string> = {
    manufacturers: "Manufacturers",
    payouts: "Paid to manufacturers",
    "subscription-revenue": "Subscription revenue",
    revenue: "Net revenue",
    "shop-sales": "Shop sales",
    "machine-bookings": "Machine bookings",
    "success-rate": "Success rate",
    "active-accounts": "Active accounts",
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
            ...money(stats.subscriptionRevenueKobo?.value ?? 0),
            changePercent: stats.subscriptionRevenueKobo?.changePercent ?? null,
        },
        revenue: { ...money(stats.revenueKobo?.value ?? 0), changePercent: stats.revenueKobo?.changePercent ?? null },
        "shop-sales": { ...money(stats.shopSalesKobo?.value ?? 0), changePercent: stats.shopSalesKobo?.changePercent ?? null },
        "machine-bookings": {
            ...money(stats.machineBookingsKobo?.value ?? 0),
            changePercent: stats.machineBookingsKobo?.changePercent ?? null,
        },
        "success-rate": {
            // Null until a job has finished: there's no rate yet, not a 0% one
            value: stats.successRate.value === null ? "N/A" : `${stats.successRate.value}%`,
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
