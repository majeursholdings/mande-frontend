"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { NOT_INCLUDED, type PricingPlan } from "@/constant/sampleData";
import type { PlanChanges } from "../settingsContext";

/** The feature that's also the plan's job limit (maxConcurrentJobs). */
const CONCURRENT_JOBS_LABEL = "Concurrent jobs";
const UNLIMITED = "Unlimited";

type PlanFormValues = Record<string, string>;

const featureField = (index: number) => `feature-${index}`;

/**
 * A plan's usual prices (before any offer), who it's for, and what it
 * includes. The concurrent-jobs feature is a number (blank for no limit), as
 * it's what the platform holds manufacturers to; the rest are words, or "Not
 * included".
 */
export default function PlanForm({
    plan,
    onSave,
    onCancel,
}: {
    plan: PricingPlan;
    onSave: (changes: PlanChanges) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<PlanFormValues>({
        mode: "onTouched",
        defaultValues: {
            targetAudience: plan.targetAudience,
            monthlyPrice: String(plan.monthlyPrice),
            annualPrice: String(plan.annualPrice),
            concurrentJobs: plan.maxConcurrentJobs === null ? "" : String(plan.maxConcurrentJobs),
            ...Object.fromEntries(plan.features.map((feature, index) => [featureField(index), feature.value])),
        },
    });

    const fields: FormFieldConfig[] = [
        {
            name: "targetAudience",
            type: "text",
            label: "Who it's for",
            placeholder: "e.g. UP TO 10 PEOPLE TEAM",
            validation: { required: "Say who the plan is for" },
        },
        {
            name: "monthlyPrice",
            type: "amount",
            label: "Monthly price",
            placeholder: "₦0",
            validation: {
                required: "Monthly price is required",
                validate: (value: string) => Number(value) > 0 || "The price must be more than ₦0",
            },
        },
        {
            name: "annualPrice",
            type: "amount",
            label: "Yearly price",
            placeholder: "₦0",
            validation: {
                required: "Yearly price is required",
                validate: (value: string, values: PlanFormValues) =>
                    Number(value) <= Number(values.monthlyPrice) * 12 ||
                    "Make it no more than 12 months of the monthly price",
            },
        },
        ...plan.features.map((feature, index): FormFieldConfig =>
            feature.label === CONCURRENT_JOBS_LABEL
                ? {
                      name: "concurrentJobs",
                      type: "number",
                      label: CONCURRENT_JOBS_LABEL,
                      placeholder: UNLIMITED,
                      description: "Jobs they can hold at once. Leave it blank for no limit.",
                      min: 1,
                      validation: {
                          validate: (value: string) =>
                              value === "" || (Number.isInteger(Number(value)) && Number(value) >= 1) || "Enter a whole number, 1 or more",
                      },
                  }
                : {
                      name: featureField(index),
                      type: "text",
                      label: feature.label,
                      placeholder: NOT_INCLUDED,
                      description: `Write "${NOT_INCLUDED}" if the plan doesn't have it.`,
                      validation: { required: `Say what ${feature.label.toLowerCase()} the plan has` },
                  },
        ),
    ];

    const handleSubmit = async (values: PlanFormValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate saving it
            await new Promise((resolve) => setTimeout(resolve, 600));
            const maxConcurrentJobs = values.concurrentJobs ? Number(values.concurrentJobs) : null;
            onSave({
                targetAudience: values.targetAudience.trim(),
                monthlyPrice: Number(values.monthlyPrice),
                annualPrice: Number(values.annualPrice),
                maxConcurrentJobs,
                features: plan.features.map((feature, index) => ({
                    label: feature.label,
                    value:
                        feature.label === CONCURRENT_JOBS_LABEL
                            ? (maxConcurrentJobs === null ? UNLIMITED : String(maxConcurrentJobs))
                            : values[featureField(index)].trim(),
                })),
            });
        } catch {
            toast.error("Couldn't save the plan. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<PlanFormValues>
            methods={methods}
            fields={fields}
            rowPairs={[["monthlyPrice", "annualPrice"]]}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <FormSubmitButton
                        label="Save plan"
                        loadingLabel="Saving..."
                        isLoading={isLoading}
                        disabled={!canSubmit}
                        className="w-auto px-6"
                    />
                </div>
            )}
        />
    );
}
