"use client";

import Link from "next/link";
import { Infinity as InfinityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MANUFACTURER_PLAN_SETTINGS_URL } from "@/constant/manufacturer";
import type { PricingPlan } from "@/constant/sampleData";
import { PRIMARY_BUTTON_CLASS } from "../form/formButtons";
import {
    useJobApplications,
    type JobSlots,
} from "../dashboardLayout/jobApplicationsContext";

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** One line on how many more jobs the manufacturer can apply for — for the dashboard. */
export function getJobSlotsHint({ used, limit, canApply }: JobSlots, plan?: PricingPlan): string {
    const planName = plan?.name ?? "current";
    if (limit === null) return `No limit on jobs with your ${planName} plan`;
    if (!canApply) return `All ${limit} job slots on your ${planName} plan are in use`;
    return `You can apply for ${plural(limit - used, "more job")} on your ${planName} plan`;
}

// ─────────────────────────────────────────────────────────────────────────────
// JobSlotsSummary — how many of the plan's concurrent job slots are in use,
// above the open jobs. Each active job and each application takes one, shown
// as a segmented bar. Once they're all in use it turns amber and explains how
// to free one up, with an upgrade button; on an unlimited plan it's a single
// line.
// ─────────────────────────────────────────────────────────────────────────────

export default function JobSlotsSummary() {
    const { slots, plan } = useJobApplications();
    const { used, limit, canApply, activeJobCount, applicationCount } = slots;
    const planName = plan?.name ?? "current";
    const breakdown = `${plural(activeJobCount, "active job")} · ${plural(applicationCount, "application")}`;

    if (limit === null) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                    <InfinityIcon className="size-4.5" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-medium font-text text-mist-950">Unlimited job slots</p>
                    <p className="text-xs font-text text-mist-500">
                        Your {planName} plan has no limit on jobs at once · {breakdown}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col gap-3 rounded-xl border p-4",
                canApply ? "border-border bg-white" : "border-warning-200 bg-warning-50",
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold font-text text-mist-950">
                        {canApply ? "Job slots" : "All job slots in use"}
                    </p>
                    <p className="text-xs font-text text-mist-500">{breakdown}</p>
                </div>
                <p className="shrink-0 text-sm font-text text-mist-600">
                    <span className="text-lg font-semibold text-mist-950">{used}</span> of {limit} used
                </p>
            </div>

            {/* One segment per slot; the count above says the same for screen readers */}
            <div className="flex gap-1" aria-hidden>
                {Array.from({ length: limit }, (_, index) => (
                    <span
                        key={index}
                        className={cn(
                            "h-1.5 flex-1 rounded-full",
                            index >= used
                                ? "bg-mist-200"
                                : canApply
                                  ? "bg-secondary-700"
                                  : "bg-warning-500",
                        )}
                    />
                ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 font-text text-mist-600">
                    {canApply
                        ? `You can apply for ${plural(limit - used, "more job")} on your ${planName} plan. Active jobs and applications each use a slot.`
                        : `Your ${planName} plan allows ${plural(limit, "job")} at once. Finish a job or withdraw an application to apply for more.`}
                </p>
                {canApply ? (
                    <Link
                        href={MANUFACTURER_PLAN_SETTINGS_URL}
                        className="shrink-0 text-xs font-medium font-text text-secondary-700 hover:underline"
                    >
                        Upgrade for more
                    </Link>
                ) : (
                    <Link
                        href={MANUFACTURER_PLAN_SETTINGS_URL}
                        className={cn(PRIMARY_BUTTON_CLASS, "inline-flex h-9 shrink-0 items-center justify-center px-4 text-sm")}
                    >
                        Upgrade plan
                    </Link>
                )}
            </div>
        </div>
    );
}
