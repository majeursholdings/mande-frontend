"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { PackageCheck, ShoppingBag, Star, Wallet } from "lucide-react";
import { DataTable, StatusBadge, type ColumnDef } from "@/components/customTable";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import DashboardCard from "@/components/adminPlatform/dashboardPage/dashboardCard";
import PillSelect from "@/components/adminPlatform/dashboardPage/pillSelect";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_PART_STATUS_LABELS, ORDER_PART_STATUS_TONES, PRODUCT_STATUS_LABELS, PRODUCT_STATUS_TONES } from "@/constant/shop";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import type { SalesPeriod, SellerShopApi, SellerSummary, ShopOrderPart } from "@/lib/services/shopService";
import type { SalesChartPoint } from "./salesChart";

// Recharts is big: it loads with the chart, after the page, not in its first download
const SalesChart = dynamic(() => import("./salesChart"), { ssr: false, loading: () => <Skeleton className="h-55 w-full" /> });

const PERIOD_OPTIONS: { value: SalesPeriod; label: string }[] = [
    { value: "month", label: "Monthly" },
    { value: "week", label: "Weekly" },
];

type AttentionRow = SellerSummary["attention"][number];

const ORDER_COLUMNS: ColumnDef<ShopOrderPart>[] = [
    {
        key: "order",
        header: "Order",
        cell: (order) => (
            <span className="flex flex-col">
                <span className="font-medium text-mist-950">{order.code}</span>
                <span className="text-xs text-mist-500">{order.paidAt ? dayjs(order.paidAt).format("D MMM YYYY") : ""}</span>
            </span>
        ),
    },
    {
        key: "customer",
        header: "Customer",
        cell: (order) => (
            <span className="flex flex-col">
                <span className="max-w-40 truncate text-mist-950">{order.customer.name}</span>
                <span className="text-xs text-mist-500">{order.customer.state}</span>
            </span>
        ),
    },
    { key: "share", header: "Price", cell: (order) => <span className="whitespace-nowrap font-medium text-mist-950">{formatPrice(fromKobo(order.sellerShareKobo))}</span> },
    {
        key: "status",
        header: "Status",
        cell: (order) => <StatusBadge label={ORDER_PART_STATUS_LABELS[order.status]} tone={ORDER_PART_STATUS_TONES[order.status]} variant="pill" />,
    },
];

const ATTENTION_COLUMNS: ColumnDef<AttentionRow>[] = [
    {
        key: "product",
        header: "Product",
        cell: (row) => (
            <span className="flex flex-col">
                <span className="max-w-56 truncate font-medium text-mist-950">{row.title}</span>
                <span className="max-w-56 truncate text-xs text-mist-500">{row.reason}</span>
            </span>
        ),
    },
    {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge label={PRODUCT_STATUS_LABELS[row.status]} tone={PRODUCT_STATUS_TONES[row.status]} variant="pill" />,
    },
];

function chartPoints(summary: SellerSummary): SalesChartPoint[] {
    const monthly = summary.series.period === "month";
    return summary.series.buckets.map((bucket) => {
        const start = dayjs(bucket.start);
        return {
            label: monthly ? start.format("MMM") : start.format("D MMM"),
            fullLabel: monthly ? start.format("MMMM YYYY") : `Week of ${start.format("D MMMM YYYY")}`,
            sales: fromKobo(bucket.salesKobo),
            orders: bucket.orders,
        };
    });
}

/**
 * A seller's shop at a glance: sales this month, orders to fulfil, products
 * and rating; sales over the last 12 weeks or months; their latest orders;
 * and the products that need a look. Used for a manufacturer's store and
 * MANDE stock's: `api` and `queryKey` say which, `links` where its pages are.
 */
