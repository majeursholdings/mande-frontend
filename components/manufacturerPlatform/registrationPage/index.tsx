"use client";

import { useState, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import AuthScreenLayout from "../authScreenLayout";
import Notice from "../notice";
import UserDetailsStep from "./steps/userDetailsStep";
import VerifyEmailStep from "./steps/verifyEmailStep";
import ChoosePlanStep from "./steps/choosePlanStep";
import AboutCompanyStep from "./steps/aboutCompanyStep";
import CompanySpecificationsStep from "./steps/companySpecificationsStep";
import {
    REGISTRATION_DEFAULT_VALUES,
    RegistrationFormValues,
    getPricingPlan,
    getStepRequiredFields,
} from "./types";
import {
    clearRegistrationProgress,
    parseRegistrationProgress,
    readSavedRegistration,
    saveRegistrationProgress,
    type RegistrationProgress,
} from "./registrationProgress";
import { REGISTRATION_STEPS } from "@/constant/manufacturer";
import { ARTISAN_LOGIN_URL } from "@/constant/navigation";

const hasValue = (value: unknown): boolean => {
    if (typeof value === "boolean") return value === true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof FileList !== "undefined" && value instanceof FileList) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
};

// No backend is wired up yet — each step's request is simulated so the flow
// is testable end-to-end.
const simulateRequest = (ms = 800) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

// Saved progress is only readable in the browser; it never changes under us
// mid-session, so there's nothing to subscribe to.
const subscribeToNothing = () => () => {};

export default function ManufacRegPage({ initialPlan }: { initialPlan?: string }) {
    // undefined on the server and during hydration — the wizard waits for it,
    // so it mounts on the right step instead of jumping there afterwards
    const savedProgress = useSyncExternalStore(
        subscribeToNothing,
        readSavedRegistration,
        () => undefined,
    );
    const [restarts, setRestarts] = useState(0);

    if (savedProgress === undefined) {
        return (
            <AuthScreenLayout steps={REGISTRATION_STEPS}>
                <div className="flex flex-col gap-4" aria-busy>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                </div>
            </AuthScreenLayout>
        );
    }

    return (
        <RegistrationWizard
            key={restarts}
            savedProgress={restarts === 0 ? parseRegistrationProgress(savedProgress) : null}
            initialPlan={initialPlan}
            onStartOver={() => {
                clearRegistrationProgress();
                setRestarts((count) => count + 1);
            }}
        />
    );
}

