"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import AuthScreenLayout from "../authScreenLayout";
import UserDetailsStep from "./steps/userDetailsStep";
import VerifyEmailStep from "./steps/verifyEmailStep";
import AboutCompanyStep from "./steps/aboutCompanyStep";
import CompanySpecificationsStep from "./steps/companySpecificationsStep";
import {
    REGISTRATION_DEFAULT_VALUES,
    RegistrationFormValues,
    STEP_FIELD_NAMES,
} from "./types";
import { REGISTRATION_STEPS } from "@/constant/manufacturer";
import { ARTISAN_LOGIN_URL } from "@/constant/navigation";

const hasValue = (value: unknown): boolean => {
    if (typeof value === "boolean") return value === true;
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
};

export default function ManufacRegPage() {
    const router = useRouter();
    const methods = useForm<RegistrationFormValues>({
        mode: "onTouched",
        defaultValues: REGISTRATION_DEFAULT_VALUES,
    });
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Subscribes this component to every field so the sidebar checklist and
    // the "back to Login" footer can react to live values.
    const watched = useWatch({ control: methods.control });

    const currentStepFieldNames = STEP_FIELD_NAMES[currentStep] ?? [];
    const isCurrentStepComplete = currentStepFieldNames.every((name) =>
        hasValue(watched[name]),
    );

    const goBack = () => setCurrentStep((step) => Math.max(0, step - 1));

    // No backend is wired up yet — the submitted values aren't sent anywhere,
    // just simulated, so the wizard is fully testable end-to-end.
    const handleFinalSubmit = async () => {
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 800));
            toast.success("Your manufacturer account has been created!");
            router.push(ARTISAN_LOGIN_URL);
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const showLoginLink = currentStep === 0 || currentStep === 2;

    return (
        <AuthScreenLayout
            steps={REGISTRATION_STEPS}
            currentStepIndex={currentStep}
            isCurrentStepComplete={isCurrentStepComplete}
        >
            <div className="flex flex-col gap-6">
                {currentStep === 0 && (
                    <UserDetailsStep
                        methods={methods}
                        onContinue={() => setCurrentStep(1)}
                        isLoading={isLoading}
                    />
                )}
                {currentStep === 1 && (
                    <VerifyEmailStep
                        methods={methods}
                        email={watched.email ?? ""}
                        onContinue={() => setCurrentStep(2)}
                        onBack={goBack}
                        isLoading={isLoading}
                    />
                )}
                {currentStep === 2 && (
                    <AboutCompanyStep
                        methods={methods}
                        onContinue={() => setCurrentStep(3)}
                        onBack={goBack}
                        isLoading={isLoading}
                    />
                )}
                {currentStep === 3 && (
                    <CompanySpecificationsStep
                        methods={methods}
                        onSubmit={handleFinalSubmit}
                        onBack={goBack}
                        isLoading={isLoading}
                    />
                )}

                {showLoginLink && (
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
