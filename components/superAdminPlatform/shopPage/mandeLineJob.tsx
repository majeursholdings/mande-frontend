"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { toast } from "sonner";
import JobFormDialog from "@/components/adminPlatform/form/jobFormDialog";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";
import { StatusBadge } from "@/components/customTable";
import { getErrorMessage } from "@/lib/api";
import { mandeStockService, type ShopJobDraft, type ShopOrderPart } from "@/lib/services/shopService";

// ─────────────────────────────────────────────────────────────────────────────
// MandeLineJob: under a line of a MANDE stock order (SHOP_IMPLEMENTATION.md
// 5.2.2 and 5.2.3), the job making it (its code, status and due date, "Ready
// to ship" once it's signed off), or "Create job", which opens the job form
// prefilled from the product's template and the order. A job rejected for
// the last time shows as closed, with "Make a new job" (or cancel the order
// and refund it, from the order's own buttons).
// ─────────────────────────────────────────────────────────────────────────────

const OPEN_PART_STATUSES = ["awaiting_fulfilment", "processing"];

export default function MandeLineJob({ order, line, onChanged }: { order: ShopOrderPart; line: ShopOrderPart["lines"][number]; onChanged: () => void }) {
    const platform = useStaffPlatform();
    const jobsHref = (jobId: string) => `${platform.key === "super-admin" ? "/super-admin" : "/admin"}/jobs?job=${jobId}`;
    const [draft, setDraft] = useState<ShopJobDraft | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const job = line.job;
    const canMakeJob = line.status === "active" && OPEN_PART_STATUSES.includes(order.status) && (!job || job.closed);

    const openForm = async () => {
        setIsLoading(true);
        try {
            setDraft(await mandeStockService.getJobDraft(order.orderId, line.id));
        } catch (error) {
            toast.error(getErrorMessage(error, "Couldn't open the job form. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            {job && (
                <>
                    <Link href={jobsHref(job.id)} className="font-medium text-primary-700 underline-offset-2 hover:underline">
                        Job {job.code}
                    </Link>
                    {job.closed ? (
                        <StatusBadge label="Job closed" tone="red" variant="pill" />
                    ) : job.readyToShip ? (
                        <StatusBadge label="Ready to ship" tone="green" variant="pill" />
                    ) : (
                        <span className="text-mist-500">Due {dayjs(job.dueDate).format("D MMM YYYY")}</span>
                    )}
                </>
            )}
            {canMakeJob && (
                <button
                    type="button"
                    onClick={openForm}
                    disabled={isLoading}
                    className="font-medium text-primary-700 underline-offset-2 hover:underline cursor-pointer disabled:opacity-50"
                >
                    {isLoading ? "Opening..." : job ? "Make a new job" : "Create job"}
                </button>
            )}
            {draft && (
                <JobFormDialog
                    prefill={draft}
                    onClose={() => setDraft(null)}
                    onCreated={() => {
                        setDraft(null);
                        onChanged();
                    }}
                />
            )}
        </span>
    );
}
