import { ReactNode } from "react";

export type StepHeaderProps = {
    step: number;
    totalSteps: number;
    title: ReactNode;
    description?: string;
};

export default function StepHeader({
    step,
    totalSteps,
    title,
    description,
}: StepHeaderProps) {
    return (
        <div className="flex flex-col gap-2">
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
