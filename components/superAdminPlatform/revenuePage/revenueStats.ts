import { ADMIN_MANUFACTURERS, MAX_ADMIN_JOB_REJECTIONS, type AdminJob } from "@/constant/admin";
import { JOB_BONUS_PERCENT } from "@/constant/jobWorkflow";
import { getPricingPlan } from "@/constant/sampleData";
import {
    getJobRecordCharges,
    getJobRecordPayouts,
    getManufacturer,
    getSubscriptionPayments,
    type ManufacturerRecord,
} from "@/constant/sampleDb";

// ─────────────────────────────────────────────────────────────────────────────
// The platform's own money, for the super admin's Revenue page: what comes
// in (manufacturers' plan payments, and the charges for rejected work) and
// the on-time bonuses Mande pays out of it. Worked out from the records, so
// it follows along as jobs move. Job installments aren't here: they're the
// manufacturers' pay (see Transactions).
// ─────────────────────────────────────────────────────────────────────────────

export type RevenueEntryType = "subscription" | "charge" | "bonus";

export const REVENUE_ENTRY_TYPES: { value: RevenueEntryType; label: string }[] = [
    { value: "subscription", label: "Subscription" },
    { value: "charge", label: "Rejection charge" },
    { value: "bonus", label: "On-time bonus" },
];

export const getRevenueTypeLabel = (type: RevenueEntryType) =>
    REVENUE_ENTRY_TYPES.find((option) => option.value === type)?.label ?? type;

export type RevenueEntry = {
    id: string;
    type: RevenueEntryType;
    /** Money in to Mande, or out (bonuses). */
    direction: "in" | "out";
    manufacturerId: string;
    manufacturerName: string;
    companyName: string;
    avatarUrl: string | null;
    /** The plan paid for, or the job. */
    description: string;
    /** e.g. "Paid by card", "Rejection 2 of 3". */
    detail: string;
    /** ISO date. */
    date: string;
    /** In naira, always positive — `direction` says which way. */
    amount: number;
};

/** Every revenue entry up to `now`, newest first. Accounts deleted since still count, for the record. */
export function getRevenueEntries(jobs: AdminJob[], now: Date = new Date()): RevenueEntry[] {
    const who = (manufacturer: ManufacturerRecord | undefined, id: string) => ({
        manufacturerId: id,
        manufacturerName: manufacturer?.contactName ?? "Deleted account",
        companyName: manufacturer?.companyName ?? "",
        avatarUrl: manufacturer?.avatarUrl ?? null,
    });

    const subscriptions = ADMIN_MANUFACTURERS.flatMap((manufacturer) =>
        getSubscriptionPayments(manufacturer, now).map(
            (payment): RevenueEntry => ({
                id: `revenue-${payment.id}`,
                type: "subscription",
                direction: "in",
                ...who(manufacturer, manufacturer.id),
                description: `${getPricingPlan(payment.planId)?.name ?? "Plan"} plan${payment.billingCycle === "annual" ? " (yearly)" : ""}`,
                detail: payment.paidFrom === "card" ? "Paid by card" : "Paid from their wallet",
                date: payment.paidAt,
                amount: payment.amount,
            }),
        ),
    );

    const charges = jobs.flatMap((job) =>
        getJobRecordCharges(job).map(
            (charge): RevenueEntry => ({
                id: `revenue-${charge.id}`,
                type: "charge",
                direction: "in",
                ...who(getManufacturer(charge.manufacturerId), charge.manufacturerId),
                description: charge.jobTitle,
                detail: `Rejection ${charge.rejectionNumber} of ${MAX_ADMIN_JOB_REJECTIONS}`,
                date: charge.chargedAt,
                amount: charge.amount,
            }),
        ),
    );

    const bonuses = jobs.flatMap((job) =>
        getJobRecordPayouts(job, now)
            .filter((payout) => payout.milestone === "bonus")
            .map(
                (payout): RevenueEntry => ({
                    id: `revenue-${payout.id}`,
                    type: "bonus",
                    direction: "out",
                    ...who(getManufacturer(payout.manufacturerId), payout.manufacturerId),
                    description: payout.jobTitle,
                    detail: `${JOB_BONUS_PERCENT}% for delivering on time`,
                    date: payout.paidAt,
                    amount: payout.amount,
                }),
            ),
    );

    return [...subscriptions, ...charges, ...bonuses]
        .filter((entry) => new Date(entry.date) <= now)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a.id.localeCompare(b.id));
}

export type RevenueSummary = Record<RevenueEntryType, { total: number; count: number }> & {
    /** What came in, less the bonuses paid. */
    net: number;
};

export function getRevenueSummary(entries: RevenueEntry[]): RevenueSummary {
    const summary: RevenueSummary = {
        subscription: { total: 0, count: 0 },
        charge: { total: 0, count: 0 },
        bonus: { total: 0, count: 0 },
        net: 0,
    };
    for (const entry of entries) {
        summary[entry.type].total += entry.amount;
        summary[entry.type].count += 1;
        summary.net += entry.direction === "in" ? entry.amount : -entry.amount;
    }
    return summary;
}
