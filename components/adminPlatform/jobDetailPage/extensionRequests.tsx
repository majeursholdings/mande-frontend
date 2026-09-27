import { ArrowRight, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrdinalDate, getRelativeTimeLabel } from "@/lib/date";
import { Button } from "@/components/ui/button";
import type { AdminTimelineExtension } from "@/constant/admin";
import { DetailSection } from "./detailParts";

/** "+2 weeks" / "+5 days" — how much later the requested date is. */
function getExtensionLength({ previousDueDate, requestedDueDate }: AdminTimelineExtension): string {
    const days = Math.round((new Date(requestedDueDate).getTime() - new Date(previousDueDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days % 7 === 0) return `+${days / 7} week${days === 7 ? "" : "s"}`;
    return `+${days} day${days === 1 ? "" : "s"}`;
}

function DateChange({ request, emphasise = false }: { request: AdminTimelineExtension; emphasise?: boolean }) {
    return (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-text">
            <span className="text-mist-500 line-through decoration-mist-400">
                {formatOrdinalDate(new Date(request.previousDueDate))}
            </span>
            <ArrowRight className="size-3.5 text-mist-400" aria-label="to" />
            <span className={cn(emphasise ? "font-semibold text-mist-950" : "text-mist-800")}>
                {formatOrdinalDate(new Date(request.requestedDueDate))}
            </span>
            <span className="text-xs text-mist-500">({getExtensionLength(request)})</span>
        </span>
    );
}

/**
 * A manufacturer's request for more time: the current and requested due
 * dates and why, for the lead to approve (the due date moves) or reject.
 * Earlier requests and what was decided are listed under it.
 */
export function PendingExtensionRequest({
    request,
    canDecide,
    leadNames,
    onDecide,
}: {
    request: AdminTimelineExtension;
    canDecide: boolean;
    leadNames: string;
    onDecide: (decision: "approved" | "rejected") => void;
}) {
    return (
        <section className="flex flex-col gap-3 rounded-xl border border-warning-200 bg-warning-50/60 p-4">
            <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-700">
                    <CalendarClock className="size-4" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-sm font-semibold font-text text-mist-950">Timeline extension requested</h3>
                    <p className="text-xs font-text text-mist-500">
                        {getRelativeTimeLabel(new Date(request.requestedAt))}
                    </p>
                </div>
            </div>
            <dl className="flex flex-col gap-2 text-sm font-text">
                <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-mist-500">Due date</dt>
                    <dd>
                        <DateChange request={request} emphasise />
                    </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-mist-500">Reason</dt>
                    <dd className="text-mist-800">{request.reason}</dd>
                </div>
            </dl>
            {canDecide ? (
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onDecide("rejected")}
                        className="h-9 px-4 text-sm font-medium font-text cursor-pointer"
                    >
                        Reject
                    </Button>
                    <Button
                        type="button"
                        onClick={() => onDecide("approved")}
                        className="h-9 px-4 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer"
                    >
                        Approve new date
                    </Button>
                </div>
            ) : (
                <p className="text-xs font-text text-mist-600">Waiting for {leadNames} to approve or reject it.</p>
            )}
        </section>
    );
}

/** Extension requests that have been decided. */
export function ExtensionHistory({ requests }: { requests: AdminTimelineExtension[] }) {
    return (
        <DetailSection title="Timeline changes">
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                {requests.map((request) => (
                    <li key={request.id} className="flex flex-col gap-1.5 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <span
                                className={cn(
                                    "rounded-full px-2 py-0.5 text-xs font-medium font-text",
                                    request.status === "approved"
                                        ? "bg-primary-50 text-primary-700"
                                        : "bg-error-50 text-error-600",
                                )}
                            >
                                {request.status === "approved" ? "Extension approved" : "Extension rejected"}
                            </span>
                            {request.decidedAt && (
                                <span className="text-xs font-text text-mist-400">
                                    {formatOrdinalDate(new Date(request.decidedAt))}
                                </span>
                            )}
                        </div>
                        <DateChange request={request} />
                        <p className="text-xs font-text text-mist-500">{request.reason}</p>
                    </li>
                ))}
            </ul>
        </DetailSection>
    );
}
