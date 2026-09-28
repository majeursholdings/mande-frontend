"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { SUPER_ADMIN_ROLE_OPTIONS, type SuperAdminRole } from "@/constant/superAdmin";

type ChangeSuperAdminRoleValues = { role: SuperAdminRole };

/**
 * A super admin's new role. `isLastOwner` when they're the only owner: the
 * platform always keeps one, so they can't stop being an owner until someone
 * else is one. Submitting moves on to confirming it's them (see ReauthSteps).
 */
export default function ChangeSuperAdminRoleForm({
    name,
    currentRole,
    isLastOwner,
    onSubmit,
    onCancel,
}: {
    name: string;
    currentRole: SuperAdminRole;
    isLastOwner: boolean;
    onSubmit: (role: SuperAdminRole) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<ChangeSuperAdminRoleValues>({ mode: "onChange", defaultValues: { role: currentRole } });
    const role = useWatch({ control: methods.control, name: "role" });

    const fields: FormFieldConfig[] = [
        {
            name: "role",
            type: "select",
            label: "Role",
            options: SUPER_ADMIN_ROLE_OPTIONS.map(({ value, label }) => ({ value, label })),
            description: SUPER_ADMIN_ROLE_OPTIONS.find((option) => option.value === role)?.description,
            validation: {
                required: "Choose their role",
                validate: (value: SuperAdminRole) =>
                    !isLastOwner ||
                    value === "owner" ||
                    `${name} is the only owner. Make someone else an owner first.`,
            },
        },
    ];

    const handleSubmit = async (values: ChangeSuperAdminRoleValues) => {
        setIsLoading(true);
        try {
            onSubmit(values.role);
        } catch {
            toast.error("Couldn't change their role. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ChangeSuperAdminRoleValues>
            methods={methods}
            fields={fields}
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
                        label="Continue"
                        isLoading={isLoading}
                        disabled={!canSubmit || role === currentRole}
                        className="w-auto px-6"
                    />
                </div>
            )}
        />
    );
}
