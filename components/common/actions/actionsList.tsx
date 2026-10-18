"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCheck, ClipboardCheck, Factory, Hammer, MessageSquareMore, Store, TriangleAlert, UserRound, type LucideIcon } from "lucide-react";
import EmptyState from "@/components/adminPlatform/emptyState";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import { Skeleton } from "@/components/ui/skeleton";
import { getRelativeTimeLabel, getTimeUntilLabel } from "@/lib/date";
import type { ActionGroup, ActionItem, ActionsResponse } from "@/lib/services/actionsService";
import { cn } from "@/lib/utils";

export type ActionGroupOption = { value: ActionGroup; label: string };

const GROUP_ICONS: Record<ActionGroup, { icon: LucideIcon; className: string }> = {
    jobs: { icon: Hammer, className: "bg-primary-50 text-primary-700" },
    shop: { icon: Store, className: "bg-secondary-50 text-secondary-700" },
    account: { icon: UserRound, className: "bg-indigo-50 text-indigo-600" },
    reviews: { icon: ClipboardCheck, className: "bg-primary-50 text-primary-700" },
    requests: { icon: MessageSquareMore, className: "bg-indigo-50 text-indigo-600" },
    risk: { icon: TriangleAlert, className: "bg-warning-50 text-warning-700" },
    "mande-stock": { icon: Factory, className: "bg-secondary-50 text-secondary-700" },
};

/** "Due in 3 hrs" or "Overdue by 2 days", for an item's deadline. */
function deadlineLabel(dueAt: string, now: Date): { text: string; late: boolean } {
    const due = new Date(dueAt);
    if (due > now) return { text: `Due ${getTimeUntilLabel(due, now)}`, late: false };
    return { text: `Was due ${getRelativeTimeLabel(due, now)}`, late: true };
}

function ActionRow({ action, label, now }: { action: ActionItem; label: string; now: Date }) {
    const { icon: Icon, className } = GROUP_ICONS[action.group];
    const deadline = action.dueAt ? deadlineLabel(action.dueAt, now) : null;
    return (
        <li className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 sm:flex-row sm:gap-5">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", className)}>
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                    <p className="flex flex-wrap items-center gap-x-2 text-xs font-medium font-text tracking-wide text-mist-500 uppercase">
                        {label}
                        {action.since && <span className="font-normal normal-case tracking-normal">· {getRelativeTimeLabel(new Date(action.since), now)}</span>}
                        {action.urgent && <span className="rounded-full bg-error-50 px-2 py-0.5 text-[11px] normal-case tracking-normal text-error-700">Needs doing first</span>}
                    </p>
                    <h2 className="text-base font-semibold font-text text-mist-950">{action.title}</h2>
                </div>
                <p className="text-sm font-text text-mist-700">{action.detail}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className={cn("text-sm font-text", deadline?.late ? "font-medium text-error-700" : "text-mist-500")}>{deadline?.text ?? ""}</span>
                    <Link
                        href={action.link.href}
                        className="flex h-9 items-center justify-center rounded-lg bg-secondary-700 px-3 text-sm font-medium font-text text-white transition-colors hover:bg-secondary-900"
                    >
                        {action.link.label}
                    </Link>
                </div>
            </div>
        </li>
    );
}

/**
 * Everything waiting on someone, most urgent first, with pills to show one
 * group at a time (each with its count). Shared by the manufacturer's and
 * the admin's Actions pages; each says its groups and its empty message.
 */
export default function ActionsList({
    data,
    isPending,
    isError,
    groups,
    emptyDescription,
}: {
    data: ActionsResponse | undefined;
    isPending: boolean;
    isError: boolean;
    groups: ActionGroupOption[];
    emptyDescription: string;
}) {
    const [group, setGroup] = useState<ActionGroup | "all">("all");
    // When the page opened: the "due in" and "ago" labels are worked out against it
    const [now] = useState(() => new Date());
    const actions = data?.actions ?? [];
    const shown = actions.filter((action) => group === "all" || action.group === group);
    const labelOf = new Map(groups.map((option) => [option.value, option.label]));

    return (
        <div className="flex flex-col gap-6">
            <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
                {[{ value: "all" as const, label: "All" }, ...groups].map((option) => {
                    const count = option.value === "all" ? actions.length : (data?.counts.byGroup[option.value] ?? 0);
                    if (option.value !== "all" && count === 0) return null;
                    const active = group === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setGroup(option.value)}
                            className={cn(
                                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium font-text transition-colors cursor-pointer",
                                active ? "border-secondary-700 bg-secondary-700 text-white" : "border-border bg-white text-mist-700 hover:bg-mist-50",
                            )}
                        >
                            {option.label}
                            <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-white/20" : "bg-mist-100 text-mist-600")}>
                                {isPending ? <Skeleton className="my-0.5 h-3.5 w-3" /> : count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {isError ? (
                <ReportError message="Couldn't load what's waiting for you. Please refresh to try again." />
            ) : isPending ? (
                <ul aria-hidden className="flex flex-col gap-4">
                    {Array.from({ length: 3 }, (_, index) => (
                        <li key={index} className="flex gap-5 rounded-xl border border-border bg-white p-5">
                            <Skeleton className="size-10 shrink-0 rounded-full" />
                            <div className="flex flex-1 flex-col gap-3">
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : shown.length === 0 ? (
                <div className="rounded-xl border border-border bg-white">
                    <EmptyState icon={CheckCheck} title="You're all caught up" description={emptyDescription} />
                </div>
            ) : (
                <ul className="flex flex-col gap-4">
                    {shown.map((action) => (
                        <ActionRow key={action.id} action={action} label={labelOf.get(action.group) ?? ""} now={now} />
                    ))}
                </ul>
            )}
        </div>
    );
}
