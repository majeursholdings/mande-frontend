"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { DataTable, StatusBadge, TableToolbar, type ColumnDef } from "@/components/customTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SHOP_URL } from "@/constant/navigation";
import { queryKeys } from "@/lib/queryKeys";
import { shopAdminService, type ProductReportRow } from "@/lib/services/shopService";
import ShopReasonForm from "../form/shopReasonForm";

const TABLE_ID = "shop-reports";
const PAGE_SIZE = 10;

const STATUS_ITEMS = [
    { value: "open", label: "Open" },
    { value: "resolved", label: "Resolved" },
    { value: "dismissed", label: "Dismissed" },
];
const STATUS_TONES = { open: "amber", resolved: "green", dismissed: "gray" } as const;

const COLUMNS: ColumnDef<ProductReportRow>[] = [
    {
        key: "product",
        header: "Product",
        cell: (report) => <span className="max-w-64 truncate font-medium text-mist-950">{report.product?.title ?? "A product no longer on the shop"}</span>,
    },
    { key: "reason", header: "Reason", cell: (report) => report.reasonLabel },
    { key: "details", header: "Details", cell: (report) => <span className="line-clamp-1 max-w-72 text-mist-600">{report.details || "None given"}</span> },
    { key: "reported", header: "Reported", cell: (report) => <span className="whitespace-nowrap">{dayjs(report.reportedAt).format("D MMM YYYY")}</span> },
    {
        key: "status",
        header: "Status",
        cell: (report) => <StatusBadge label={STATUS_ITEMS.find((item) => item.value === report.status)?.label ?? report.status} tone={STATUS_TONES[report.status]} variant="pill" />,
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// ReportsTab: products shop customers reported (fake, misleading, not
// allowed, a scam...), open ones first by default. Opening one shows the
// product (a link to it on the shop) and what the customer said; a super
// admin closes it as resolved (acted on, e.g. took the product down from All
// products) or dismissed (nothing wrong), with a note. Who reported it is
// never shown.
// ─────────────────────────────────────────────────────────────────────────────

export default function ReportsTab() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState<ProductReportRow | null>(null);
    const [closing, setClosing] = useState<"resolved" | "dismissed" | null>(null);

    const page = Math.max(1, Number(searchParams.get(`${TABLE_ID}_page`) ?? 1) || 1);
    const statusParam = searchParams.get(`${TABLE_ID}_status`) ?? "open";
    const status = (STATUS_ITEMS.some((item) => item.value === statusParam) ? statusParam : "open") as ProductReportRow["status"];

    const query = useQuery({
        queryKey: queryKeys.shop.reports({ page, status }),
        queryFn: () => shopAdminService.listReports({ page, limit: PAGE_SIZE, status }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });

    const close = () => {
        setOpen(null);
        setClosing(null);
    };

    return (
        <div className="flex flex-col">
            <DataTable
                tableId={TABLE_ID}
                columns={COLUMNS}
                rows={query.data?.reports ?? []}
                pagination={query.data ? { total: query.data.total, totalPages: query.data.totalPages, rowsPerPage: PAGE_SIZE } : { total: 0, totalPages: 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load the reports. Please refresh the page." : undefined}
                emptyMessage={status === "open" ? "No open reports. Customers' reports of products show here." : "No reports here."}
                onRowClick={setOpen}
                rowActions={[{ label: "View", onSelect: setOpen }]}
                toolbar={<TableToolbar filters={[{ title: "Open", paramKey: "status", items: STATUS_ITEMS }]} />}
            />

            <Dialog open={!!open} onOpenChange={(next) => !next && close()}>
                <DialogContent className="max-w-130">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>{open?.reasonLabel ?? "Report"}</DialogTitle>
                        <DialogDescription>{open ? `Reported ${dayjs(open.reportedAt).format("D MMMM YYYY, h:mm a")}` : ""}</DialogDescription>
                    </div>
                    {open && closing ? (
                        <ShopReasonForm
                            label={closing === "resolved" ? "What was done" : "Why nothing needs doing"}
                            placeholder={closing === "resolved" ? "e.g. Took the product down: the photos were copied" : "e.g. Checked with the seller: the photos are their own"}
                            description="Kept on the report for other super admins."
                            submitLabel={closing === "resolved" ? "Mark resolved" : "Dismiss report"}
                            onCancel={() => setClosing(null)}
                            onSubmit={async (note) => {
                                await shopAdminService.closeReport(open.id, closing, note);
                                await queryClient.invalidateQueries({ queryKey: queryKeys.shop.reports().slice(0, -1) });
                                toast.success(closing === "resolved" ? "Report resolved" : "Report dismissed");
                                close();
                            }}
                        />
                    ) : (
                        open && (
                            <div className="flex flex-col gap-5 text-sm font-text">
                                <section className="flex flex-col gap-1 rounded-lg bg-mist-50 px-4 py-3">
                                    <h3 className="font-semibold text-mist-950">The product</h3>
                                    {open.product ? (
                                        <>
                                            <a
                                                href={`${SHOP_URL}/p/${open.product.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 font-medium text-secondary-700 hover:underline"
                                            >
                                                {open.product.title}
                                                <ExternalLink className="size-3.5" aria-hidden />
                                            </a>
                                            <span className="text-xs text-mist-500">
                                                {open.product.status === "listed" ? "On the shop. To take it down, use All products." : `Not on the shop (${open.product.status.replace(/_/g, " ")}).`}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-mist-500">No longer on the shop.</span>
                                    )}
                                </section>
                                <section className="flex flex-col gap-1">
                                    <h3 className="font-semibold text-mist-950">What the customer said</h3>
                                    <p className="whitespace-pre-line text-mist-700">{open.details || "They didn't add any details."}</p>
                                </section>
                                {open.status !== "open" && (
                                    <section className="flex flex-col gap-1">
                                        <h3 className="font-semibold text-mist-950">{open.status === "resolved" ? "Resolved" : "Dismissed"} by {open.resolvedByName}</h3>
                                        <p className="text-mist-700">{open.resolutionNote}</p>
                                    </section>
                                )}
                                <div className="flex justify-end gap-3">
                                    <Button type="button" onClick={close} className="h-10 cursor-pointer rounded-button bg-mist-100 px-4 text-sm font-medium text-mist-950 hover:bg-mist-200">
                                        Close
                                    </Button>
                                    {open.status === "open" && (
                                        <>
                                            <Button type="button" variant="outline" onClick={() => setClosing("dismissed")} className="h-10 rounded-button px-4 text-sm">
                                                Dismiss
                                            </Button>
                                            <Button type="button" onClick={() => setClosing("resolved")} className="h-10 cursor-pointer rounded-button bg-secondary-700 px-4 text-sm font-medium text-white hover:bg-secondary-900">
                                                Mark resolved
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
