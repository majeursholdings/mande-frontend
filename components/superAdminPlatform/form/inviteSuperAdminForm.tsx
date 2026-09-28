"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { ADMIN_EMAIL_DOMAIN } from "@/constant/admin";
import { SUPER_ADMIN_ROLE_OPTIONS, type SuperAdminRole } from "@/constant/superAdmin";

export type InviteSuperAdminValues = { firstName: string; lastName: string; email: string; role: SuperAdminRole };

/** Before a role is picked, the select is empty. */
type InviteSuperAdminFormValues = Omit<InviteSuperAdminValues, "role"> & { role: SuperAdminRole | "" };

const notBlank = (message: string) => (value: string) => value.trim().length > 0 || message;

/**
 * Who to invite as a super admin: their name, Mande email and role. `takenEmails`
 * are the super admins and open invites already, which can't be invited
 * again. Submitting moves on to confirming it's them (see ReauthSteps).
 */
export default function InviteSuperAdminForm({
    takenEmails,
    onSubmit,
    onCancel,
}: {
    takenEmails: string[];
    onSubmit: (values: InviteSuperAdminValues) => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<InviteSuperAdminFormValues>({
        mode: "onTouched",
        defaultValues: { firstName: "", lastName: "", email: "", role: "" },
    });
    const role = useWatch({ control: methods.control, name: "role" });
    const emailRules = validators.companyEmail(ADMIN_EMAIL_DOMAIN);

    const fields: FormFieldConfig[] = [
        {
            name: "firstName",
            type: "text",
            label: "First name",
            placeholder: "Enter first name",
            validation: { required: "First name is required", validate: notBlank("First name is required") },
        },
        {
            name: "lastName",
            type: "text",
            label: "Last name",
            placeholder: "Enter last name",
            validation: { required: "Last name is required", validate: notBlank("Last name is required") },
        },
        {
            name: "email",
            type: "email",
            label: "Email",
            placeholder: `name@${ADMIN_EMAIL_DOMAIN}`,
            description: "The invite goes here. They set their password when they accept it.",
            validation: {
                ...emailRules,
                validate: (value: string) => {
                    const domainCheck = typeof emailRules.validate === "function" ? emailRules.validate(value, {}) : true;
                    if (domainCheck !== true) return domainCheck;
                    return (
                        !takenEmails.includes(value.trim().toLowerCase()) ||
                        "They're already a super admin, or have an invite waiting"
                    );
                },
            },
        },
        {
            name: "role",
            type: "select",
            label: "Role",
            placeholder: "Choose their role",
            options: SUPER_ADMIN_ROLE_OPTIONS.map(({ value, label }) => ({ value, label })),
            description:
                SUPER_ADMIN_ROLE_OPTIONS.find((option) => option.value === role)?.description ??
                "What they can do. You can change it later.",
            validation: { required: "Choose their role" },
        },
    ];

    const handleSubmit = async (values: InviteSuperAdminFormValues) => {
        setIsLoading(true);
        try {
            if (!values.role) throw new Error("No role chosen");
            onSubmit({
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                email: values.email.trim().toLowerCase(),
                role: values.role,
            });
        } catch {
            toast.error("Couldn't prepare the invite. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<InviteSuperAdminFormValues>
            methods={methods}
            fields={fields}
            rowPairs={[["firstName", "lastName"]]}
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
                        disabled={!canSubmit}
                        className="w-auto px-6"
                    />
                </div>
            )}
        />
    );
}