export default function ShopOverview({
    api,
    queryKey,
    links,
}: {
    api: SellerShopApi;
    queryKey: (period: SalesPeriod) => readonly unknown[];
    links: { orders: string; products: string };
}) {
    const [period, setPeriod] = useState<SalesPeriod>("month");
    const query = useQuery({ queryKey: queryKey(period), queryFn: () => api.getSummary(period), staleTime: 30_000, placeholderData: (previous) => previous });
    const summary = query.data;
    const loading = query.isPending;
    const points = summary ? chartPoints(summary) : [];

    if (query.isError && !summary) {
        return <ReportError message="Couldn't load the overview. Please refresh to try again." />;
    }

    return (
        <div className="flex flex-col gap-6">
            <OverviewCardGrid>
                <OverviewCard
                    icon={Wallet}
                    label="Sales this month"
                    value={summary ? formatCompactPrice(fromKobo(summary.sales.thisMonthKobo)) : ""}
                    fullValue={summary ? formatPrice(fromKobo(summary.sales.thisMonthKobo)) : undefined}
                    detail={{
                        label: "Last month",
                        value: summary ? formatCompactPrice(fromKobo(summary.sales.lastMonthKobo)) : "",
                        tone: !summary || summary.sales.thisMonthKobo >= summary.sales.lastMonthKobo ? "green" : "red",
                    }}
                    href={links.orders}
                    loading={loading}
                />
                <OverviewCard
                    icon={ShoppingBag}
                    label="Orders to fulfil"
                    value={summary ? summary.orders.toFulfil.toLocaleString() : ""}
                    detail={{ label: "Shipped, on their way", value: summary ? summary.orders.shipped.toLocaleString() : "", tone: "blue" }}
                    href={links.orders}
                    loading={loading}
                />
                <OverviewCard
                    icon={PackageCheck}
                    label="Listed products"
                    // "4 / 10" against the plan's limit, when it has one
                    value={summary ? `${summary.products.listed}${summary.plan.maxProducts !== null ? ` / ${summary.plan.maxProducts}` : ""}` : ""}
                    detail={{
                        label: "Drafts and paused",
                        value: summary ? (summary.products.draft + summary.products.paused + summary.products.pausedByPlan).toLocaleString() : "",
                        tone: "amber",
                    }}
                    href={links.products}
                    loading={loading}
                />
                <OverviewCard
                    icon={Star}
                    label="Rating"
                    value={summary ? (summary.rating.count > 0 ? `${summary.rating.average.toFixed(1)} / 5.0` : "None yet") : ""}
                    detail={{ label: "Reviews", value: summary ? summary.rating.count.toLocaleString() : "", tone: "green" }}
                    loading={loading}
                />
            </OverviewCardGrid>

            <DashboardCard title="Sales" action={<PillSelect label="Period" value={period} options={PERIOD_OPTIONS} onChange={setPeriod} />}>
                {loading ? <Skeleton className="h-55 w-full" /> : <SalesChart data={points} />}
                {summary && (
                    <p className="text-sm font-text text-mist-500">
                        {formatPrice(fromKobo(summary.sales.allTimeKobo))} from {summary.orders.allTime} {summary.orders.allTime === 1 ? "order" : "orders"} in all.
                    </p>
                )}
                {/* The chart's numbers for screen readers: the chart itself is hidden from them */}
                <table className="sr-only">
                    <caption>Sales by {period}</caption>
                    <thead>
                        <tr>
                            <th scope="col">{period === "month" ? "Month" : "Week"}</th>
                            <th scope="col">Sales</th>
                            <th scope="col">Orders</th>
                        </tr>
                    </thead>
                    <tbody>
                        {points.map((point) => (
                            <tr key={point.fullLabel}>
                                <th scope="row">{point.fullLabel}</th>
                                <td>{formatPrice(point.sales)}</td>
                                <td>{point.orders}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DashboardCard>

            <div className="grid gap-6 xl:grid-cols-2">
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold font-text text-mist-950">Latest orders</h2>
                        <Link href={links.orders} className="text-sm font-medium font-text text-secondary-700 hover:underline">
                            View all
                        </Link>
                    </div>
                    <DataTable
                        tableId="overview-orders"
                        columns={ORDER_COLUMNS}
                        rows={summary?.recentOrders ?? []}
                        loading={loading}
                        compact
                        emptyMessage="No orders yet. They show here once customers buy your products."
                    />
                </section>
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold font-text text-mist-950">Needs attention</h2>
                        <Link href={links.products} className="text-sm font-medium font-text text-secondary-700 hover:underline">
                            View products
                        </Link>
                    </div>
                    <DataTable
                        tableId="overview-attention"
                        columns={ATTENTION_COLUMNS}
                        rows={summary?.attention ?? []}
                        loading={loading}
                        compact
                        emptyMessage="Nothing needs a look: every product is ready."
                    />
                </section>
            </div>
        </div>
    );
}
