import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { JOB_PRODUCTION_STEPS, type ProductionStepKey } from "@/constant/manufacturer";
import { DetailSection } from "./detailParts";

/**
 * Every production step, with the one the manufacturer is on marked — done
 * steps ticked, the current one highlighted, the rest still to come.
 */
export default function ProductionSteps({ completedStepKeys }: { completedStepKeys: ProductionStepKey[] }) {
    const doneCount = completedStepKeys.length;
    const total = JOB_PRODUCTION_STEPS.length;

    return (
        <DetailSection
            title="Production steps"
            action={
                <span className="text-xs font-text text-mist-500">
                    {doneCount} of {total} done
                </span>
            }
        >
            <ol className="flex flex-col">
                {JOB_PRODUCTION_STEPS.map((step, index) => {
                    const state = index < doneCount ? "done" : index === doneCount ? "current" : "upcoming";
                    const isLast = index === total - 1;
                    return (
                        <li
                            key={step.key}
                            aria-current={state === "current" ? "step" : undefined}
                            className="flex gap-3"
                        >
                            <div className="flex flex-col items-center">
                                <span
                                    className={cn(
                                        "flex size-6 shrink-0 items-center justify-center rounded-full",
                                        state === "done" && "bg-primary-600 text-white",
                                        state === "current" && "border-2 border-secondary-700 bg-white",
                                        state === "upcoming" && "border-2 border-mist-200 bg-white",
                                    )}
                                >
                                    {state === "done" && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                                    {state === "current" && (
                                        <span className="size-2 animate-pulse rounded-full bg-secondary-700 motion-reduce:animate-none" />
                                    )}
                                </span>
                                {!isLast && (
                                    <span
                                        className={cn(
                                            "my-1 min-h-4 w-0.5 flex-1 rounded-full",
                                            index < doneCount ? "bg-primary-600" : "bg-mist-200",
                                        )}
                                    />
                                )}
                            </div>
                            <div className={cn("flex flex-1 items-start justify-between gap-3", !isLast && "pb-4")}>
                                <span
                                    className={cn(
                                        "text-sm font-text",
                                        state === "upcoming" ? "text-mist-400" : "font-medium text-mist-950",
                                    )}
                                >
                                    {step.label}
                                </span>
                                <span
                                    className={cn(
                                        "text-xs font-text",
                                        state === "done" && "text-primary-700",
                                        state === "current" && "font-medium text-secondary-700",
                                        state === "upcoming" && "text-mist-400",
                                    )}
                                >
                                    {state === "done" ? "Done" : state === "current" ? "Manufacturer is here" : "To do"}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </DetailSection>
    );
}
