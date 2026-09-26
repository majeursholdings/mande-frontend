"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductionStep } from "@/constant/manufacturer";

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailStepRecorder — lets the manufacturer record production progress
// through the given steps, in order. Only the next incomplete step is
// clickable; later steps stay locked until the ones before them are done.
// Steps with tone "danger" (e.g. "Rejected") show red with an X once done.
// ─────────────────────────────────────────────────────────────────────────────

export default function JobDetailStepRecorder({
    steps,
    completedCount,
    onCompleteStep,
    readOnly = false,
}: {
    steps: ProductionStep[];
    /** Steps are completed in order, so the first `completedCount` are done. */
    completedCount: number;
    onCompleteStep: (key: string) => void;
    readOnly?: boolean;
}) {
    const nextStepIndex = completedCount;

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold font-text text-mist-950">Production steps</h3>
            <ol className="flex flex-col">
                {steps.map((step, index) => {
                    const isComplete = index < nextStepIndex;
                    const isCurrent = index === nextStepIndex && !readOnly;
                    const isLast = index === steps.length - 1;
                    const isDanger = step.tone === "danger";

                    return (
                        <li key={step.key} className="flex flex-col">
                            <button
                                type="button"
                                disabled={!isCurrent}
                                onClick={() => onCompleteStep(step.key)}
                                className={cn(
                                    "flex items-center gap-3 py-1.5 text-left",
                                    isCurrent ? "cursor-pointer" : "cursor-default",
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                        isComplete
                                            ? isDanger
                                                ? "bg-red-500 border-red-500"
                                                : "bg-primary-500 border-primary-500"
                                            : isCurrent
                                              ? "border-primary-500"
                                              : "border-mist-200",
                                    )}
                                >
                                    {isComplete &&
                                        (isDanger ? (
                                            <XIcon className="size-3.5 text-white" strokeWidth={3} />
                                        ) : (
                                            <CheckIcon className="size-3.5 text-white" strokeWidth={3} />
                                        ))}
                                </span>
                                <span
                                    className={cn(
                                        "text-sm font-text",
                                        isComplete && isDanger
                                            ? "font-medium text-red-600"
                                            : isComplete || isCurrent
                                              ? "font-medium text-mist-950"
                                              : "text-mist-400",
                                    )}
                                >
                                    {step.label}
                                </span>
                                {isCurrent && (
                                    <span className="text-xs font-text text-primary-600">
                                        Tap to mark done
                                    </span>
                                )}
                            </button>
                            {!isLast && (
                                <span
                                    className={cn(
                                        "ml-3 h-4 w-px border-l border-dashed",
                                        isComplete ? "border-primary-300" : "border-mist-200",
                                    )}
                                    aria-hidden
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
