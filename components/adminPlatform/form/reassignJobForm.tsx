"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { ADMIN_MANUFACTURERS, MAX_JOB_MANUFACTURERS } from "@/constant/admin";
import { FormSubmitButton } from "./formButtons";

type ReassignJobValues = {
    manufacturerIds: string[];
};

const FIELDS: FormFieldConfig[] = [
    {
        name: "manufacturerIds",
        type: "multiselect",
        label: (
            <>
                Manufacturer <span className="font-normal text-mist-400">(max. of {MAX_JOB_MANUFACTURERS})</span>
            </>
        ),
        placeholder: "Select manufacturer",
        options: ADMIN_MANUFACTURERS.map((manufacturer) => ({ label: manufacturer.companyName, value: manufacturer.id })),
        maxSelections: MAX_JOB_MANUFACTURERS,
        validation: {
            validate: (value: string[]) => value.length > 0 || "Select at least one manufacturer",
        },
    },
];

/** Offers a pending job to other manufacturer(s) — or to its first, if it has none yet. */
export default function ReassignJobForm({
    currentManufacturerIds,
    onReassign,
    onCancel,
}: {
    currentManufacturerIds: string[];
    onReassign: (manufacturerIds: string[]) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const isFirstAssignment = currentManufacturerIds.length === 0;
    const methods = useForm<ReassignJobValues>({ defaultValues: { manufacturerIds: currentManufacturerIds } });

    const handleSubmit = async ({ manufacturerIds }: ReassignJobValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate sending the offer
            await new Promise((resolve) => setTimeout(resolve, 600));
            onReassign(manufacturerIds);
        } catch {
            toast.error(`Couldn't ${isFirstAssignment ? "assign" : "reassign"} the job. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ReassignJobValues>
            methods={methods}
            fields={FIELDS}
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
                        label={isFirstAssignment ? "Assign job" : "Reassign job"}
                        loadingLabel={isFirstAssignment ? "Assigning..." : "Reassigning..."}
                        isLoading={isLoading}
                        disabled={!canSubmit}
                        className="w-auto px-5"
                    />
                </div>
            )}
        />
    );
}
