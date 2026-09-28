"use client";

import { useState } from "react";
import { formatCompactPrice, formatPrice } from "@/lib/currency";
import DashboardCard from "@/components/adminPlatform/dashboardPage/dashboardCard";
import PillSelect from "@/components/adminPlatform/dashboardPage/pillSelect";
import { useAdminJobs } from "@/components/adminPlatform/dashboardLayout/adminJobsContext";
import { REPORT_PERIOD_OPTIONS, getJobsData, type ReportPeriod } from "./reportingStats";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * The jobs' key figures over a period: how many were created and what
 * they're worth, what's been paid out, how quickly and how often on time
 * they're finished, and how often work is sent back, delayed or faulty.
 */
export default function JobsDataCard() {
    const { jobs } = useAdminJobs();
    const [period, setPeriod] = useState<ReportPeriod>("all");
    const data = getJobsData(jobs, period);

    const figures: { label: string; value: string; fullValue?: string; note: string }[] = [
        { label: "Jobs created", value: String(data.created), note: `${plural(data.completed, "job")} signed off` },
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
        },
        {
            label: "More time asked for",
            value: String(data.extensionsRequested),
            note: `${data.extensionsApproved} given`,
        },
        { label: "Faults reported", value: String(data.faults), note: "In delivered work" },
    ];

    return (
        <DashboardCard
            title="Jobs Data"
            action={<PillSelect label="Period" value={period} options={REPORT_PERIOD_OPTIONS} onChange={setPeriod} />}
        >
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                {figures.map((figure) => (
                    <div key={figure.label} className="flex min-w-0 flex-col gap-0.5 border-l-2 border-mist-100 pl-3">
                        <dt className="text-xs font-text text-mist-500">{figure.label}</dt>
                        <dd title={figure.fullValue} className="text-lg font-semibold font-text leading-tight text-mist-950">
                            {figure.value}
                        </dd>
                        <dd className="text-xs font-text text-mist-400">{figure.note}</dd>
                    </div>
                ))}
            </dl>
        </DashboardCard>
    );
}
