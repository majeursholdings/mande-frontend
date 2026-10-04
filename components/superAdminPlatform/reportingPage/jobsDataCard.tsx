"use client";

import { useState } from "react";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardCard from "@/components/adminPlatform/dashboardPage/dashboardCard";
import PillSelect from "@/components/adminPlatform/dashboardPage/pillSelect";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import type { JobsReportResponse } from "@/lib/services/reportsService";
import { REPORT_PERIOD_OPTIONS, useJobsReport, type ReportPeriod } from "./reportingStats";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const NO_DATA: JobsReportResponse["data"] = {
    created: 0,
    valueKobo: 0,
    paidOutKobo: 0,
    completed: 0,
    onTimePercent: null,
    averageDaysToComplete: null,
    stepsSentBack: 0,
    rejections: 0,
    extensionsRequested: 0,
    extensionsApproved: 0,
    faults: 0,
};

/**
 * The jobs' key figures over a period (/reports/jobs): how many were created
 * and what they're worth, what's been paid out, how quickly and how often on
 * time they're finished, and how often work is sent back, delayed or faulty.
 */
export default function JobsDataCard() {
    const [period, setPeriod] = useState<ReportPeriod>("all");
    const query = useJobsReport(period);
    const report = query.data?.data ?? NO_DATA;
    const data = { ...report, value: fromKobo(report.valueKobo), paidOut: fromKobo(report.paidOutKobo) };

    /** `noteIsData`: the note is made from the figures, so it's skeletoned with them. */
    const figures: { label: string; value: string; fullValue?: string; note: string; noteIsData?: boolean }[] = [
        { label: "Jobs created", value: String(data.created), note: `${plural(data.completed, "job")} signed off`, noteIsData: true },
        {
            label: "Job value",
            value: formatCompactPrice(data.value),
            fullValue: formatPrice(data.value),
            note: "What the new jobs pay",
        },
        {
            label: "Paid to manufacturers",
            value: formatCompactPrice(data.paidOut),
            fullValue: formatPrice(data.paidOut),
            note: "Installments and bonuses",
        },
        {
            label: "Delivered on time",
            value: data.onTimePercent === null ? "None yet" : `${data.onTimePercent}%`,
            note: "Of the jobs signed off",
        },
        {
            label: "Time to complete",
            value: data.averageDaysToComplete === null ? "None yet" : plural(data.averageDaysToComplete, "day"),
            note: "On average, from accepted",
        },
        {
            label: "Work sent back",
            value: String(data.stepsSentBack + data.rejections),
            note: `${plural(data.stepsSentBack, "step")}, ${plural(data.rejections, "finished job")}`,
            noteIsData: true,
        },
        {
            label: "More time asked for",
            value: String(data.extensionsRequested),
            note: `${data.extensionsApproved} given`,
            noteIsData: true,
        },
        { label: "Faults reported", value: String(data.faults), note: "In delivered work" },
    ];

    return (
        <DashboardCard
            title="Jobs Data"
            action={<PillSelect label="Period" value={period} options={REPORT_PERIOD_OPTIONS} onChange={setPeriod} />}
        >
            {query.isError ? (
                <ReportError message="Couldn't load the jobs data. Please refresh to try again." />
            ) : (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                    {figures.map((figure) => (
                        <div key={figure.label} className="flex min-w-0 flex-col gap-0.5 border-l-2 border-mist-100 pl-3">
                            <dt className="text-xs font-text text-mist-500">{figure.label}</dt>
                            {query.isPending ? (
                                <dd>
                                    {/* The figure's line height */}
                                    <Skeleton className="my-0.5 h-5.5 w-16" />
                                </dd>
                            ) : (
                                <dd title={figure.fullValue} className="text-lg font-semibold font-text leading-tight text-mist-950">
                                    {figure.value}
                                </dd>
                            )}
                            {query.isPending && figure.noteIsData ? (
                                <dd>
                                    <Skeleton className="h-3 w-24" />
                                </dd>
                            ) : (
                                <dd className="text-xs font-text text-mist-400">{figure.note}</dd>
                            )}
                        </div>
                    ))}
                </dl>
            )}
        </DashboardCard>
    );
}
