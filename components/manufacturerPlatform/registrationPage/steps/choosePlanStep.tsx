"use client";

import { useState } from "react";
import { useController, useWatch, UseFormReturn } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, fromKobo } from "@/lib/currency";
import MainForm from "@/components/form";
import { getAnnualSavingPercent, type PricingPlan } from "@/constant/plans";
import ListPrice from "@/components/ui/listPrice";
import { Skeleton } from "@/components/ui/skeleton";
import Notice from "../../notice";
import LoadError from "../../loadError";
import StepFooter from "../stepFooter";
import StepHeader from "../stepHeader";
import CouponField, {
    getCouponDiscountKobo,
    pickBestDiscount,
    type AppliedCoupon,
} from "@/components/manufacturerPlatform/form/couponField";
import {
    getPlanPrice,
    isSoloPlan,
    type BillingCycle,
    type RegistrationFormValues,
} from "../types";
import { usePlans } from "@/hooks/usePlans";

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "annual", label: "Yearly" },
];

/**
 * What yearly billing saves across the plans, from their prices: the same
 * saving on every plan reads "save 17%", differing ones "save up to 17%".
 * Null when no plan saves anything (or there are no plans yet).
 */
function getAnnualSavingLabel(plans: PricingPlan[]): string | null {
    const savings = plans
        .filter((plan) => plan.monthlyPrice > 0 && plan.annualPrice > 0)
        .map(getAnnualSavingPercent)
        .filter((percent) => percent > 0);
    if (savings.length === 0) return null;
    const best = Math.max(...savings);
    return savings.every((percent) => percent === best) ? `save ${best}%` : `save up to ${best}%`;
}

const PER: Record<BillingCycle, string> = { monthly: "month", annual: "year" };

export type ChoosePlanStepProps = {
    methods: UseFormReturn<RegistrationFormValues>;
    /** Set once the plan is paid for — the choice is then locked. */
    paymentReference: string | null;
    /** Starts the payment, with the coupon code when one is applied. */
    onSubmit: (couponCode?: string) => void;
    isLoading: boolean;
    /** A coupon error from starting the payment, shown under the coupon. */
    couponError?: string | null;
};

