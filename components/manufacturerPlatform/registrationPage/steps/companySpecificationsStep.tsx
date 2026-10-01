"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import MainForm from "@/components/form";
import { FormFieldConfig } from "@/components/form/types";
import StepFooter from "../stepFooter";
import StepHeader from "../stepHeader";
import { getPricingPlan, RegistrationFormValues } from "../types";
import {
    COMPANY_SPECIALITY_OPTIONS,
    MATERIALS_INVENTORY_OPTIONS,
    MAX_COMPANY_SPECIALITIES,
    PRODUCTION_LEAD_TIME_OPTIONS,
    STAFF_RANGE_OPTIONS,
} from "@/constant/manufacturer";

export type CompanySpecificationsStepProps = {
    methods: UseFormReturn<RegistrationFormValues>;
    onSubmit: (values: RegistrationFormValues) => void;
    /** Left out where there's no step to go back to (the dashboard's SignUpGate). */
    onBack?: () => void;
    isLoading: boolean;
};

export default function CompanySpecificationsStep({
    methods,
    onSubmit,
    onBack,
    isLoading,
}: CompanySpecificationsStepProps) {
    const [planId, staffRange] = useWatch({
        control: methods.control,
        name: ["plan", "staffRange"],
    });
    const plan = getPricingPlan(planId);

    const fields: FormFieldConfig[] = [
        {
            name: "staffRange",
            type: "select",
            label: "How many staff members do you have?",
            placeholder: "e.g. 11 to 20",
            // Prefilled from the plan when it was chosen (see the plan step)
            description:
                plan && staffRange === plan.defaultStaffRange
                    ? `Filled in from your ${plan.name} plan — change it if it's different.`
                    : undefined,
            options: STAFF_RANGE_OPTIONS,
            validation: { required: "Please select a staff range" },
        },
        {
            name: "specialities",
            type: "multiselect",
            label: `What is your company's speciality? (Select up to ${MAX_COMPANY_SPECIALITIES})`,
            placeholder: "e.g. Beds, Desks",
            options: COMPANY_SPECIALITY_OPTIONS,
            maxSelections: MAX_COMPANY_SPECIALITIES,
            validation: {
                validate: (value: string[]) =>
                    (Array.isArray(value) && value.length > 0) ||
                    "Select at least one speciality",
            },
        },
        {
            name: "productionLeadTime",
            type: "select",
            label: "Average production lead time",
            placeholder: "e.g. 3 to 4 weeks",
            options: PRODUCTION_LEAD_TIME_OPTIONS,
            validation: { required: "Please select a production lead time" },
        },
        {
            name: "materialsInventory",
            type: "radio",
            label: "Do you have your own materials inventory available?",
            options: MATERIALS_INVENTORY_OPTIONS,
            validation: {
                validate: (value: string) =>
                    !!value || "Please select an option",
            },
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <StepHeader
                step={5}
                title="Company specifications"
                description="You're almost done."
            />

            <MainForm<RegistrationFormValues>
                methods={methods}
                fields={fields}
                onSubmit={onSubmit}
                isLoading={isLoading}
                renderFooter={({ isLoading, canSubmit }) => (
                    <StepFooter
                        isLoading={isLoading}
                        canSubmit={canSubmit}
                        submitLabel="Create account"
                        onBack={onBack}
                    />
                )}
            />
        </div>
    );
}
