"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { isPhoneNumber, validators } from "@/components/form/form.validators";
import { cn } from "@/lib/utils";
import { contactService } from "@/lib/services/contactService";
import { MandeApiError } from "@/lib/types/api";
import { PRIVACY_POLICY_URL } from "@/constant/navigation";
import { CONTACT_TOPIC_OPTIONS } from "@/constant/website";
import { WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";

type ContactFormValues = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    topic: string;
    message: string;
    agreeToPrivacyPolicy: boolean;
};

const DEFAULT_VALUES: ContactFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    topic: "",
    message: "",
    agreeToPrivacyPolicy: false,
};

/** The fields the API can name in a validation error, to show it on the field. */
const FIELD_NAMES = Object.keys(DEFAULT_VALUES) as (keyof ContactFormValues)[];

const MESSAGE_MIN_LENGTH = 20;
const MESSAGE_MAX_LENGTH = 1000;

const FIELDS: FormFieldConfig[] = [
    {
        name: "firstName",
        type: "text",
        label: "First name",
        placeholder: "e.g. Ada",
        autoComplete: "given-name",
        validation: {
            ...validators.name("First name"),
            // Trimmed so a name made of only spaces doesn't pass
            validate: (value: string) => value.trim().length >= 2 || "First name must be at least 2 characters",
        },
    },
    {
        name: "lastName",
        type: "text",
        label: "Last name",
        placeholder: "e.g. Okafor",
        autoComplete: "family-name",
        validation: {
            ...validators.name("Last name"),
            validate: (value: string) => value.trim().length >= 2 || "Last name must be at least 2 characters",
        },
    },
    {
        name: "email",
        type: "email",
        label: "Email",
        placeholder: "you@example.com",
        autoComplete: "email",
        validation: validators.email(),
    },
    {
        name: "phone",
        type: "tel",
        label: "Phone number (optional)",
        placeholder: "e.g. +234 801 234 5678",
        autoComplete: "tel",
        validation: {
            validate: (value: string) =>
                !value.trim() || isPhoneNumber(value) || "Enter a valid phone number, e.g. +234 801 234 5678",
        },
    },
    {
        name: "topic",
        type: "select",
        label: "What's it about?",
        placeholder: "Choose a topic",
        options: CONTACT_TOPIC_OPTIONS,
        validation: { required: "Choose what your message is about" },
    },
    {
        name: "message",
        type: "textarea",
        label: "Your message",
        placeholder: "Tell us a little about what you need",
        height: 160,
        validation: {
            required: "Write a message",
            validate: (value: string) =>
                value.trim().length >= MESSAGE_MIN_LENGTH || `Write at least ${MESSAGE_MIN_LENGTH} characters`,
            maxLength: { value: MESSAGE_MAX_LENGTH, message: `Keep it under ${MESSAGE_MAX_LENGTH.toLocaleString()} characters` },
        },
    },
    {
        name: "agreeToPrivacyPolicy",
        type: "checkbox",
        label: (
            <span className="font-light">
                I agree to MANDE&apos;s{" "}
                <Link
                    href={PRIVACY_POLICY_URL}
                    // A new tab, so what they've typed here stays put
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary-800 underline underline-offset-4 hover:text-primary-950"
                >
                    Privacy Policy
                </Link>{" "}
                and to being contacted about my message.
            </span>
        ),
        validation: {
            validate: (value: boolean) => value === true || "Agree to the Privacy Policy to send your message",
        },
    },
];

/** A message to the MANDE team from the website — who's asking, what about, and what they need. */
export default function ContactForm() {
    const [isLoading, setIsLoading] = useState(false);
    const methods = useForm<ContactFormValues>({ mode: "onTouched", defaultValues: DEFAULT_VALUES });

    const handleSubmit = async (values: ContactFormValues) => {
        setIsLoading(true);
        try {
            const phone = values.phone.trim();
            await contactService.sendMessage({
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                email: values.email.trim(),
                ...(phone && { phone }),
                topic: values.topic,
                message: values.message.trim(),
                agreeToPrivacyPolicy: true,
            });
            methods.reset(DEFAULT_VALUES);
            toast.success("Thanks, your message is on its way. We'll reply by email.");
        } catch (error) {
            if (error instanceof MandeApiError && error.status === 429) {
                toast.error("You've sent a few messages already. Please try again in an hour, or email us.");
                return;
            }
            // The API's reason for a field, shown on that field
            const details = error instanceof MandeApiError && error.status === 422 && error.details && !Array.isArray(error.details) ? error.details : null;
            const fieldErrors = details ? FIELD_NAMES.filter((name) => Array.isArray(details[name])) : [];
            for (const name of fieldErrors) {
                methods.setError(name, { message: String((details![name] as unknown[])[0]) });
            }
            toast.error(fieldErrors.length > 0 ? "Some fields need attention." : "Couldn't send your message. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<ContactFormValues>
            methods={methods}
            fields={FIELDS}
            rowPairs={[
                ["firstName", "lastName"],
                ["email", "phone"],
            ]}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            renderFooter={({ isLoading, canSubmit }) => (
                <button
                    type="submit"
                    disabled={isLoading || !canSubmit}
                    className={cn(
                        WEBSITE_PRIMARY_BUTTON,
                        "w-full cursor-pointer py-2.5 sm:w-auto disabled:cursor-not-allowed disabled:border-mist-300 disabled:bg-mist-300 disabled:text-mist-600",
                    )}
                >
                    {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                    {isLoading ? "Sending..." : "Send message"}
                </button>
            )}
        />
    );
}
