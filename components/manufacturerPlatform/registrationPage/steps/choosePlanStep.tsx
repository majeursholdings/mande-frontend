"use client";

import { useController, UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { superAdminService } from "@/lib/services/superAdminService";
import MainForm from "@/components/form";
import { PRICING_PLANS, type PricingPlan } from "@/constant/sampleData";
import ListPrice from "@/components/ui/listPrice";
import Notice from "../../notice";
import StepFooter from "../stepFooter";
import StepHeader from "../stepHeader";
import {
    getPlanPrice,
    getPricingPlan,
    isSoloPlan,
    type BillingCycle,
    type RegistrationFormValues,
} from "../types";

const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "annual", label: "Yearly · save 17%" },
];

const PER: Record<BillingCycle, string> = { monthly: "month", annual: "year" };

export type ChoosePlanStepProps = {
    methods: UseFormReturn<RegistrationFormValues>;
    /** Set once the plan is paid for — the choice is then locked. */
    paymentReference: string | null;
    onSubmit: () => void;
    isLoading: boolean;
};

// Step 3 — pick a plan and billing cycle, then pay. Submitting starts the
// payment; once it's paid, submitting just continues (coming back to this
// step never charges again).
export default function ChoosePlanStep({
    methods,
    paymentReference,
    onSubmit,
    isLoading,
}: ChoosePlanStepProps) {
    const { data: plansData } = useQuery({
        queryKey: queryKeys.settings.plans(),
        queryFn: () => superAdminService.getPlans(),
    });
    const plans = plansData?.plans ?? PRICING_PLANS;
    const discountPercent = plansData?.discountPercent ?? 0;

    const { field: planField, fieldState: planState } = useController({
        name: "plan",
        control: methods.control,
        rules: { required: "Choose a plan to continue" },
    });
    const { field: cycleField } = useController({
        name: "billingCycle",
        control: methods.control,
    });

    const plan = plans.find((p) => p.id === planField.value) ?? getPricingPlan(planField.value);
    const billingCycle: BillingCycle = cycleField.value;
    const price = plan ? getPlanPrice(plan, billingCycle, discountPercent) : 0;
    const isPaid = !!paymentReference;
    const offerText = discountPercent > 0 ? `Every plan is ${discountPercent}% off for now. ` : "";

    return (
        <div className="flex flex-col gap-6">
            <StepHeader
                step={3}
                title="Choose a plan"
                description={`${offerText}Pick the plan that fits your business. With yearly billing you pay for 10 months and work all 12.`}
            />

            <MainForm<RegistrationFormValues>
                methods={methods}
                fields={[]}
                onSubmit={onSubmit}
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
                                    {cycle.label}
                                </label>
                            ))}
                        </div>

                        <div role="radiogroup" aria-label="Plan" className="flex flex-col gap-3">
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
                                <div className="flex flex-col gap-1 rounded-xl border border-border px-4 py-3.5 font-text">
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
                                    </p>
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
