"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import { FormSubmitButton } from "./formButtons";

type CancelValues = { reason: string };

const REASON_MIN_LENGTH = 3;
const REASON_MAX_LENGTH = 500;

/** Cancelling a machine booking: the reason, which the booker is emailed. */
export default function CancelMachineBookingForm({
    onCancelBooking,
    onClose,
}: {
    onCancelBooking: (reason: string) => Promise<void>;
    onClose: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<CancelValues>({ mode: "onTouched", defaultValues: { reason: "" } });

    const fields: FormFieldConfig[] = [
        {
            name: "reason",
            type: "textarea",
            label: "Reason",
            placeholder: "e.g. The cutting machine is down for repairs that day",
            height: 120,
            validation: {
                required: "Tell the booker why",
                validate: (value: string) =>
                    value.trim().length >= REASON_MIN_LENGTH || `Write at least ${REASON_MIN_LENGTH} characters`,
                maxLength: { value: REASON_MAX_LENGTH, message: `Keep it under ${REASON_MAX_LENGTH} characters` },
            },
        },
    ];

    const handleSubmit = async ({ reason }: CancelValues) => {
        setIsLoading(true);
        try {
            await onCancelBooking(reason.trim());
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't cancel the booking. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<CancelValues>
            methods={methods}
            fields={fields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hideRequiredMarks
            renderFooter={({ isLoading, canSubmit }) => (
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                    >
                        Keep booking
                    </Button>
                    <FormSubmitButton
                        label="Cancel booking"
                        loadingLabel="Cancelling..."
                        isLoading={isLoading}
                        disabled={!canSubmit}
                        className="w-auto bg-error-600 px-5 hover:bg-error-700"
                    />
                </div>
            )}
        />
    );
}
