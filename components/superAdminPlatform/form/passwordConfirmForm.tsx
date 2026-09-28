"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";

type PasswordConfirmValues = { password: string };

const FIELDS: FormFieldConfig[] = [
    {
        name: "password",
        type: "password",
        label: "Your password",
        placeholder: "Enter your password",
        autoComplete: "current-password",
        validation: { required: "Enter your password" },
    },
];

/** The first step of confirming it's them: the password they log in with. */
export default function PasswordConfirmForm({
    onConfirmed,
    onCancel,
}: {
    onConfirmed: () => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<PasswordConfirmValues>({ mode: "onTouched", defaultValues: { password: "" } });

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate checking the password (any
            // password passes) so the flow is testable end-to-end.
            await new Promise((resolve) => setTimeout(resolve, 700));
            onConfirmed();
        } catch {
            toast.error("Couldn't check your password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<PasswordConfirmValues>
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
                        label="Continue"
                        loadingLabel="Checking..."
                        isLoading={isLoading}
                        disabled={!canSubmit}
                        className="w-auto px-6"
                    />
                </div>
            )}
        />
    );
}