// Step 3 — pick a plan and billing cycle, then pay. Submitting starts the
// payment; once it's paid, submitting just continues (coming back to this
// step never charges again).
export default function ChoosePlanStep({
    methods,
    paymentReference,
    onSubmit,
    isLoading,
    couponError,
}: ChoosePlanStepProps) {
    const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
    const email = useWatch({ control: methods.control, name: "email" });
    const { plans, discountPercent, getPlan, isPending: isPlansPending, isError: isPlansError } = usePlans();

    const { field: planField, fieldState: planState } = useController({
        name: "plan",
        control: methods.control,
        rules: { required: "Choose a plan to continue" },
    });
    const { field: cycleField } = useController({
        name: "billingCycle",
        control: methods.control,
    });

    const plan = getPlan(planField.value);
    const billingCycle: BillingCycle = cycleField.value;
    const offerPrice = plan ? getPlanPrice(plan, billingCycle, discountPercent) : 0;
    const isPaid = !!paymentReference;
    // A coupon and the platform offer never stack: the one that saves more is used
    const listPrice = plan ? getPlanPrice(plan, billingCycle, 0) : 0;
    const listPriceKobo = Math.round(listPrice * 100);
    const couponDiscountKobo = isPaid ? 0 : getCouponDiscountKobo(coupon, listPriceKobo);
    const best = pickBestDiscount(Math.round((listPrice - offerPrice) * 100), couponDiscountKobo);
    const price = best.source === "coupon" ? fromKobo(listPriceKobo - couponDiscountKobo) : offerPrice;
    const offerText = discountPercent > 0 ? `Every plan is ${discountPercent}% off for now. ` : "";
    const annualSaving = getAnnualSavingLabel(plans);
    const savingText = annualSaving
        ? ` With yearly billing you ${annualSaving} on paying monthly.`
        : "";
    const hasNoPlans = !isPlansPending && !isPlansError && plans.length === 0;

    return (
        <div className="flex flex-col gap-6">
            <StepHeader
                step={3}
                title="Choose a plan"
                description={`${offerText}Pick the plan that fits your business.${savingText}`}
            />

            <MainForm<RegistrationFormValues>
                methods={methods}
                fields={[]}
                // The API picks the best one again, so an applied coupon is always sent
                onSubmit={() => onSubmit(!isPaid ? coupon?.coupon.code : undefined)}
                isLoading={isLoading}
                footerSlot={
                    <div className="flex flex-col gap-5">
                        <div
                            role="radiogroup"
                            aria-label="Billing"
                            className="grid grid-cols-2 gap-1 rounded-lg bg-mist-100 p-1"
                        >
                            {BILLING_CYCLES.map((cycle) => (
                                <label
                                    key={cycle.value}
                                    className={cn(
                                        "flex items-center justify-center rounded-md px-2 py-2 text-xs sm:text-sm font-medium font-text text-mist-600 transition-colors has-checked:bg-white has-checked:text-secondary-700 has-checked:shadow-sm has-focus-visible:ring-2 has-focus-visible:ring-secondary-300",
                                        isPaid ? "cursor-not-allowed" : "cursor-pointer",
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name={cycleField.name}
                                        value={cycle.value}
                                        checked={billingCycle === cycle.value}
                                        onChange={() => cycleField.onChange(cycle.value)}
                                        disabled={isPaid}
                                        className="sr-only"
                                    />
                                    {cycle.value === "annual" && annualSaving
                                        ? `${cycle.label} · ${annualSaving}`
                                        : cycle.label}
                                </label>
                            ))}
                        </div>

                        <div role="radiogroup" aria-label="Plan" className="flex flex-col gap-3">
                            {isPlansError && (
                                <LoadError>Couldn&apos;t load the plans. Please refresh the page to try again.</LoadError>
                            )}
                            {isPlansPending && [1, 2, 3].map((i) => <PlanOptionSkeleton key={i} />)}
                            {hasNoPlans && (
                                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center font-text">
                                    <p className="text-sm font-medium text-mist-900">No plans available right now</p>
                                    <p className="mt-1 text-xs text-mist-500">
                                        Please check back later, or contact support to get set up.
                                    </p>
                                </div>
                            )}
                            {plans.map((option) => (
                                <PlanOption
                                    key={option.id}
                                    plan={option}
                                    billingCycle={billingCycle}
                                    discountPercent={discountPercent}
                                    name={planField.name}
                                    checked={planField.value === option.id}
                                    onSelect={() => planField.onChange(option.id)}
                                    disabled={isPaid}
                                />
                            ))}
                        </div>
                        {planState.error && (
                            <span className="text-xs font-text text-error-500">
                                {planState.error.message}
                            </span>
                        )}

                        {plan && isSoloPlan(plan.id) && !isPaid && (
                            <Notice>
                                On the Solo plan, your company tax number and business
                                license are optional.
                            </Notice>
                        )}

                        {plan &&
                            (isPaid ? (
                                <div className="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3.5 text-sm font-text">
                                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary-600" />
                                    <p className="text-primary-800">
                                        <span className="font-medium">{plan.name}</span> paid:{" "}
                                        {formatPrice(price)} per {PER[billingCycle]}. Contact
                                        support if you need to change plans.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                <CouponField
                                    kind="subscription"
                                    amountKobo={listPriceKobo}
                                    email={email}
                                    applied={coupon}
                                    onApply={setCoupon}
                                    onRemove={() => setCoupon(null)}
                                    disabled={isLoading}
                                    error={couponError}
                                />
                                <div className="flex flex-col gap-1 rounded-xl border border-border px-4 py-3.5 font-text">
                                    {coupon && (
                                        <p className="mb-1 text-xs text-primary-800">
                                            {best.source === "coupon"
                                                ? `Coupon ${coupon.coupon.code} applied: ${formatPrice(fromKobo(couponDiscountKobo))} off.`
                                                : `The current ${discountPercent}% offer saves more, so it's used instead.`}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <span className="text-mist-600">Total due today</span>
                                        <span className="text-base font-semibold text-mist-950">
                                            {formatPrice(price)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-mist-500">
                                        {plan.name}, billed{" "}
                                        {billingCycle === "annual" ? "yearly" : "monthly"}. You&apos;ll
                                        pay securely through our payment partner.
                                        {best.source === "coupon" && " The coupon applies to this first payment only."}
                                    </p>
                                </div>
                                </div>
                            ))}
                    </div>
                }
                renderFooter={({ isLoading }) => (
                    <StepFooter
                        isLoading={isLoading}
                        canSubmit={!!plan}
                        submitLabel={plan && !isPaid ? `Pay ${formatPrice(price)}` : "Continue"}
                    />
                )}
            />
        </div>
    );
}

/** A PlanOption while the plans load. */
function PlanOptionSkeleton() {
    return (
        <div aria-hidden className="flex gap-3 rounded-xl border border-border bg-white p-4">
            <Skeleton className="mt-1 size-4 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-3 w-32" />
                <div className="flex flex-col gap-1.5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between gap-3">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PlanOption({
    plan,
    billingCycle,
    discountPercent,
    name,
    checked,
    onSelect,
    disabled,
}: {
    plan: PricingPlan;
    billingCycle: BillingCycle;
    discountPercent: number;
    name: string;
    checked: boolean;
    onSelect: () => void;
    disabled: boolean;
}) {
    return (
        <label
            className={cn(
                "flex gap-3 rounded-xl border border-border bg-white p-4 transition-colors has-checked:border-secondary-700 has-checked:bg-secondary-50/40 has-focus-visible:ring-2 has-focus-visible:ring-secondary-300",
                disabled ? "cursor-not-allowed" : "cursor-pointer hover:border-mist-300",
                disabled && !checked && "opacity-50",
            )}
        >
            <input
                type="radio"
                name={name}
                value={plan.id}
                checked={checked}
                onChange={onSelect}
                disabled={disabled}
                className="mt-1 size-4 shrink-0 accent-secondary-700"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-base font-semibold font-text text-mist-950">
                        {plan.name}
                    </span>
                    <span className="flex flex-wrap items-baseline gap-x-2 text-base font-semibold font-text text-mist-950">
                        <ListPrice plan={plan} billingCycle={billingCycle} discountPercent={discountPercent} className="text-xs text-mist-400" />
                        <span>
                            {formatPrice(getPlanPrice(plan, billingCycle, discountPercent))}
                            <span className="text-xs font-normal text-mist-500">
                                /{PER[billingCycle]}
                            </span>
                        </span>
                    </span>
                </div>
                <span className="text-[11px] font-medium font-text uppercase tracking-wide text-mist-500">
                    {plan.targetAudience}
                </span>
                <ul className="flex flex-col gap-1 text-xs font-text text-mist-600">
                    {plan.features.map((feature) => (
                        <li key={feature.label} className="flex justify-between gap-3">
                            <span>{feature.label}</span>
                            <span className="font-medium text-mist-900">{feature.value}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </label>
    );
}
