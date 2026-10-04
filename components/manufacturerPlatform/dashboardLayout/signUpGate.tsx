"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import LogoLink from "@/components/ui/logoLink";
import { MANUFACTURER_DASHBOARD_URL } from "@/constant/manufacturer";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService } from "@/lib/services/manufacturerService";
import ChoosePlanStep from "../registrationPage/steps/choosePlanStep";
import AboutCompanyStep from "../registrationPage/steps/aboutCompanyStep";
import CompanySpecificationsStep from "../registrationPage/steps/companySpecificationsStep";
import { saveCompanyDetails, saveCompanySpecifications } from "../registrationPage/registrationRequests";
import { REGISTRATION_DEFAULT_VALUES, type RegistrationFormValues } from "../registrationPage/types";
import Notice from "../notice";
import { useLogout } from "./logoutContext";
import DashboardFrameSkeleton from "./dashboardFrameSkeleton";
import { useManufacturerSubscription } from "./manufacturerSubscriptionContext";

// ─────────────────────────────────────────────────────────────────────────────
// SignUpGate — the dashboard, or, while sign-up isn't finished, the rest of
// it in place of every page, so it's the first thing they see when they log
// in. In order:
//   1. Pay for the plan (it was never paid for: the sign-up payment failed or
//      was left part way). The checkout comes back to the dashboard with
//      ?reference=…, which is checked here.
//   2. About the company and the NIN (sign-up's step 4), while the company
//      has no name: it's set once, at that step.
//   3. How the company works (step 5), while it has no specialities.
// What's left is worked out from the API's records each time, so it picks up
// wherever they stopped, on any device.
// ─────────────────────────────────────────────────────────────────────────────

type Stage = "payment" | "company" | "specifications";

/** The parts of GET /profile that say which sign-up steps are done. */
type ProfileProgress = { profile?: { companyName?: string; specialities?: string[] } };

const subscribeToNothing = () => () => {};
/** The payment the checkout sent them back from, read once in the browser. */
const readReturnedReference = () => new URLSearchParams(window.location.search).get("reference");

export default function SignUpGate({ children }: { children: ReactNode }) {
    const { isLoading: isPlanLoading, needsFirstPayment, confirmPayment } = useManufacturerSubscription();
    // The same query (and cache) as ManufacturerProfileProvider
    const { data: profileData, isPending: isProfileLoading } = useQuery({
        queryKey: queryKeys.profile.details(),
        queryFn: () => manufacturerService.getProfile() as Promise<ProfileProgress>,
        staleTime: 60_000,
    });
    const router = useRouter();
    const pathname = usePathname();
    const returnedReference = useSyncExternalStore(subscribeToNothing, readReturnedReference, () => null);
    const [settledReference, setSettledReference] = useState<string | null>(null);
    const isConfirming = !!returnedReference && returnedReference !== settledReference;

    // Back from the checkout: check the payment once before deciding what to show
    const confirmStarted = useRef(false);
    useEffect(() => {
        if (!returnedReference || confirmStarted.current) return;
        confirmStarted.current = true;
        void (async () => {
            try {
                const payment = await confirmPayment(returnedReference);
                if (payment?.status === "pending") {
                    toast.info("We're still confirming your payment. Refresh this page in a minute to check again.");
                } else if (payment?.status === "succeeded") {
                    toast.success("Payment successful");
                    router.replace(pathname);
                } else {
                    toast.error(payment?.failureReason || "Payment didn't go through. Please try again.");
                    router.replace(pathname);
                }
            } catch (err) {
                toast.error(getErrorMessage(err, "Couldn't check your payment. Refresh this page to try again."));
            } finally {
                setSettledReference(returnedReference);
            }
        })();
    }, [returnedReference, confirmPayment, pathname, router]);

    // Waits to know which screen to show: the dashboard or the sign-up steps
    if (isPlanLoading || isProfileLoading || isConfirming) return <DashboardFrameSkeleton />;

    // A profile that couldn't load says nothing either way: let them in
    const profile = profileData?.profile;
    const stage: Stage | null = needsFirstPayment
        ? "payment"
        : profile && !profile.companyName?.trim()
          ? "company"
          : profile && !profile.specialities?.length
            ? "specifications"
            : null;

    return stage ? <SignUpStepsScreen stage={stage} /> : children;
}

