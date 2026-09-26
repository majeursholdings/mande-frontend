"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import { FormFieldConfig } from "@/components/form/types";
import { validators } from "@/components/form/form.validators";
import AuthScreenLayout from "../authScreenLayout";
import { ARTISAN_SIGNUP_URL } from "@/constant/navigation";

type ForgotPasswordFormValues = {
    email: string;
};

export default function ManufacForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<ForgotPasswordFormValues>({
        mode: "onTouched",
        defaultValues: { email: "" },
    });

    const fields: FormFieldConfig[] = [
        {
            name: "email",
            type: "email",
            label: "Email",
            placeholder: "Enter email",
            autoComplete: "email",
            validation: validators.email(),
        },
    ];

    const handleSubmit = async (values: ForgotPasswordFormValues) => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate the request so the flow
            // is testable end-to-end.
            await new Promise((resolve) => setTimeout(resolve, 800));
            toast.success(`A reset link was sent to ${values.email}`);
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthScreenLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold font-text text-[#1F2937]">
                        Reset Password
                    </h1>
                    <p className="text-sm font-normal font-text text-[#6B7280]">
                        A reset link will be sent to your mail.
                    </p>
                </div>

                <MainForm<ForgotPasswordFormValues>
                    methods={methods}
                    fields={fields}
                    onSubmit={handleSubmit}
                    submitLabel="Reset Password"
                    isLoading={isLoading}
                />

                <p className="text-center text-sm font-text text-[#6B7280]">
                    Don&apos;t have an account?{" "}
                    <Link
                        href={ARTISAN_SIGNUP_URL}
                        className="text-secondary-700 font-medium hover:underline"
                    >
                        Register
                    </Link>
                </p>
            </div>
        </AuthScreenLayout>
    );
}
