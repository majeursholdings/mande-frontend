"use client";

import { useState } from "react";
import { Headset } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import SupportFeedbackForm from "@/components/manufacturerPlatform/form/supportFeedbackForm";
import { Button } from "@/components/ui/button";
import { PRIMARY_BUTTON_CLASS } from "@/components/manufacturerPlatform/form/formButtons";
import {
    MANUFACTURER_FEEDBACK,
    MANUFACTURER_PROFILE_BACK_LINK,
    type ManufacturerFeedback,
} from "@/constant/manufacturer";
import { SUPPORT_FAQS, SUPPORT_HOURS } from "@/constant/support";
import PageHeader from "../pageHeader";
import SettingsSection from "../settingsSection";
import FeedbackHistory from "./feedbackHistory";
import { openSupportChat } from "./supportChat";

export default function ManufacturerSupportPage() {
    // Seeded from sample data and kept locally for now — once the backend is
    // connected, load it from the API, and add what the API returns on send
    const [feedback, setFeedback] = useState<ManufacturerFeedback[]>(MANUFACTURER_FEEDBACK);

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Talk to support"
                description="Chat with our team, find quick answers, or tell us how we can do better."
                backLink={MANUFACTURER_PROFILE_BACK_LINK}
            />

            <div className="flex max-w-3xl flex-col gap-8">
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 sm:flex-row sm:items-center">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
                        <Headset className="size-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1 font-text">
                        <p className="text-base font-medium text-mist-950">Chat with our team</p>
                        <p className="text-sm text-mist-500">
                            {SUPPORT_HOURS}. We usually reply within a few minutes.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={openSupportChat}
                        className={`${PRIMARY_BUTTON_CLASS} shrink-0`}
                    >
                        Start a chat
                    </Button>
                </div>

                <SettingsSection title="Frequently asked questions">
                    <div className="rounded-xl border border-border bg-white px-5">
                        <Accordion>
                            {SUPPORT_FAQS.map((faq) => (
                                <AccordionItem key={faq.question} value={faq.question}>
                                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                                    <AccordionContent>{faq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </SettingsSection>

                <SettingsSection
                    title="Share feedback"
                    description="Tell us what's working, what isn't, or what you'd like to see. We read every message."
                >
                    <SupportFeedbackForm
                        onSend={(sent) =>
                            setFeedback((current) => [
                                { id: `feedback-${Date.now()}`, sentAt: new Date().toISOString(), ...sent },
                                ...current,
                            ])
                        }
                    />
                </SettingsSection>

                <FeedbackHistory feedback={feedback} />
            </div>
        </div>
    );
}
