import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrdinalDate } from "@/lib/date";
import type { ManufacturerRecord } from "@/constant/platformRecords";
import EmptyState from "../emptyState";

type HistoryEntry = {
    key: string;
    title: string;
    detail: string | null;
    /** ISO date. */
    at: string;
    /** The dot's colour — trouble, things set right, or neither. */
    tone: "danger" | "warning" | "good" | "neutral";
};

const DOT_CLASS: Record<HistoryEntry["tone"], string> = {
    danger: "bg-error-500",
    warning: "bg-warning-500",
    good: "bg-primary-600",
    neutral: "bg-mist-300",
};

/** Every flag, suspension, lifting of one, and appeal on the account — newest first. */
function getAccountHistory({ statusHistory, appeals }: ManufacturerRecord): HistoryEntry[] {
    const statusEntries = statusHistory.map((event, index): HistoryEntry => {
        // "Active" lifts whatever the account was under just before
        const lifted = statusHistory[index + 1]?.status;
        if (event.status === "active") {
            return {
                key: `status-${index}`,
                title: `${lifted === "suspended" ? "Suspension" : "Flag"} lifted by ${event.by}`,
                detail: event.reason,
                at: event.at,
                tone: "good",
            };
        }
        return {
            key: `status-${index}`,
            title: `${event.status === "suspended" ? "Suspended" : "Flagged"} by ${event.by}`,
            detail: event.reason,
            at: event.at,
            tone: event.status === "suspended" ? "danger" : "warning",
        };
    });
    const appealEntries = appeals.flatMap((appeal): HistoryEntry[] => [
        { key: `${appeal.id}-sent`, title: "Appeal sent", detail: appeal.message, at: appeal.sentAt, tone: "neutral" },
        ...(appeal.status !== "pending" && appeal.decidedAt
            ? [
                  {
                      key: `${appeal.id}-decided`,
                      title: `Appeal ${appeal.status === "approved" ? "approved" : "turned down"} by ${appeal.decidedBy}`,
                      detail: appeal.response,
                      at: appeal.decidedAt,
                      tone: appeal.status === "approved" ? ("good" as const) : ("danger" as const),
                  },
              ]
            : []),
    ]);
    return [...statusEntries, ...appealEntries].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/**
 * The account's issues over time — every flag and suspension, who lifted
 * them, and each appeal with how it was answered — newest first.
 */
export default function AccountIssueHistory({ manufacturer }: { manufacturer: ManufacturerRecord }) {
    const history = getAccountHistory(manufacturer);

    if (history.length === 0) {
        return (
            <EmptyState
                icon={History}
                title="No account issues"
                description="Flags, suspensions and appeals will show up here"
            />
        );
    }

    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-base font-semibold font-text text-mist-950">
                Issue history <span className="font-normal text-mist-400">({history.length})</span>
            </h2>
            <ol className="flex flex-col">
                {history.map((entry, index) => {
                    const isLast = index === history.length - 1;
                    return (
                        <li key={entry.key} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", DOT_CLASS[entry.tone])} />
                                {!isLast && <span className="my-1 w-px flex-1 bg-mist-200" />}
                            </div>
                            <div className={cn("flex min-w-0 flex-1 flex-col gap-1", !isLast && "pb-5")}>
                                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                    <span className="text-sm font-medium font-text text-mist-950">{entry.title}</span>
                                    <span className="text-xs font-text text-mist-400">
                                        {formatOrdinalDate(new Date(entry.at))}
                                    </span>
                                </div>
                                {entry.detail && (
                                    <p className="text-sm font-text whitespace-pre-line text-mist-600">{entry.detail}</p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
