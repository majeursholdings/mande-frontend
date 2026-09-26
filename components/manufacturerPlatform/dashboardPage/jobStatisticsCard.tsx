"use client";

import { useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOutsideClickRef } from "@/hooks/useOutsideClickRef";
import type { JobStatisticsPoint, JobStatisticsRange } from "@/constant/manufacturer";
import BarChart from "./barChart";

const RANGE_LABEL: Record<JobStatisticsRange, string> = {
    weekly: "Weekly",
    monthly: "Monthly",
};

export default function JobStatisticsCard({
    range,
    onRangeChange,
    data,
    axisMax,
    axisStep,
}: {
    range: JobStatisticsRange;
    onRangeChange: (range: JobStatisticsRange) => void;
    data: JobStatisticsPoint[];
    axisMax: number;
    axisStep: number;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const close = useCallback(() => setIsOpen(false), []);
    const ref = useOutsideClickRef<HTMLDivElement>(close);

    return (
        <div className="flex-1 min-w-0 rounded-xl border border-border bg-white p-5">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold font-text text-mist-950">
                    Job Statistics
                </h3>

                <div ref={ref} className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen((o) => !o)}
                        className="flex items-center gap-1.5 rounded-full bg-secondary-50 px-3.5 py-1.5 text-xs font-medium font-text text-secondary-700 cursor-pointer"
                    >
                        {RANGE_LABEL[range]}
                        <ChevronDown
                            className={cn(
                                "size-3.5 transition-transform duration-200",
                                isOpen && "rotate-180",
                            )}
                        />
                    </button>

                    {isOpen && (
                        <div className="absolute top-full right-0 mt-1.5 min-w-32 rounded-lg border border-border bg-white py-1 shadow-lg z-10">
                            {(Object.keys(RANGE_LABEL) as JobStatisticsRange[]).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        onRangeChange(key);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "block w-full px-3.5 py-2 text-left text-xs font-text cursor-pointer",
                                        key === range
                                            ? "text-secondary-700 bg-secondary-50"
                                            : "text-mist-600 hover:bg-mist-50",
                                    )}
                                >
                                    {RANGE_LABEL[key]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <BarChart data={data} axisMax={axisMax} axisStep={axisStep} />

            <div className="flex items-center gap-5 mt-6">
                <span className="flex items-center gap-1.5 text-xs font-text text-mist-500">
                    <span className="size-2.5 rounded-full bg-primary-500" />
                    Successful jobs
                </span>
                <span className="flex items-center gap-1.5 text-xs font-text text-mist-500">
                    <span className="size-2.5 rounded-full bg-secondary-400" />
                    Unsuccessful jobs
                </span>
            </div>
        </div>
    );
}