/** The sign-up steps still to do, one form across them (so the plan carries into step 4's rules). */
function SignUpStepsScreen({ stage }: { stage: Stage }) {
    const { subscription, latestPayment, payForPlan } = useManufacturerSubscription();
    const { requestLogout } = useLogout();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    // Paying: starts on the plan they last tried to pay for (or chose at
    // sign-up). After that, their plan, which decides what step 4 asks for.
    const unpaidPlanId = latestPayment?.planId ?? (subscription?.status === "pending_payment" ? subscription.planId : "");
    const methods = useForm<RegistrationFormValues>({
        mode: "onTouched",
        defaultValues: {
            ...REGISTRATION_DEFAULT_VALUES,
            plan: stage === "payment" ? unpaidPlanId : (subscription?.planId ?? ""),
            billingCycle: latestPayment?.billingCycle ?? subscription?.billingCycle ?? REGISTRATION_DEFAULT_VALUES.billingCycle,
        },
    });

    const handlePay = async () => {
        setIsLoading(true);
        try {
            const { plan, billingCycle } = methods.getValues();
            await payForPlan(plan, billingCycle, MANUFACTURER_DASHBOARD_URL);
            // Stays loading while the browser leaves for the checkout
        } catch (err) {
            toast.error(getErrorMessage(err, "Payment didn't go through. Please try again."));
            setIsLoading(false);
        }
    };

    /** Saves a step, then reloads the profile, which moves the gate on to what's left. */
    const runStep = async (save: (values: RegistrationFormValues) => Promise<void>, errorMessage: string, done?: string) => {
        setIsLoading(true);
        try {
            await save(methods.getValues());
            await queryClient.invalidateQueries({ queryKey: queryKeys.profile.details() });
            if (done) toast.success(done);
        } catch (err) {
            toast.error(getErrorMessage(err, errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-dvh flex-col bg-mist-50">
            <header className="flex items-center justify-between border-b border-border bg-white px-4 py-3.5 lg:px-8">
                <LogoLink href={MANUFACTURER_DASHBOARD_URL} className="w-30" />
                <button
                    type="button"
                    onClick={requestLogout}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium font-text text-mist-600 transition-colors hover:bg-mist-100 hover:text-mist-900"
                >
                    <LogOut className="size-4" strokeWidth={1.75} />
                    Logout
                </button>
            </header>

            <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-8 lg:py-12">
                {stage === "payment" && latestPayment?.status === "failed" && (
                    <Notice tone="warning">
                        Your last payment didn&apos;t go through
                        {latestPayment.failureReason ? ` (${latestPayment.failureReason})` : ""}. Choose a plan and
                        try again.
                    </Notice>
                )}
                <section className="rounded-xl border border-border bg-white p-5">
                    {stage === "payment" && (
                        <ChoosePlanStep
                            methods={methods}
                            paymentReference={null}
                            onSubmit={handlePay}
                            isLoading={isLoading}
                        />
                    )}
                    {stage === "company" && (
                        <AboutCompanyStep
                            methods={methods}
                            onContinue={() =>
                                runStep(saveCompanyDetails, "Couldn't save your company details. Please try again.")
                            }
                            isLoading={isLoading}
                        />
                    )}
                    {stage === "specifications" && (
                        <CompanySpecificationsStep
                            methods={methods}
                            onSubmit={() =>
                                runStep(
                                    saveCompanySpecifications,
                                    "Something went wrong. Please try again.",
                                    "Your manufacturer account has been created!",
                                )
                            }
                            isLoading={isLoading}
                        />
                    )}
                </section>
            </main>
        </div>
    );
}
