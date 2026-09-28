import Image from "next/image";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import LogoLink from "@/components/ui/logoLink";
import { MANDE_WEBSITE_URL } from "@/constant/navigation";
import { AUTH_HEADLINE, AUTH_HERO_IMAGE } from "@/constant/global";
import type { RegistrationStep } from "@/constant/manufacturer";

export type AuthSidePanelProps = {
    steps?: RegistrationStep[];
    currentStepIndex?: number;
    isCurrentStepComplete?: boolean;
};

export default function AuthSidePanel({
    steps,
    currentStepIndex = 0,
    isCurrentStepComplete = false,
}: AuthSidePanelProps) {
    return (
        <div className="relative isolate hidden md:flex md:w-1/2 lg:w-2/5 flex-col justify-between overflow-hidden p-10 lg:p-14 text-white">
            <Image
                src={AUTH_HERO_IMAGE}
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 50vw, 0vw"
                className="object-cover -z-20"
            />
            <div
                className="absolute inset-0 -z-10 bg-linear-to-br from-primary-900/85 via-primary-800/50 to-secondary-900/80"
                aria-hidden
            />

            <h1 className="text-4xl font-bold font-text leading-tight max-w-md text-pretty">
                {AUTH_HEADLINE}
            </h1>

            {steps && steps.length > 0 && (
                <div className="flex flex-col gap-6">
                    <span className="text-xs font-semibold font-text tracking-widest uppercase text-white/80">
                        Get Started
                    </span>
                    <ol className="flex flex-col">
                        {steps.map((step, index) => {
                            const isComplete =
                                index < currentStepIndex ||
                                (index === currentStepIndex &&
                                    isCurrentStepComplete);
                            const isLast = index === steps.length - 1;

                            return (
                                <li key={step.label} className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={cn(
                                                "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                                                isComplete
                                                    ? "bg-primary-500 border-primary-500"
                                                    : "border-white/60",
                                            )}
                                        >
                                            {isComplete && (
                                                <CheckIcon
                                                    className="size-3.5 text-white"
                                                    strokeWidth={3}
                                                />
                                            )}
                                        </span>
                                        <span className="text-sm font-medium font-text">
                                            {step.label}
                                        </span>
                                    </div>
                                    {!isLast && (
                                        <span
                                            className="ml-3 h-5 w-px border-l border-dashed border-white/50"
                                            aria-hidden
                                        />
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}

            <LogoLink href={MANDE_WEBSITE_URL} label="MANDE, go to the Mande website" tone="light" className="max-w-35" />
        </div>
    );
}
