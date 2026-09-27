"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useController, useForm, type Control } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ADMIN_DASHBOARD_URL } from "@/constant/admin";
import { ADMIN_FORGOT_PASSWORD_URL } from "@/constant/navigation";
import { FormSubmitButton } from "./formButtons";
import { AUTH_FORM_FIELD_GAP } from "./styles";

type AdminLoginFormValues = {
    email: string;
    password: string;
    rememberMe: boolean;
};

const ADMIN_LOGIN_DEFAULT_VALUES: AdminLoginFormValues = {
    email: "",
    password: "",
    rememberMe: false,
};

const FIELDS: FormFieldConfig[] = [
    {
        name: "email",
        type: "email",
        label: "Email",
        placeholder: "Enter email",
        autoComplete: "email",
        validation: validators.email(),
    },
    {
        name: "password",
        type: "password",
        label: "Password",
        placeholder: "Enter password",
        autoComplete: "current-password",
        validation: { required: "Password is required" },
    },
];

export default function AdminLoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<AdminLoginFormValues>({
        mode: "onTouched",
        defaultValues: ADMIN_LOGIN_DEFAULT_VALUES,
    });

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate the request so the flow
            // is testable end-to-end.
            await new Promise((resolve) => setTimeout(resolve, 800));
            toast.success("Logged in successfully");
            router.push(ADMIN_DASHBOARD_URL);
        } catch {
            toast.error("Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<AdminLoginFormValues>
            methods={methods}
            fields={FIELDS}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            fieldGapClassName={AUTH_FORM_FIELD_GAP}
            hideRequiredMarks
            footerSlot={<RememberMeRow control={methods.control} />}
            renderFooter={({ isLoading, canSubmit }) => (
                <FormSubmitButton
                    label="Login"
                    loadingLabel="Logging in..."
                    isLoading={isLoading}
                    disabled={!canSubmit}
                    className="mt-5"
                />
            )}
        />
    );
}

/**
 * "Remember me" beside the "Forgot Password?" link — a checkbox from md up
 * and a switch on phones, as in the design. Both edit the same value.
 */
function RememberMeRow({ control }: { control: Control<AdminLoginFormValues> }) {
    const { field } = useController({ control, name: "rememberMe" });
    const labelClass =
        "items-center gap-2 text-sm font-text text-mist-600 cursor-pointer select-none";

    return (
        <div className="flex items-center justify-between gap-3">
            <label className={`hidden md:flex ${labelClass}`}>
                <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-mist-300 data-checked:border-secondary-700 data-checked:bg-white data-checked:text-secondary-700"
                />
                Remember me
            </label>
            <label className={`flex md:hidden ${labelClass}`}>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                Remember me
            </label>
            <Link
                href={ADMIN_FORGOT_PASSWORD_URL}
                className="text-sm font-medium font-text text-secondary-700 hover:underline"
            >
                Forgot Password?
            </Link>
        </div>
    );
}
