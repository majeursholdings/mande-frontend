"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { getErrorMessage } from "@/lib/api";
import {
    DEFAULT_POINT_SETTINGS,
    type PointSettingsConfig,
} from "@/constant/points";

interface PointAllocationFormProps {
    initialSettings?: PointSettingsConfig;
    onSave: (changes: { pointSettings: PointSettingsConfig }) => Promise<void>;
}

type PointFormValues = {
    // Manufacturer point fields
    mfr_applicationAccepted: string;
    mfr_offerAccepted: string;
    mfr_stepApproved: string;
    mfr_stepSentBack: string;
    mfr_jobDeliveredSignedOff: string;
    mfr_deliveryRejected: string;
    mfr_finalRejectionClosed: string;
    mfr_rating5Star: string;
    mfr_rating4Star: string;
    mfr_rating3Star: string;
    mfr_rating2Star: string;
    mfr_rating1Star: string;
    mfr_accountFlagged: string;
    mfr_accountSuspended: string;
    mfr_bonusReleased: string;
    mfr_faultReported: string;

    // Admin point fields
    admin_jobStarted: string;
    admin_jobCompleted: string;
    admin_stepReviewedOntime: string;
    admin_stepReviewDelayedPerDay: string;
    admin_deliveryRejected: string;
    admin_rating5Star: string;
    admin_rating4Star: string;
    admin_rating3Star: string;
    admin_rating2Star: string;
    admin_rating1Star: string;
    admin_faultReported: string;
};

