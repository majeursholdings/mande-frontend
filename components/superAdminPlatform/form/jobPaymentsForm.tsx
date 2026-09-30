"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { JOB_PAYMENT_SCHEDULE, type JobPaymentMilestone } from "@/constant/jobWorkflow";
import type { PlatformSettings } from "@/constant/superAdmin";
import ReauthSteps from "../reauthSteps";

type JobPaymentsValues = Record<JobPaymentMilestone | "bonusPercent" | "rejectionChargePercent", string>;

const wholePercent = (max: number) => (value: string) =>
    (value !== "" && Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= max) ||
    `Enter a whole number from 0 to ${max}`;

const FIELDS: FormFieldConfig[] = [
    ...JOB_PAYMENT_SCHEDULE.map(
        ({ milestone, label }): FormFieldConfig => ({
            name: milestone,
            type: "number",
            label: `${label} (%)`,
            min: 0,
            max: 100,
            validation: { required: "Enter a percent", validate: wholePercent(100) },
        }),
    ),
    {
        name: "bonusPercent",
        type: "number",
        label: "On-time bonus (%)",
        description: "On top of the amount, for work delivered on time with nothing sent back.",
        min: 0,
        max: 50,
        validation: { required: "Enter a percent", validate: wholePercent(50) },
    },
    {
        name: "rejectionChargePercent",
        type: "number",
        label: "Rejection charge (%)",
        description: "Taken from the manufacturer's wallet each time their finished work is rejected.",
        min: 0,
        max: 50,
        validation: { required: "Enter a percent", validate: wholePercent(50) },
    },
];

type JobPaymentsChanges = Pick<PlatformSettings, "paymentSchedule" | "bonusPercent" | "rejectionChargePercent">;

/**
 * How a job's amount is paid out as the work moves (a percent at each
 * milestone, adding up to 100), the bonus for on-time work, and the charge
 * for rejected work. It changes where money goes, so saving it asks you to
 * confirm it's you first (the API asks for the same).
 */
export default function JobPaymentsForm({
    settings,
    onSave,
}: {
    settings: PlatformSettings;
    onSave: (changes: JobPaymentsChanges, reauthToken: string) => Promise<void> | void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    /** Checked and waiting for the confirmation, with the values to reset the form to once saved. */
    const [pending, setPending] = useState<{ changes: JobPaymentsChanges; submitted: JobPaymentsValues } | null>(null);
    const methods = useForm<JobPaymentsValues>({
        mode: "onTouched",
        defaultValues: {
            ...(Object.fromEntries(
                JOB_PAYMENT_SCHEDULE.map(({ milestone }) => [milestone, String(settings.paymentSchedule[milestone])]),
            ) as Record<JobPaymentMilestone, string>),
            bonusPercent: String(settings.bonusPercent),
            rejectionChargePercent: String(settings.rejectionChargePercent),
        },
    });
    const values = useWatch({ control: methods.control });
    const total = JOB_PAYMENT_SCHEDULE.reduce((sum, { milestone }) => sum + (Number(values[milestone]) || 0), 0);
    const { isDirty } = methods.formState;

    const handleSubmit = async (submitted: JobPaymentsValues) => {
        setIsLoading(true);
        try {
            setPending({
                submitted,
                changes: {
                    paymentSchedule: Object.fromEntries(
                        JOB_PAYMENT_SCHEDULE.map(({ milestone }) => [milestone, Number(submitted[milestone])]),
                    ) as Record<JobPaymentMilestone, number>,
                    bonusPercent: Number(submitted.bonusPercent),
                    rejectionChargePercent: Number(submitted.rejectionChargePercent),
                },
            });
        } catch {
            toast.error("Couldn't check the job payments. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const save = async (reauthToken: string) => {
        if (!pending) return;
        try {
            await onSave(pending.changes, reauthToken);
            methods.reset(pending.submitted);
            toast.success("Job payments saved. New jobs follow them");
        } catch {
            toast.error("Couldn't save the job payments. Please try again.");
        }
        setPending(null);
    };

    return (
        <>
            <MainForm<JobPaymentsValues>
                methods={methods}
                fields={FIELDS}
                rowPairs={[
                    ["accepted", "frame"],
                    ["assembly", "finishing"],
                    ["delivery", "signed-off"],
                    ["bonusPercent", "rejectionChargePercent"],
                ]}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                hideRequiredMarks
                renderFooter={({ isLoading, canSubmit }) => (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p
                            className={cn("text-sm font-medium font-text", total === 100 ? "text-primary-700" : "text-error-600")}
                            aria-live="polite"
                        >
                            Total {total}%{total === 100 ? "" : ", it has to come to 100%"}
                        </p>
                        <FormSubmitButton
                            label="Save job payments"
                            loadingLabel="Saving..."
                            isLoading={isLoading}
                            disabled={!canSubmit || !isDirty || total !== 100}
                            className="w-auto px-6"
                        />
                    </div>
                )}
            />
            <Dialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Save the job payments?</DialogTitle>
                        <DialogDescription>
                            Jobs created from now on pay this way. Jobs already under way keep paying the way they started.
                        </DialogDescription>
                    </div>
                    <ReauthSteps confirmLabel="Save job payments" onCancel={() => setPending(null)} onConfirmed={save} />
                </DialogContent>
            </Dialog>
        </>
    );
}
