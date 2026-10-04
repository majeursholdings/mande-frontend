"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
    MANUFACTURER_PROFILE_BACK_LINK,
    type ManufacturerFeedback,
} from "@/constant/manufacturer";
import { SUPPORT_HOURS } from "@/constant/support";
import type { Faq } from "@/lib/cms/faq";
import { supportService } from "@/lib/services/supportService";
import { queryKeys } from "@/lib/queryKeys";
import PageHeader from "../pageHeader";
import SettingsSection from "../settingsSection";
import FeedbackHistory from "./feedbackHistory";
import LoadError from "../loadError";
import { openSupportChat } from "./supportChat";

export default function ManufacturerSupportPage({
    faqs,
}: {
    /** From the CMS; null when they couldn't be loaded. */
    faqs: Faq[] | null;
}) {
    const { data, isPending, isError } = useQuery({
        queryKey: queryKeys.support.feedback(),
        queryFn: () => supportService.listFeedback(),
        staleTime: 30_000,
    });

    const feedback: ManufacturerFeedback[] = useMemo(() => {
        if (!data?.feedback || !Array.isArray(data.feedback)) {
            return [];
        }
        return data.feedback.map((item: {
            id?: string;
            _id?: string;
            category: ManufacturerFeedback["category"];
            message: string;
            screenshot?: { url?: string } | null;
            screenshotUrl?: string | null;
            sentAt?: string | null;
        }) => ({
            id: item.id || String(item._id || ""),
            category: item.category,
            message: item.message,
            screenshotUrl: item.screenshot?.url || item.screenshotUrl || null,
            sentAt: item.sentAt ? new Date(item.sentAt).toISOString() : new Date().toISOString(),
        }));
    }, [data]);

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

                {/* Left out until there are some */}
                {faqs === null ? (
                    <SettingsSection title="Frequently asked questions">
                        <LoadError>The FAQs couldn&apos;t be loaded. Please refresh the page to try again.</LoadError>
                    </SettingsSection>
                ) : (
                    faqs.length > 0 && (
                        <SettingsSection title="Frequently asked questions">
                            <div className="rounded-xl border border-border bg-white px-5">
                                <Accordion>
                                    {faqs.map((faq) => (
                                        <AccordionItem key={faq.key} value={faq.key}>
                                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                                            <AccordionContent>{faq.answer}</AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </SettingsSection>
                    )
                )}

                <SettingsSection
                    title="Share feedback"
                    description="Tell us what's working, what isn't, or what you'd like to see. We read every message."
                >
                    <SupportFeedbackForm />
                </SettingsSection>

                <FeedbackHistory feedback={feedback} isLoading={isPending} isError={isError} />
            </div>
        </div>
    );
}