const FIELDS: FormFieldConfig[] = [
    // Manufacturer fields
    {
        name: "mfr_applicationAccepted",
        type: "number",
        label: "Mfr: Application accepted",
        description: "Points awarded when an application is accepted",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "admin_jobStarted",
        type: "number",
        label: "Lead: Job started",
        description: "Points awarded to admin when job is created & started",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_offerAccepted",
        type: "number",
        label: "Mfr: Job offer accepted",
        description: "Points awarded when manufacturer accepts a job offer",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "admin_jobCompleted",
        type: "number",
        label: "Lead: Job completed",
        description: "Points awarded when job reaches successful completion",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_stepApproved",
        type: "number",
        label: "Mfr: Step proof approved",
        description: "Points earned for each accepted production step",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "admin_stepReviewedOntime",
        type: "number",
        label: "Lead: Step reviewed on time (<24h)",
        description: "Points earned when reviewing step proof within 24 hours",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_stepSentBack",
        type: "number",
        label: "Mfr: Step sent back",
        description: "Penalty deducted when proof is rejected or sent back",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "admin_stepReviewDelayedPerDay",
        type: "number",
        label: "Lead: Step delay penalty (per day added)",
        description: "Points lost by admin per compensatory day added to job",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_jobDeliveredSignedOff",
        type: "number",
        label: "Mfr: Job delivered & signed off",
        description: "Points earned upon successful delivery sign-off",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "admin_deliveryRejected",
        type: "number",
        label: "Lead: Delivery rejection penalty",
        description: "Points deducted from project lead if job rejected on delivery",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_deliveryRejected",
        type: "number",
        label: "Mfr: Delivery rejected penalty",
        description: "Points deducted from manufacturer on delivery rejection",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "admin_rating5Star",
        type: "number",
        label: "Lead: 5-Star rating received",
        description: "Points earned when manufacturer gives 5 stars to lead",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_rating5Star",
        type: "number",
        label: "Mfr: 5-Star review received",
        description: "Points earned when rated 5 stars by project lead",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "admin_rating4Star",
        type: "number",
        label: "Lead: 4-Star rating received",
        description: "Points earned when manufacturer gives 4 stars to lead",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_rating4Star",
        type: "number",
        label: "Mfr: 4-Star review received",
        description: "Points earned when rated 4 stars by project lead",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "admin_rating3Star",
        type: "number",
        label: "Lead: 3-Star rating received",
        description: "Points earned when manufacturer gives 3 stars to lead",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_rating3Star",
        type: "number",
        label: "Mfr: 3-Star review received",
        description: "Points earned when rated 3 stars by project lead",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "admin_rating2Star",
        type: "number",
        label: "Lead: 2-Star rating penalty",
        description: "Points deducted when manufacturer gives 2 stars to lead",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_rating2Star",
        type: "number",
        label: "Mfr: 2-Star review penalty",
        description: "Points deducted when rated 2 stars by project lead",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "admin_rating1Star",
        type: "number",
        label: "Lead: 1-Star rating penalty",
        description: "Points deducted when manufacturer gives 1 star to lead",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_rating1Star",
        type: "number",
        label: "Mfr: 1-Star review penalty",
        description: "Points deducted when rated 1 star by project lead",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "admin_faultReported",
        type: "number",
        label: "Lead: Fault reported penalty",
        description: "Points deducted when post-delivery fault is reported",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_finalRejectionClosed",
        type: "number",
        label: "Mfr: Final rejection job closure",
        description: "Penalty when job is terminated after max rejections",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_bonusReleased",
        type: "number",
        label: "Mfr: On-time bonus released",
        description: "Points earned when on-time bonus is successfully released",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_accountFlagged",
        type: "number",
        label: "Mfr: Account flagged penalty",
        description: "Points deducted when an account is flagged for review",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_accountSuspended",
        type: "number",
        label: "Mfr: Account suspended penalty",
        description: "Points deducted when an account is suspended",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
    {
        name: "mfr_faultReported",
        type: "number",
        label: "Mfr: Fault reported penalty",
        description: "Points deducted when client reports a warranty defect",
        min: -500,
        max: 500,
        validation: { required: "Enter points" },
    },
];

const ROW_PAIRS: [string, string][] = [
    ["mfr_applicationAccepted", "admin_jobStarted"],
    ["mfr_offerAccepted", "admin_jobCompleted"],
    ["mfr_stepApproved", "admin_stepReviewedOntime"],
    ["mfr_stepSentBack", "admin_stepReviewDelayedPerDay"],
    ["mfr_jobDeliveredSignedOff", "admin_deliveryRejected"],
    ["mfr_deliveryRejected", "admin_rating5Star"],
    ["mfr_rating5Star", "admin_rating4Star"],
    ["mfr_rating4Star", "admin_rating3Star"],
    ["mfr_rating3Star", "admin_rating2Star"],
    ["mfr_rating2Star", "admin_rating1Star"],
    ["mfr_rating1Star", "admin_faultReported"],
    ["mfr_finalRejectionClosed", "mfr_bonusReleased"],
    ["mfr_accountFlagged", "mfr_accountSuspended"],
];

function toFormValues(settings: PointSettingsConfig): PointFormValues {
    return {
        mfr_applicationAccepted: String(settings.manufacturer.applicationAccepted),
        mfr_offerAccepted: String(settings.manufacturer.offerAccepted),
        mfr_stepApproved: String(settings.manufacturer.stepApproved),
        mfr_stepSentBack: String(settings.manufacturer.stepSentBack),
        mfr_jobDeliveredSignedOff: String(settings.manufacturer.jobDeliveredSignedOff),
        mfr_deliveryRejected: String(settings.manufacturer.deliveryRejected),
        mfr_finalRejectionClosed: String(settings.manufacturer.finalRejectionClosed),
        mfr_rating5Star: String(settings.manufacturer.rating5Star),
        mfr_rating4Star: String(settings.manufacturer.rating4Star),
        mfr_rating3Star: String(settings.manufacturer.rating3Star),
        mfr_rating2Star: String(settings.manufacturer.rating2Star),
        mfr_rating1Star: String(settings.manufacturer.rating1Star),
        mfr_accountFlagged: String(settings.manufacturer.accountFlagged),
        mfr_accountSuspended: String(settings.manufacturer.accountSuspended),
        mfr_bonusReleased: String(settings.manufacturer.bonusReleased),
        mfr_faultReported: String(settings.manufacturer.faultReported),

        admin_jobStarted: String(settings.admin.jobStarted),
        admin_jobCompleted: String(settings.admin.jobCompleted),
        admin_stepReviewedOntime: String(settings.admin.stepReviewedOntime),
        admin_stepReviewDelayedPerDay: String(settings.admin.stepReviewDelayedPerDay),
        admin_deliveryRejected: String(settings.admin.deliveryRejected),
        admin_rating5Star: String(settings.admin.rating5Star),
        admin_rating4Star: String(settings.admin.rating4Star),
        admin_rating3Star: String(settings.admin.rating3Star),
        admin_rating2Star: String(settings.admin.rating2Star),
        admin_rating1Star: String(settings.admin.rating1Star),
        admin_faultReported: String(settings.admin.faultReported),
    };
}

function fromFormValues(values: PointFormValues): PointSettingsConfig {
    return {
        manufacturer: {
            applicationAccepted: Number(values.mfr_applicationAccepted),
            offerAccepted: Number(values.mfr_offerAccepted),
            stepApproved: Number(values.mfr_stepApproved),
            stepSentBack: Number(values.mfr_stepSentBack),
            jobDeliveredSignedOff: Number(values.mfr_jobDeliveredSignedOff),
            deliveryRejected: Number(values.mfr_deliveryRejected),
            finalRejectionClosed: Number(values.mfr_finalRejectionClosed),
            rating5Star: Number(values.mfr_rating5Star),
            rating4Star: Number(values.mfr_rating4Star),
            rating3Star: Number(values.mfr_rating3Star),
            rating2Star: Number(values.mfr_rating2Star),
            rating1Star: Number(values.mfr_rating1Star),
            accountFlagged: Number(values.mfr_accountFlagged),
            accountSuspended: Number(values.mfr_accountSuspended),
            bonusReleased: Number(values.mfr_bonusReleased),
            faultReported: Number(values.mfr_faultReported),
        },
        admin: {
            jobStarted: Number(values.admin_jobStarted),
            jobCompleted: Number(values.admin_jobCompleted),
            stepReviewedOntime: Number(values.admin_stepReviewedOntime),
            stepReviewDelayedPerDay: Number(values.admin_stepReviewDelayedPerDay),
            deliveryRejected: Number(values.admin_deliveryRejected),
            rating5Star: Number(values.admin_rating5Star),
            rating4Star: Number(values.admin_rating4Star),
            rating3Star: Number(values.admin_rating3Star),
            rating2Star: Number(values.admin_rating2Star),
            rating1Star: Number(values.admin_rating1Star),
            faultReported: Number(values.admin_faultReported),
        },
    };
}

export default function PointAllocationForm({
    initialSettings,
    onSave,
}: PointAllocationFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const settings = initialSettings ?? DEFAULT_POINT_SETTINGS;

    const methods = useForm<PointFormValues>({
        mode: "onTouched",
        defaultValues: toFormValues(settings),
    });
    const { isDirty } = methods.formState;

    const handleSubmit = async (values: PointFormValues) => {
        setIsLoading(true);
        try {
            const parsed = fromFormValues(values);
            await onSave({ pointSettings: parsed });
            methods.reset(values);
            toast.success("Point allocation numbers updated successfully");
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to update point settings."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<PointFormValues>
            methods={methods}
            fields={FIELDS}
            rowPairs={ROW_PAIRS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end pt-4">
                    <FormSubmitButton
                        label="Save Point Allocations"
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
