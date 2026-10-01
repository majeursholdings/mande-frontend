"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
import { MANUFACTURER_DASHBOARD_URL, REGISTRATION_STEPS } from "@/constant/manufacturer";
import { ARTISAN_LOGIN_URL, ARTISAN_SIGNUP_URL } from "@/constant/navigation";
import { useRedirectIfAuthenticated } from "@/hooks/useAuthRedirect";
import { MandeApiError, getErrorMessage, getStoredAccessToken } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { authService } from "@/lib/services/authService";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { subscriptionService, type SubscriptionPayment } from "@/lib/services/subscriptionService";

const hasValue = (value: unknown): boolean => {
    if (typeof value === "boolean") return value === true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof FileList !== "undefined" && value instanceof FileList) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
};

/** Stands in for a payment reference when the plan turns out to be paid for already. */
const ALREADY_PAID = "already-paid";

// Coming back from the checkout, the payment partner can take a moment to
// settle the charge: check a few times before saying it's still pending.
const CONFIRM_ATTEMPTS = 3;
const CONFIRM_RETRY_MS = 2000;

async function confirmPlanPayment(reference: string): Promise<SubscriptionPayment | null> {
    let payment: SubscriptionPayment | null = null;
    for (let attempt = 1; attempt <= CONFIRM_ATTEMPTS; attempt++) {
        ({ payment } = await subscriptionService.confirmPayment(reference));
        if (payment?.status !== "pending" || attempt === CONFIRM_ATTEMPTS) break;
        await new Promise((resolve) => setTimeout(resolve, CONFIRM_RETRY_MS));
    }
    return payment;
}

/**
 * Saves a paid-for plan into the sign-up progress, so it's never charged
 * twice, and prefills the staff question (step 5) from the plan's team size
 * unless it's already been answered.
 */
function savePaidPlan(methods: UseFormReturn<RegistrationFormValues>, reference: string) {
    const plan = getPricingPlan(methods.getValues("plan"));
    if (plan && !methods.getValues("staffRange")) {
        methods.setValue("staffRange", plan.defaultStaffRange);
    }
    saveRegistrationProgress(3, methods.getValues(), reference);
}

// Saved progress is only readable in the browser; it never changes under us
// mid-session, so there's nothing to subscribe to.
const subscribeToNothing = () => () => {};

export default function ManufacRegPage({
    initialPlan,
    paymentReference,
}: {
    initialPlan?: string;
    /** Set when the payment partner's checkout sends them back here. */
    paymentReference?: string;
}) {
    const queryClient = useQueryClient();
    // undefined on the server and during hydration — the wizard waits for it,
    // so it mounts on the right step instead of jumping there afterwards
    const savedProgress = useSyncExternalStore(
        subscribeToNothing,
        readSavedRegistration,
        () => undefined,
    );
    const [restarts, setRestarts] = useState(0);
    // Verifying the email signs them in, but they're not done until the last
    // step: only someone who arrives signed in with no sign-up underway moves on
    useRedirectIfAuthenticated({ enabled: savedProgress === null && !paymentReference });

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
            returnedPaymentReference={restarts === 0 ? paymentReference : undefined}
            onStartOver={async () => {
                // The account signed in part way belongs to whoever started this sign-up
                if (getStoredAccessToken()) {
                    try {
                        await authService.logout();
                    } catch {
                        // Signed out here either way
                    }
                    queryClient.removeQueries({ queryKey: queryKeys.auth.all });
                }
                clearRegistrationProgress();
                setRestarts((count) => count + 1);
            }}
        />
    );
}

