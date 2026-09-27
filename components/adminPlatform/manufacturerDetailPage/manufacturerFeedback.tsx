"use client";

import { useState } from "react";
import { ImageIcon, MessageSquareText } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/customTable";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CategoryBadge from "@/components/manufacturerPlatform/supportPage/feedbackCategoryBadge";
import { formatDayAndTime, formatOrdinalDate } from "@/lib/date";
import type { SupportFeedbackRecord } from "@/constant/sampleDb";
import EmptyState from "../emptyState";

const COLUMNS: ColumnDef<SupportFeedbackRecord>[] = [
    {
        key: "message",
        header: "Feedback",
        className: "min-w-64 whitespace-normal",
        cell: (row) => <span className="line-clamp-2 text-mist-950">{row.message}</span>,
    },
    { key: "category", header: "About", cell: (row) => <CategoryBadge category={row.category} /> },
    {
        key: "screenshot",
        header: "Screenshot",
        cell: (row) =>
            row.screenshotUrl ? (
                <span className="flex items-center gap-1.5 text-mist-700">
                    <ImageIcon className="size-4 text-mist-400" aria-hidden />
                    Attached
                </span>
            ) : (
                <span className="text-mist-400">—</span>
            ),
    },
    {
        key: "sentAt",
        header: "Date sent",
        cell: (row) => <span className="text-mist-500">{formatOrdinalDate(new Date(row.sentAt))}</span>,
    },
];

/**
 * What the manufacturer shared from Talk to support › Share feedback, newest
 * first — a row opens the whole message and any screenshot.
 */
export default function ManufacturerFeedback({ feedback }: { feedback: SupportFeedbackRecord[] }) {
    const [openId, setOpenId] = useState<string | null>(null);
    const open = feedback.find((item) => item.id === openId);

    if (feedback.length === 0) {
        return (
            <EmptyState
                icon={MessageSquareText}
                title="No Feedback"
                description="Feedback they share from Talk to support will show up here"
            />
        );
    }

    return (
        <>
            <DataTable
                tableId="manufacturer-feedback"
                columns={COLUMNS}
                rows={feedback}
                onRowClick={(row) => setOpenId(row.id)}
            />

            <Dialog open={!!open} onOpenChange={(isOpen) => !isOpen && setOpenId(null)}>
                <DialogContent className="max-w-120">
                    {open && (
                        <>
                            <div className="flex flex-col gap-2">
                                <DialogTitle>Feedback</DialogTitle>
                                <div className="flex flex-wrap items-center gap-2 text-xs font-text text-mist-500">
                                    <CategoryBadge category={open.category} />
                                    Sent {formatDayAndTime(new Date(open.sentAt))}
                                </div>
                            </div>
                            <p className="rounded-lg border border-border px-4 py-3 text-sm font-text whitespace-pre-line text-mist-900">
                                {open.message}
                            </p>
                            {open.screenshotUrl && (
                                <a
                                    href={open.screenshotUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-col gap-2 self-start"
                                >
                                    <span className="text-xs font-medium font-text uppercase text-mist-500">
                                        Screenshot
                                    </span>
                                    {/* eslint-disable-next-line @next/next/no-img-element -- uploads have no fixed size */}
                                    <img
                                        src={open.screenshotUrl}
                                        alt="Screenshot they attached"
                                        className="max-h-80 w-auto rounded-lg border border-border object-contain"
                                    />
                                </a>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
