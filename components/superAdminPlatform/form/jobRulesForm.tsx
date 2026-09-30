"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import type { PlatformSettings } from "@/constant/superAdmin";

type JobRuleKey = "reviewWindowHours" | "faultReportDays" | "maxRejections" | "maxExtensionPercent" | "maxManufacturersPerJob";

type JobRulesValues = Record<JobRuleKey, string>;

const RULES: { name: JobRuleKey; label: string; description: string; min: number; max: number }[] = [
    {
        name: "reviewWindowHours",
        label: "Auto-approve after (hours)",
        description: "Proof or finished work left unreviewed this long is approved. Sundays don't count.",
        min: 1,
        max: 168,
    },
    {
        name: "faultReportDays",
        label: "Fault report window (days)",
        description: "How long after sign-off a lead can report a fault, cancelling the bonus.",
        min: 1,
        max: 60,
    },
    {
        name: "maxRejections",
        label: "Rejections before a job closes",
        description: "Finished work sent back this many times closes the job.",
        min: 1,
        max: 10,
    },
    {
        name: "maxExtensionPercent",
        label: "Most extra time (%)",
        description: "How far a due date can be pushed back, as a share of the job's length.",
        min: 0,
        max: 100,
    },
    {
        name: "maxManufacturersPerJob",
        label: "Manufacturers per job",
        description: "How many manufacturers can share one job.",
        min: 1,
        max: 5,
    },
];

const FIELDS: FormFieldConfig[] = RULES.map(({ name, label, description, min, max }) => ({
    name,
    type: "number",
    label,
    description,
    min,
    max,
    validation: {
        required: "Enter a number",
        validate: (value: string) =>
            (Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max) ||
            `Enter a whole number from ${min} to ${max}`,
    },
}));

/** The limits every job works within: review windows, rejections, extra time and how many can share one. */
export default function JobRulesForm({
    settings,
    onSave,
}: {
    settings: PlatformSettings;
    onSave: (changes: Pick<PlatformSettings, JobRuleKey>) => Promise<void> | void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<JobRulesValues>({
        mode: "onTouched",
        defaultValues: Object.fromEntries(RULES.map(({ name }) => [name, String(settings[name])])) as JobRulesValues,
    });
    const { isDirty } = methods.formState;

    const handleSubmit = async (values: JobRulesValues) => {
        setIsLoading(true);
        try {
            await onSave(Object.fromEntries(RULES.map(({ name }) => [name, Number(values[name])])) as Pick<PlatformSettings, JobRuleKey>);
            methods.reset(values);
            toast.success("Job rules saved");
        } catch {
            toast.error("Couldn't save the job rules. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<JobRulesValues>
            methods={methods}
            fields={FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end">
                    <FormSubmitButton
                        label="Save job rules"
                        loadingLabel="Saving..."
                        isLoading={isLoading}
                        disabled={!canSubmit || !isDirty}
                        className="w-auto px-6"
                    />
                </div>
            )}
        />
    );
}