function RegistrationWizard({
    savedProgress,
    initialPlan,
    onStartOver,
}: {
    /** Where an earlier, unfinished sign-up left off — resumes from there. */
    savedProgress: RegistrationProgress | null;
    /** A plan picked on the pricing section (?plan=…), preselected on the plan step. */
    initialPlan?: string;
    onStartOver: () => void;
}) {
    const router = useRouter();
    const methods = useForm<RegistrationFormValues>({
        mode: "onTouched",
        defaultValues: {
            ...REGISTRATION_DEFAULT_VALUES,
            ...(initialPlan && getPricingPlan(initialPlan) ? { plan: initialPlan } : {}),
            ...savedProgress?.values,
        },
    });
    const [currentStep, setCurrentStep] = useState(savedProgress?.stepIndex ?? 0);
    const [paymentReference, setPaymentReference] = useState(
        savedProgress?.paymentReference ?? null,
    );
    const [resumedAtStep] = useState(savedProgress?.stepIndex ?? null);
    const [isLoading, setIsLoading] = useState(false);

    // Subscribes to every field so the side panel's checkmarks react to live values
    const watched = useWatch({ control: methods.control });
    const isCurrentStepComplete = getStepRequiredFields(currentStep, watched.plan ?? "").every(
        (name) => hasValue(watched[name]),
    );

    /** Runs a step's request; on success, saves progress and moves to `nextStep`. */
    const runStep = async (
        request: () => Promise<{ paymentReference?: string } | void>,
        nextStep: number,
        errorMessage: string,
    ) => {
        setIsLoading(true);
        try {
            const result = await request();
            const reference = result?.paymentReference ?? paymentReference;
            saveRegistrationProgress(nextStep, methods.getValues(), reference);
            setPaymentReference(reference);
            setCurrentStep(nextStep);
        } catch {
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 1 — creates the account (so progress can be saved from here on)
    // and emails the verification code
    const handleCreateAccount = () =>
        runStep(() => simulateRequest(), 1, "Couldn't create your account. Please try again.");

    const handleVerifyEmail = () =>
        runStep(() => simulateRequest(), 2, "Couldn't verify the code. Please try again.");

    // Opens the payment partner's checkout (simulated) unless already paid
    const handlePayment = () =>
        runStep(
            async () => {
                // Prefill the staff question (step 5) from the plan's team size,
                // unless it's already been answered
                const plan = getPricingPlan(methods.getValues("plan"));
                if (plan && !methods.getValues("staffRange")) {
                    methods.setValue("staffRange", plan.defaultStaffRange);
                }
                if (paymentReference) return;
                await simulateRequest(1200);
                toast.success("Payment successful");
                return { paymentReference: `PAY-${Date.now()}` };
            },
            3,
            "Payment didn't go through. Please try again.",
        );

    // Saves the company details and uploads the NIN card photo
    const handleCompanyDetails = () =>
        runStep(() => simulateRequest(1000), 4, "Couldn't save your company details. Please try again.");

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        try {
            await simulateRequest();
            clearRegistrationProgress();
            toast.success("Your manufacturer account has been created!");
            router.push(ARTISAN_LOGIN_URL);
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const goBack = () => setCurrentStep((step) => Math.max(0, step - 1));

    return (
        <AuthScreenLayout
            steps={REGISTRATION_STEPS}
            currentStepIndex={currentStep}
            isCurrentStepComplete={isCurrentStepComplete}
        >
            <div className="flex flex-col gap-6">
                {resumedAtStep !== null && currentStep === resumedAtStep && (
                    <Notice>
                        Welcome back{watched.firstName ? `, ${watched.firstName}` : ""}! Pick
                        up where you left off.{" "}
                        <button
                            type="button"
                            onClick={onStartOver}
                            className="font-medium text-secondary-700 hover:underline cursor-pointer"
                        >
                            Not you? Start over
                        </button>
                    </Notice>
                )}

                {currentStep === 0 && (
                    <UserDetailsStep
                        methods={methods}
                        onContinue={handleCreateAccount}
                        isLoading={isLoading}
                    />
                )}
                {currentStep === 1 && (
                    <VerifyEmailStep
                        methods={methods}
                        email={watched.email ?? ""}
                        onContinue={handleVerifyEmail}
                        onBack={goBack}
                        isLoading={isLoading}
                    />
                )}
                {currentStep === 2 && (
                    <ChoosePlanStep
                        methods={methods}
                        paymentReference={paymentReference}
                        onSubmit={handlePayment}
                        isLoading={isLoading}
                    />
                )}
                {currentStep === 3 && (
                    <AboutCompanyStep
                        methods={methods}
                        onContinue={handleCompanyDetails}
                        onBack={goBack}
                        isLoading={isLoading}
                    />
                )}
                {currentStep === 4 && (
                    <CompanySpecificationsStep
                        methods={methods}
                        onSubmit={handleFinalSubmit}
                        onBack={goBack}
                        isLoading={isLoading}
                    />
                )}

                {currentStep === 0 && (
                    <p className="text-center text-sm font-text text-[#6B7280]">
                        Already have an account?{" "}
                        <Link
                            href={ARTISAN_LOGIN_URL}
                            className="text-secondary-700 font-medium hover:underline"
                        >
                            Login
                        </Link>
                    </p>
                )}
            </div>
        </AuthScreenLayout>
    );
}
