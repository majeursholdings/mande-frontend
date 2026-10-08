"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import ResponsiveTabs from "@/components/ui/responsiveTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    DEFAULT_POINT_SETTINGS,
    type AdminPointSettings,
    type ManufacturerPointSettings,
    type PointSettingsConfig,
} from "@/constant/points";

// ─────────────────────────────────────────────────────────────────────────────
// PointAllocationForm — how many points each activity is worth, with
// manufacturers and project leads on their own tabs, each split into groups
// (jobs, delivery, ratings...). One form and one save for both: both tabs
// stay mounted, and a tab's label says when it has a field to fix.
// ─────────────────────────────────────────────────────────────────────────────

type Role = keyof PointSettingsConfig;
type RoleKey<R extends Role> = keyof PointSettingsConfig[R] & string;

/** Field names carry their role, e.g. "manufacturer.stepApproved" is "manufacturer__stepApproved". */
const fieldName = (role: Role, key: string) => `${role}__${key}`;

type PointField<R extends Role> = { key: RoleKey<R>; label: string; description?: string };

type PointGroup<R extends Role> = {
    title: string;
    description: string;
    fields: PointField<R>[];
    /** Short fields side by side (the ratings), rather than two to a row. */
    compact?: boolean;
};

const RATING_FIELDS = <R extends Role>(): PointField<R>[] =>
    ([5, 4, 3, 2, 1] as const).map((stars) => ({
        key: `rating${stars}Star` as RoleKey<R>,
        label: stars === 1 ? "1 star" : `${stars} stars`,
    }));

const MANUFACTURER_GROUPS: PointGroup<"manufacturer">[] = [
    {
        title: "Jobs and production",
        description: "Getting work and moving it through the production steps.",
        fields: [
            { key: "applicationAccepted", label: "Application accepted", description: "When a lead accepts their application for a job" },
            { key: "offerAccepted", label: "Job offer accepted", description: "When they accept a job offered to them" },
            { key: "stepApproved", label: "Step proof approved", description: "For each production step approved" },
            { key: "stepSentBack", label: "Step proof sent back", description: "When a step's proof is sent back to redo" },
        ],
    },
    {
        title: "Delivery and bonus",
        description: "How the finished work lands with the client.",
        fields: [
            { key: "jobDeliveredSignedOff", label: "Delivered and signed off", description: "When the lead signs the delivery off" },
            { key: "bonusReleased", label: "On-time bonus released", description: "When the on-time bonus is paid" },
            { key: "deliveryRejected", label: "Delivery rejected", description: "Each time the client rejects the delivery" },
            { key: "finalRejectionClosed", label: "Closed after the last rejection", description: "When the job ends after its final rejection" },
            { key: "faultReported", label: "Fault reported", description: "When the client reports a fault after delivery" },
        ],
    },
    {
        title: "Ratings from project leads",
        description: "The lead's rating at sign-off.",
        fields: RATING_FIELDS<"manufacturer">(),
        compact: true,
    },
    {
        title: "Account standing",
        description: "When the team acts on their account.",
        fields: [
            { key: "accountFlagged", label: "Account flagged", description: "When the account is flagged for review" },
            { key: "accountSuspended", label: "Account suspended", description: "When the account is suspended" },
        ],
    },
];

const ADMIN_GROUPS: PointGroup<"admin">[] = [
    {
        title: "Jobs",
        description: "Running jobs from start to finish.",
        fields: [
            { key: "jobStarted", label: "Job started", description: "When a job they lead is created and started" },
            { key: "jobCompleted", label: "Job completed", description: "When a job they lead is completed" },
        ],
    },
    {
        title: "Reviewing step proof",
        description: "How quickly they review the manufacturer's proof.",
        fields: [
            { key: "stepReviewedOntime", label: "Reviewed on time", description: "Reviewing a step's proof within the review window" },
            { key: "stepReviewDelayedPerDay", label: "Late review, per day", description: "For each day added to the job because a review was late" },
        ],
    },
    {
        title: "Delivery",
        description: "How the finished work lands with the client.",
        fields: [
            { key: "deliveryRejected", label: "Delivery rejected", description: "When the client rejects a job they signed off" },
            { key: "faultReported", label: "Fault reported", description: "When the client reports a fault after delivery" },
        ],
    },
    {
        title: "Ratings from manufacturers",
        description: "The manufacturer's rating of the lead.",
        fields: RATING_FIELDS<"admin">(),
        compact: true,
    },
];

const toConfig = (role: Role, field: PointField<Role>): FormFieldConfig => ({
    name: fieldName(role, field.key),
    type: "number",
    label: field.label,
    description: field.description,
    min: -500,
    max: 500,
    step: 1,
    validation: {
        required: "Enter points",
        validate: (value: string) => Number.isInteger(Number(value)) || "Use a whole number",
        min: { value: -500, message: "At least -500" },
        max: { value: 500, message: "At most 500" },
    },
});

