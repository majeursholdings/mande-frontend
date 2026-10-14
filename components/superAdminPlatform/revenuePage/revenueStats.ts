import { fromKobo } from "@/lib/currency";
import type { RevenueEntry as ApiRevenueEntry, RevenueSummary as ApiRevenueSummary } from "@/lib/services/reportsService";

// ─────────────────────────────────────────────────────────────────────────────
// The platform's own money, for the super admin's Revenue page, from the
// API's /reports/revenue: what comes in (manufacturers' plan payments, the
// charges for rejected work, and paid machine bookings) and what goes back
// out (the on-time bonuses Mande pays, and machine booking refunds). Job installments aren't here: they're the manufacturers' pay (see
// Transactions). Shaped here for the page, in naira.
// ─────────────────────────────────────────────────────────────────────────────

export type RevenueEntryType = "subscription" | "charge" | "bonus" | "machine-booking";

export const REVENUE_ENTRY_TYPES: { value: RevenueEntryType; label: string }[] = [
    { value: "subscription", label: "Subscription" },
    { value: "charge", label: "Rejection charge" },
    { value: "bonus", label: "On-time bonus" },
    { value: "machine-booking", label: "Machine booking" },
];

export const getRevenueTypeLabel = (type: RevenueEntryType) =>
    REVENUE_ENTRY_TYPES.find((option) => option.value === type)?.label ?? type;

export type RevenueEntry = {
    id: string;
    type: RevenueEntryType;
    /** Money in to Mande, or out (bonuses, machine booking refunds). */
    direction: "in" | "out";
    /** Null for a guest's machine booking: there's no manufacturer page to open. */
    manufacturerId: string | null;
    manufacturerName: string;
    companyName: string;
    avatarUrl: string | null;
    /** The plan paid for, the job, or the machine booking. */
    description: string;
    /** e.g. "Paid by card", "Collected". */
    detail: string;
    /** ISO date. */
    date: string;
    /** In naira, always positive: `direction` says which way. */
    amount: number;
};

export function toRevenueEntry(entry: ApiRevenueEntry): RevenueEntry {
    return {
        id: entry.id,
        type: entry.type,
        direction: entry.direction,
        manufacturerId: entry.manufacturerId,
        manufacturerName: entry.manufacturerName,
        companyName: entry.companyName,
        avatarUrl: entry.avatar?.url ?? null,
        description: entry.description,
        detail: entry.detail,
        date: entry.date,
        amount: fromKobo(entry.amountKobo),
    };
}

type RevenueTotal = { total: number; count: number };

export type RevenueSummary = {
    subscription: RevenueTotal;
    charge: RevenueTotal;
    bonus: RevenueTotal;
    /** Paid bookings less refunds (total, count), and what was refunded. */
    machineBooking: RevenueTotal & { refunded: number; refundedCount: number };
    /** What came in, less the bonuses paid (refunded bookings never count as in). */
    net: number;
};

/** /reports/revenue/summary's totals (kobo), as the cards' (naira). */
export function toRevenueSummary(summary: ApiRevenueSummary): RevenueSummary {
    return {
        subscription: { total: fromKobo(summary.subscription.totalKobo), count: summary.subscription.count },
        charge: { total: fromKobo(summary.charge.totalKobo), count: summary.charge.count },
        bonus: { total: fromKobo(summary.bonus.totalKobo), count: summary.bonus.count },
        machineBooking: {
            total: fromKobo(summary.machineBooking?.totalKobo ?? 0),
            count: summary.machineBooking?.count ?? 0,
            refunded: fromKobo(summary.machineBooking?.refundedKobo ?? 0),
            refundedCount: summary.machineBooking?.refundedCount ?? 0,
        },
        net: fromKobo(summary.netKobo),
    };
}
