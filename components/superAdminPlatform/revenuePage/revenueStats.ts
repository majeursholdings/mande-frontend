import { fromKobo } from "@/lib/currency";
import type {
    RevenueArea,
    RevenueEntry as ApiRevenueEntry,
    RevenueSummary as ApiRevenueSummary,
} from "@/lib/services/reportsService";

// ─────────────────────────────────────────────────────────────────────────────
// The platform's own money, for the super admin's Revenue page, from the
// API's /reports/revenue, in four areas:
//  - jobs: installments and on-time bonuses paid to manufacturers out (what
//    clients pay for jobs isn't recorded, and rejection charges are a
//    penalty, not income)
//  - the shop: MANDE stock sold and the platform charge on manufacturers'
//    sales in; MANDE's part of refunds, and reward points spent, out
//  - machine bookings: paid bookings in; refunds out
//  - subscriptions: manufacturers' plan payments in
// Shaped here for the page, in naira.
// ─────────────────────────────────────────────────────────────────────────────

export type RevenueEntryType = ApiRevenueEntry["type"];

export const REVENUE_ENTRY_TYPES: { value: RevenueEntryType; label: string }[] = [
    { value: "installment", label: "Installment" },
    { value: "bonus", label: "On-time bonus" },
    { value: "shop-sale", label: "Shop sale" },
    { value: "shop-charge", label: "Shop platform charge" },
    { value: "affiliate", label: "Reward points spent" },
    { value: "machine-booking", label: "Machine booking" },
    { value: "subscription", label: "Subscription" },
];

export const REVENUE_AREAS: { value: RevenueArea; label: string }[] = [
    { value: "jobs", label: "Jobs" },
    { value: "shop", label: "Shop" },
    { value: "bookings", label: "Machine bookings" },
    { value: "subscriptions", label: "Subscriptions" },
];

export const getRevenueTypeLabel = (type: RevenueEntryType) =>
    REVENUE_ENTRY_TYPES.find((option) => option.value === type)?.label ?? type;

export type RevenueEntry = {
    id: string;
    type: RevenueEntryType;
    area: RevenueArea;
    /** Money in to Mande, or out (installments, bonuses and refunds). */
    direction: "in" | "out";
    /** Null for a guest's machine booking or a shop customer: there's no manufacturer page to open. */
    manufacturerId: string | null;
    manufacturerName: string;
    companyName: string;
    avatarUrl: string | null;
    /** The plan paid for, the job, the machine booking or the shop order. */
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
        area: entry.area,
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

/** An area's money in, out and what's left, in naira. */
export type AreaTotals = { in: number; out: number; net: number };

export type RevenueSummary = {
    areas: Record<RevenueArea, AreaTotals>;
    /** Everything that came in, before anything went out. */
    gross: number;
    /** Every area's in less its out. */
    net: number;
    counts: {
        installments: number;
        bonuses: number;
        bookings: number;
        bookingRefunds: number;
        shopSales: number;
        shopCharges: number;
        plans: number;
    };
};

const NO_AREA = { inKobo: 0, outKobo: 0, netKobo: 0 };

/** /reports/revenue/summary's totals (kobo), as the cards' (naira). */
export function toRevenueSummary(summary: ApiRevenueSummary): RevenueSummary {
    const area = (key: RevenueArea): AreaTotals => {
        const totals = summary.areas?.[key] ?? NO_AREA;
        return { in: fromKobo(totals.inKobo), out: fromKobo(totals.outKobo), net: fromKobo(totals.netKobo) };
    };
    return {
        areas: { jobs: area("jobs"), shop: area("shop"), bookings: area("bookings"), subscriptions: area("subscriptions") },
        gross: fromKobo(summary.grossKobo ?? 0),
        net: fromKobo(summary.netKobo),
        counts: {
            installments: summary.installment?.count ?? 0,
            bonuses: summary.bonus.count,
            bookings: summary.machineBooking?.count ?? 0,
            bookingRefunds: summary.machineBooking?.refundedCount ?? 0,
            shopSales: summary.shopSale?.count ?? 0,
            shopCharges: summary.shopCharge?.count ?? 0,
            plans: summary.subscription.count,
        },
    };
}