type PointFormValues = Record<string, string>;

function toFormValues(settings: PointSettingsConfig): PointFormValues {
    const values: PointFormValues = {};
    for (const role of ["manufacturer", "admin"] as const) {
        for (const [key, points] of Object.entries(settings[role])) values[fieldName(role, key)] = String(points);
    }
    return values;
}

function fromFormValues(values: PointFormValues, settings: PointSettingsConfig): PointSettingsConfig {
    const read = <R extends Role>(role: R): PointSettingsConfig[R] => {
        const next = { ...settings[role] } as Record<string, number>;
        for (const key of Object.keys(next)) next[key] = Number(values[fieldName(role, key)]);
        return next as unknown as PointSettingsConfig[R];
    };
    return { manufacturer: read("manufacturer") as ManufacturerPointSettings, admin: read("admin") as AdminPointSettings };
}

interface PointAllocationFormProps {
    initialSettings?: PointSettingsConfig;
    onSave: (changes: { pointSettings: PointSettingsConfig }) => Promise<void>;
}

export default function PointAllocationForm({ initialSettings, onSave }: PointAllocationFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const settings = initialSettings ?? DEFAULT_POINT_SETTINGS;

    const methods = useForm<PointFormValues>({
        mode: "onTouched",
        defaultValues: toFormValues(settings),
    });
    const { register, control, getValues, setValue, handleSubmit, formState } = methods;
    const { errors, isDirty } = formState;

    const errorCount = (role: Role) => Object.keys(errors).filter((name) => name.startsWith(`${role}__`)).length;
    const tabLabel = (label: string, role: Role) => {
        const count = errorCount(role);
        return count > 0 ? `${label} (${count} to fix)` : label;
    };

    const onSubmit = async (values: PointFormValues) => {
        setIsLoading(true);
        try {
            await onSave({ pointSettings: fromFormValues(values, settings) });
            methods.reset(values);
            toast.success("Point allocations saved");
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't save the point allocations. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    const renderGroups = <R extends Role>(role: R, groups: PointGroup<R>[], intro: string) => (
        <div className="flex flex-col gap-4">
            <p className="text-sm font-text text-mist-600">{intro}</p>
            {groups.map((group) => {
                const headingId = `points-${role}-${group.title.toLowerCase().replace(/\W+/g, "-")}`;
                return (
                    <section
                        key={group.title}
                        aria-labelledby={headingId}
                        className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 sm:p-5"
                    >
                        <div className="flex flex-col gap-0.5">
                            <h4 id={headingId} className="text-sm font-semibold font-text text-mist-950">
                                {group.title}
                            </h4>
                            <p className="text-xs font-text text-mist-500">{group.description}</p>
                        </div>
                        <div
                            className={cn(
                                "grid gap-4",
                                group.compact ? "grid-cols-2 sm:grid-cols-5 sm:gap-3" : "grid-cols-1 sm:grid-cols-2",
                            )}
                        >
                            {group.fields.map((field) => (
                                <FormField<PointFormValues>
                                    key={field.key}
                                    field={toConfig(role, field as PointField<Role>)}
                                    register={register}
                                    control={control}
                                    getValues={getValues}
                                    setValue={setValue}
                                    errors={errors}
                                    hideRequiredMark
                                />
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                <ResponsiveTabs
                    label="Whose points"
                    variant="segmented"
                    defaultValue="manufacturer"
                    tabs={[
                        {
                            value: "manufacturer",
                            label: tabLabel("Manufacturers", "manufacturer"),
                            panel: renderGroups(
                                "manufacturer",
                                MANUFACTURER_GROUPS,
                                "What manufacturers earn for each activity. Use a minus number to take points away.",
                            ),
                        },
                        {
                            value: "admin",
                            label: tabLabel("Project leads", "admin"),
                            panel: renderGroups(
                                "admin",
                                ADMIN_GROUPS,
                                "What project leads earn for each activity. Use a minus number to take points away.",
                            ),
                        },
                    ]}
                />
                <div className="flex justify-end">
                    <FormSubmitButton
                        label="Save point allocations"
                        loadingLabel="Saving..."
                        isLoading={isLoading}
                        disabled={!isDirty}
                        className="w-auto px-6"
                    />
                </div>
            </form>
        </FormProvider>
    );
}

/** Stands in for the form while the settings load: the tabs, then two groups of fields. */
export function PointAllocationFormSkeleton() {
    return (
        <div className="flex flex-col gap-5" aria-busy="true">
            <Skeleton className="h-10 w-64 rounded-lg" />
            {[4, 5].map((count, group) => (
                <div key={group} className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:p-5">
                    <Skeleton className="h-4 w-40" />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {Array.from({ length: count }, (_, index) => (
                            <Skeleton key={index} className="h-10 rounded-lg" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
