import { ReactNode } from "react";
import { REGISTRATION_STEPS } from "@/constant/manufacturer";

export type StepHeaderProps = {
    step: number;
    /** Defaults to the number of REGISTRATION_STEPS. */
    totalSteps?: number;
    title: ReactNode;
    description?: string;
};

export default function StepHeader({
    step,
    totalSteps = REGISTRATION_STEPS.length,
    title,
    description,
}: StepHeaderProps) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold font-text uppercase tracking-wider text-secondary-700">
                Manufacturer Platform
            </span>
            <span className="text-xs font-semibold font-text tracking-wide uppercase text-primary-700">
                Step {step} of {totalSteps}
            </span>
            <h1 className="text-2xl font-bold font-text text-[#1F2937]">
                {title}
            </h1>
            {description && (
                <p className="text-sm font-normal font-text text-[#6B7280]">
                    {description}
                </p>
            )}
        </div>
    );
}
