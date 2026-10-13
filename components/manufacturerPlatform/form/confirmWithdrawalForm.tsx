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
 * Step two of a withdrawal: the manufacturer's password. It isn't checked
 * here; it's sent with the one-time code (step three), and the server checks
 * both before any money moves.
 */
export default function ConfirmWithdrawalForm({
    onCancel,
    onPasswordEntered,
}: {
    onCancel: () => void;
    /** Hands the password on to the code step, where it's checked with the code. */
    onPasswordEntered: (password: string) => void;
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async ({ password }: ConfirmWithdrawalFormValues) => {
        setIsLoading(true);
        try {
            onPasswordEntered(password);
        } catch {
            toast.error("Something went wrong. Please try again.");
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
                        label="Continue"
                        loadingLabel="Continuing..."
                        isLoading={isLoading}
                        disabled={!canSubmit}
                    />
                </div>
            )}
        />
    );
}
