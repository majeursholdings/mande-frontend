"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/customTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_PART_STATUS_LABELS, ORDER_PART_STATUS_TONES } from "@/constant/shop";
import { SUPER_ADMIN_MACHINE_BOOKINGS_URL, SUPER_ADMIN_SHOP_URL, getSuperAdminMachineBookingUrl } from "@/constant/superAdmin";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService, type SeriesMetric, type SeriesResponse } from "@/lib/services/reportsService";
import { mandeStockService } from "@/lib/services/shopService";
import {
    MACHINE_BOOKING_STATUS_LABELS,
    MACHINE_BOOKING_STATUS_TONES,
    describeBookingMachines,
    machineBookingService,
} from "@/lib/services/machineBookingService";
import DashboardCard from "@/components/adminPlatform/dashboardPage/dashboardCard";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import MotionBarChart, { type BarSeries } from "@/components/common/charts/motionBarChart";
import { ChangeChip, changePercent } from "../reportingPage/financeSeriesCard";

// ─────────────────────────────────────────────────────────────────────────────
// The super admin dashboard's previews of the shop and machine bookings: the
// last 7 days as bars (/reports/series, week), their total against the 7
// days before, and the newest few records to act on: MANDE stock orders, and
// machine bookings. "View all" goes to the page behind each.
// ─────────────────────────────────────────────────────────────────────────────

const PREVIEW_ROWS = 4;
const naira = (kobo: number) => formatPrice(fromKobo(kobo));
const nairaTick = (kobo: number) => formatCompactPrice(fromKobo(kobo));

/** The week's bars and headline, shared by both previews. */
function WeekPreview<M extends SeriesMetric>({
    metric,
    label,
    total,
    series,
    emptyMessage,
}: {
    metric: M;
    label: string;
    total: (totals: SeriesResponse<M>["totals"]) => number;
    series: BarSeries<SeriesResponse<M>["points"][number]>[];
    emptyMessage: string;
}) {
    const query = useQuery({
        queryKey: queryKeys.reports.series(metric, "week"),
        queryFn: () => reportsService.getSeries(metric, "week"),
        staleTime: 30_000,
    });
    if (query.isError) return <ReportError message="Couldn't load the last 7 days. Please refresh to try again." />;
    const data = query.data;
    const now = data ? total(data.totals) : 0;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <p className="text-sm text-mist-500">{label}, last 7 days</p>
                {query.isPending ? <Skeleton className="h-7 w-28" /> : <p className="text-2xl font-semibold tabular-nums text-mist-950">{naira(now)}</p>}
                {query.isPending ? (
                    <Skeleton className="h-5 w-36" />
                ) : (
                    <ChangeChip change={changePercent(now, data ? total(data.previous) : 0)} against="the 7 days before" />
                )}
            </div>
            <MotionBarChart
                data={data?.points ?? []}
                series={series}
                xLabel="Day"
                yLabel="Amount (₦)"
                formatTick={nairaTick}
                formatValue={naira}
                height={140}
                loading={query.isPending}
                emptyMessage={emptyMessage}
                animationKey={metric}
                caption={`${label}, last 7 days`}
            />
        </div>
    );
}

/** The newest records under a preview: skeleton rows while loading, a line when there are none. */
function RecentList({ title, loading, error, empty, children }: { title: string; loading: boolean; error: boolean; empty: boolean; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2 border-t border-mist-100 pt-4">
            <h3 className="text-sm font-medium font-text text-mist-950">{title}</h3>
            {error ? (
                <p className="text-sm font-text text-error-600">Couldn&apos;t load these. Please refresh to try again.</p>
            ) : loading ? (
                Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)
            ) : empty ? (
                <p className="text-sm font-text text-mist-400">Nothing here yet.</p>
            ) : (
                <ul className="flex flex-col divide-y divide-mist-100">{children}</ul>
            )}
        </div>
    );
}

export function ShopPreviewCard() {
    const orders = useQuery({
        queryKey: queryKeys.shop.mandeOrders({ page: 1, status: null, preview: true }),
        queryFn: () => mandeStockService.listOrders({ page: 1, limit: PREVIEW_ROWS }),
        staleTime: 30_000,
    });
    const rows = orders.data?.orders ?? [];

    return (
        <DashboardCard title="Shop" viewAllHref={`${SUPER_ADMIN_SHOP_URL}/orders`}>
            <WeekPreview
                metric="shop"
                label="Shop sales"
                total={(totals) => totals.salesKobo}
                series={[
                    { label: "Sales", color: "#6366f1", value: (point) => point.salesKobo },
                    { label: "Refunds", color: "#f87171", value: (point) => point.refundsKobo },
                ]}
                emptyMessage="No shop sales this week."
            />
            <RecentList title="Latest MANDE stock orders" loading={orders.isPending} error={orders.isError} empty={rows.length === 0}>
                {rows.map((order) => (
                    <li key={order.id}>
                        <Link href={`${SUPER_ADMIN_SHOP_URL}/orders`} className="flex items-center justify-between gap-3 py-2.5 text-sm font-text hover:bg-mist-50">
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate font-medium text-mist-950">
                                    {order.code} · {order.customer.name}
                                </span>
                                <span className="truncate text-xs text-mist-500">{order.lines.map((line) => line.title).join(", ")}</span>
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-1">
                                <span className="font-semibold tabular-nums text-mist-950">{naira(order.sellerShareKobo)}</span>
                                <StatusBadge label={ORDER_PART_STATUS_LABELS[order.status]} tone={ORDER_PART_STATUS_TONES[order.status]} variant="pill" />
                            </span>
                        </Link>
                    </li>
                ))}
            </RecentList>
        </DashboardCard>
    );
}

export function BookingsPreviewCard() {
    const bookings = useQuery({
        queryKey: queryKeys.machineBookings.list({ q: "", status: null, preview: true }),
        queryFn: () => machineBookingService.listBookings({ limit: PREVIEW_ROWS }),
        staleTime: 30_000,
    });
    const rows = bookings.data?.bookings ?? [];

    return (
        <DashboardCard title="Machine bookings" viewAllHref={SUPER_ADMIN_MACHINE_BOOKINGS_URL}>
            <WeekPreview
                metric="bookings"
                label="Booking payments"
                total={(totals) => totals.paidKobo}
                series={[
                    { label: "Paid", color: "#f59e0b", value: (point) => point.paidKobo },
                    { label: "Refunded", color: "#f87171", value: (point) => point.refundedKobo },
                ]}
                emptyMessage="No paid bookings this week."
            />
            <RecentList title="Latest bookings" loading={bookings.isPending} error={bookings.isError} empty={rows.length === 0}>
                {rows.map((booking) => (
                    <li key={booking.id}>
                        <Link
                            href={getSuperAdminMachineBookingUrl(booking.id)}
                            className="flex items-center justify-between gap-3 py-2.5 text-sm font-text hover:bg-mist-50"
                        >
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate font-medium text-mist-950">
                                    {booking.code} · {booking.fullName}
                                </span>
                                <span className="truncate text-xs text-mist-500">
                                    {describeBookingMachines(booking)}, {dayjs(booking.date).format("D MMM")}
                                </span>
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-1">
                                <span className="font-semibold tabular-nums text-mist-950">{naira(booking.amountKobo)}</span>
                                <StatusBadge
                                    label={MACHINE_BOOKING_STATUS_LABELS[booking.status]}
                                    tone={MACHINE_BOOKING_STATUS_TONES[booking.status]}
                                    variant="pill"
                                />
                            </span>
                        </Link>
                    </li>
                ))}
            </RecentList>
        </DashboardCard>
    );
}
