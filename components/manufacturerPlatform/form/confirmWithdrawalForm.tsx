"use client";

import { useState } from "react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormCancelButton, FormSubmitButton } from "./formButtons";

type ConfirmWithdrawalFormValues = {
    password: string;
};

const FIELDS: FormFieldConfig[] = [
    {
        name: "password",
        type: "password",
        label: "Password",
        placeholder: "Enter password",
        autoComplete: "current-password",
        validation: { required: "Password is required" },
    },
];

/**
 * Step two of a withdrawal — the manufacturer's password. Once it checks out,
 * a one-time code is still needed (step three) before any money moves.
 */
export default function ConfirmWithdrawalForm({
    onCancel,
    onPasswordConfirmed,
}: {
    onCancel: () => void;
    onPasswordConfirmed: (password: string) => void;
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async ({ password }: ConfirmWithdrawalFormValues) => {
        setIsLoading(true);
        try {
            onPasswordConfirmed(password);
        } catch {
            toast.error("Couldn't confirm your password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ConfirmWithdrawalFormValues>
            fields={FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end gap-3 pt-1">
                    <FormCancelButton onClick={onCancel} disabled={isLoading} />
                    <FormSubmitButton
                        label="Confirm"
                        loadingLabel="Confirming..."
                        isLoading={isLoading}
                        disabled={!canSubmit}
                    />
                </div>
            )}
        />
    );
}