function RegistrationWizard({
    savedProgress,
    initialPlan,
    returnedPaymentReference,
    onStartOver,
}: {
    /** Where an earlier, unfinished sign-up left off — resumes from there. */
    savedProgress: RegistrationProgress | null;
    /** A plan picked on the pricing section (?plan=…), preselected on the plan step. */
    initialPlan?: string;
    /** The payment the checkout just sent them back from, still to be confirmed. */
    returnedPaymentReference?: string;
    onStartOver: () => void;
}) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const methods = useForm<RegistrationFormValues>({
        mode: "onTouched",
        defaultValues: {
            ...REGISTRATION_DEFAULT_VALUES,
            ...(initialPlan && getPricingPlan(initialPlan) ? { plan: initialPlan } : {}),
            ...savedProgress?.values,
        },
    });
    const [currentStep, setCurrentStep] = useState(() => {
        const step = savedProgress?.stepIndex ?? 0;
        // Back from the checkout means the plan step at least
        return returnedPaymentReference ? Math.max(step, 2) : step;
    });
    const [paymentReference, setPaymentReference] = useState(
        savedProgress?.paymentReference ?? null,
    );
    const [resumedAtStep] = useState(
        returnedPaymentReference ? null : (savedProgress?.stepIndex ?? null),
    );
    const [isLoading, setIsLoading] = useState(!!returnedPaymentReference);

    // Subscribes to every field so the side panel's checkmarks react to live values
    const watched = useWatch({ control: methods.control });
    const isCurrentStepComplete = getStepRequiredFields(currentStep, watched.plan ?? "").every(
        (name) => hasValue(watched[name]),
    );

    /** Runs a step's request; on success, saves progress and moves to `nextStep`. */
    const runStep = async (
        request: () => Promise<void>,
        nextStep: number,
        errorMessage: string,
    ) => {
        setIsLoading(true);
        try {
            await request();
            saveRegistrationProgress(nextStep, methods.getValues(), paymentReference);
            setCurrentStep(nextStep);
        } catch (err) {
            toast.error(getErrorMessage(err, errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    // The plan is paid for: move on to the company details
    const completePayment = (reference: string) => {
        savePaidPlan(methods, reference);
        setPaymentReference(reference);
        setCurrentStep(3);
    };

    // Back from the checkout: check the payment with the payment partner (via
    // the API) before moving on. Runs once, even when effects run twice in dev.
    const confirmStarted = useRef(false);
    useEffect(() => {
        if (!returnedPaymentReference || confirmStarted.current) return;
        confirmStarted.current = true;
        const reference = returnedPaymentReference;
        void (async () => {
            try {
                const payment = await confirmPlanPayment(reference);
                if (payment?.status === "succeeded") {
                    savePaidPlan(methods, reference);
                    setPaymentReference(reference);
                    setCurrentStep(3);
                    toast.success("Payment successful");
                } else if (payment?.status === "failed") {
                    toast.error(payment.failureReason || "Payment didn't go through. Please try again.");
                } else {
                    // Keeps ?reference in the address, so refreshing checks again
                    toast.info(
                        "We're still confirming your payment. Refresh this page in a minute to check again.",
                    );
                    return;
                }
                router.replace(ARTISAN_SIGNUP_URL);
            } catch (err) {
                toast.error(getErrorMessage(err, "Couldn't check your payment. Refresh this page to try again."));
            } finally {
                setIsLoading(false);
            }
        })();
    }, [returnedPaymentReference, methods, router]);

    // Step 1: creates the account (so progress can be saved from here on)
    // and emails the verification code
    const handleCreateAccount = () =>
        runStep(
            async () => {
                const { firstName, lastName, email, phone, password } = methods.getValues();
                await authService.registerManufacturer({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    password,
                });
            },
            1,
            "Couldn't create your account. Please try again.",
        );

    // Step 2: the code signs them in, which the plan and later steps need
    const handleVerifyEmail = () =>
        runStep(
            async () => {
                const { email, otp } = methods.getValues();
                await authService.verifyEmail(email.trim(), otp);
                await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
            },
            2,
            "Couldn't verify the code. Please try again.",
        );

    // Step 3: sends them to the payment partner's checkout, which comes back
    // here with ?reference=… (see the effect above). Already paid: just continue.
    const handlePayment = async () => {
        if (paymentReference) {
            completePayment(paymentReference);
            return;
        }
        setIsLoading(true);
        try {
            const values = methods.getValues();
            // Keeps the plan picked, for when the checkout sends them back
            saveRegistrationProgress(2, values, null);
            const { checkoutUrl } = await subscriptionService.startCheckout({
                planId: values.plan,
                billingCycle: values.billingCycle,
                saveCard: true,
                returnPath: ARTISAN_SIGNUP_URL,
            });
            if (!checkoutUrl.startsWith("https://")) {
                throw new Error("Payments aren't available right now. Please try again later.");
            }
            // Stays loading while the browser leaves for the checkout
            window.location.assign(checkoutUrl);
        } catch (err) {
            setIsLoading(false);
            if (err instanceof MandeApiError && err.code === "SUBSCRIPTION_ACTIVE") {
                toast.success("Your plan is already paid for");
                completePayment(ALREADY_PAID);
                return;
            }
            toast.error(getErrorMessage(err, "Payment didn't go through. Please try again."));
        }
    };

    // Step 4: saves the company details, then the NIN (its card photo was
    // uploaded when it was picked) and any business documents
    const handleCompanyDetails = () =>
        runStep(
            async () => {
                const values = methods.getValues();
                if (!values.ninCard?.publicId) {
                    throw new Error("Wait for your NIN card photo to finish uploading");
                }
                await manufacturerService.updateCompanyInfo({
                    companyName: values.companyName.trim(),
                    streetAddress: values.streetAddress.trim(),
                    city: values.city.trim(),
                    state: values.state,
                    country: values.country,
                });
                await manufacturerService.submitNin({
                    ninNumber: values.ninNumber.trim(),
                    image: values.ninCard.publicId,
                });
                const companyTaxNumber = values.companyTaxNumber.trim();
                const businessLicenseNumber = values.businessLicenseNumber.trim();
                // Optional on the Solo plan: only sent when there's one to check
                if (companyTaxNumber || businessLicenseNumber) {
                    await manufacturerService.submitBusinessDocuments({
                        ...(companyTaxNumber && { companyTaxNumber }),
                        ...(businessLicenseNumber && { businessLicenseNumber }),
                    });
                }
            },
            4,
            "Couldn't save your company details. Please try again.",
        );

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        try {
            const { staffRange, specialities, productionLeadTime, materialsInventory } =
                methods.getValues();
            await manufacturerService.updateCompanyInfo({
                staffRange,
                specialities,
                productionLeadTime,
                materialsInventory,
            });
            clearRegistrationProgress();
            await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
            toast.success("Your manufacturer account has been created!");
            router.push(MANUFACTURER_DASHBOARD_URL);
        } catch (err) {
            toast.error(getErrorMessage(err, "Something went wrong. Please try again."));
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
