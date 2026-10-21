"use client";

import Link from "next/link";
import { BriefcaseBusiness, CalendarClock, ChevronRight, History, Store, TrendingUp } from "lucide-react";
import { SUPER_ADMIN_ACTIVITY_LOG_URL } from "@/constant/superAdmin";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import FinanceSeriesCard from "./financeSeriesCard";

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminReportingPage: the platform's money over time, each part with
// its own chart and time frame: MANDE's revenue (money in against money
// out, and what jobs, the shop, machine bookings and subscriptions each
// left), jobs (paid to manufacturers against the charges for rejected work),
// the shop (what customers paid against refunds) and machine bookings (paid
// against refunded). Each shows how it moved against the period before.
// How the jobs themselves are going is under Jobs (Job review).
// ─────────────────────────────────────────────────────────────────────────────

/** primary-700: money in. */
const IN_COLOR = "#08783e";
/** error-400: money going back out. */
const OUT_COLOR = "#f87171";
/** indigo-500: the shop's sales. */
const SHOP_COLOR = "#6366f1";
/** warning-500: machine bookings. */
const BOOKINGS_COLOR = "#f59e0b";

const naira = (kobo: number) => `${kobo < 0 ? "−" : ""}${formatPrice(fromKobo(Math.abs(kobo)))}`;
const nairaTick = (kobo: number) => `${kobo < 0 ? "−" : ""}${formatCompactPrice(fromKobo(Math.abs(kobo)))}`;

export default function SuperAdminReportingPage() {
    return (
        <div className="flex flex-col gap-8 lg:gap-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold font-text text-mist-950">Reporting</h1>
                    <p className="text-sm font-text text-mist-500">MANDE&apos;s money over time: revenue, jobs, the shop and machine bookings.</p>
                </div>
                <Link
                    href={SUPER_ADMIN_ACTIVITY_LOG_URL}
                    className="flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium font-text text-mist-900 transition-colors hover:bg-mist-50"
                >
                    <History className="size-4 text-mist-500" aria-hidden />
                    Activity Log
                    <ChevronRight className="size-4 text-mist-400" aria-hidden />
                </Link>
            </div>

            <FinanceSeriesCard
                metric="revenue"
                title="Revenue"
                icon={TrendingUp}
                headline={{ label: "Net revenue", value: (totals) => totals.netKobo, format: naira }}
                figures={[
                    { label: "Money in", value: (totals) => naira(totals.inKobo) },
                    { label: "Money out", value: (totals) => naira(totals.outKobo) },
                    { label: "Jobs (net)", value: (totals) => naira(totals.jobsNetKobo) },
                    { label: "Shop (net)", value: (totals) => naira(totals.shopNetKobo) },
                    { label: "Machine bookings (net)", value: (totals) => naira(totals.bookingsNetKobo) },
                    { label: "Subscriptions", value: (totals) => naira(totals.subscriptionsKobo) },
                ]}
                series={[
                    { label: "Money in", color: IN_COLOR, value: (point) => point.inKobo },
                    { label: "Money out", color: OUT_COLOR, value: (point) => point.outKobo },
                ]}
                yLabel="Amount (₦)"
                formatTick={nairaTick}
                formatValue={naira}
                emptyMessage="No money in or out in this period."
            />

            <FinanceSeriesCard
                metric="jobs"
                title="Jobs"
                icon={BriefcaseBusiness}
                headline={{ label: "Paid to manufacturers", value: (totals) => totals.paidOutKobo, format: naira }}
                figures={[
                    { label: "Installments", value: (totals) => naira(totals.installmentsKobo) },
                    { label: "On-time bonuses", value: (totals) => naira(totals.bonusesKobo) },
                    { label: "Rejection charges", value: (totals) => naira(totals.chargesKobo) },
                    { label: "New jobs' value", value: (totals) => naira(totals.jobValueKobo) },
                    { label: "Jobs created", value: (totals) => totals.jobs.toLocaleString() },
                ]}
                series={[
                    { label: "Paid to manufacturers (out)", color: OUT_COLOR, value: (point) => point.paidOutKobo },
                    { label: "Rejection charges (in)", color: IN_COLOR, value: (point) => point.chargesKobo },
                ]}
                yLabel="Amount (₦)"
                formatTick={nairaTick}
                formatValue={naira}
                emptyMessage="No job payments or charges in this period."
            />

            <div className="grid gap-10 md:gap-6 xl:grid-cols-2">
                <FinanceSeriesCard
                    metric="shop"
                    title="Shop"
                    icon={Store}
                    headline={{ label: "Customers paid", value: (totals) => totals.salesKobo, format: naira }}
                    figures={[
                        { label: "Orders", value: (totals) => totals.orders.toLocaleString() },
                        { label: "MANDE's income", value: (totals) => naira(totals.incomeKobo) },
                        { label: "Refunded", value: (totals) => naira(totals.refundsKobo) },
                    ]}
                    series={[
                        { label: "Sales", color: SHOP_COLOR, value: (point) => point.salesKobo },
                        { label: "Refunds", color: OUT_COLOR, value: (point) => point.refundsKobo },
                    ]}
                    yLabel="Amount (₦)"
                    formatTick={nairaTick}
                    formatValue={naira}
                    emptyMessage="No shop sales in this period."
                />

                <FinanceSeriesCard
                    metric="bookings"
                    title="Machine bookings"
                    icon={CalendarClock}
                    headline={{ label: "Paid by bookers", value: (totals) => totals.paidKobo, format: naira }}
                    figures={[
                        { label: "Bookings", value: (totals) => totals.bookings.toLocaleString() },
                        { label: "Discounts", value: (totals) => naira(totals.discountKobo) },
                        { label: "Refunded", value: (totals) => naira(totals.refundedKobo) },
                    ]}
                    series={[
                        { label: "Paid", color: BOOKINGS_COLOR, value: (point) => point.paidKobo },
                        { label: "Refunded", color: OUT_COLOR, value: (point) => point.refundedKobo },
                    ]}
                    yLabel="Amount (₦)"
                    formatTick={nairaTick}
                    formatValue={naira}
                    emptyMessage="No paid bookings in this period."
                />
            </div>
        </div>
    );
}
