"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import SupportFeedbackForm from "@/components/manufacturerPlatform/form/supportFeedbackForm";
import { MANUFACTURER_PROFILE_BACK_LINK } from "@/constant/manufacturer";
import type { Faq } from "@/lib/cms/faq";
import { supportService } from "@/lib/services/supportService";
import { queryKeys } from "@/lib/queryKeys";
import PageHeader from "../pageHeader";
import SettingsSection from "../settingsSection";
import FeedbackHistory, { type FeedbackHistoryItem } from "./feedbackHistory";
import LoadError from "../loadError";

/** How many feedback messages each page of the history loads. */
const FEEDBACK_PAGE_SIZE = 20;

export default function ManufacturerSupportPage({
    faqs,
}: {
    /** From the CMS; null when they couldn't be loaded. */
    faqs: Faq[] | null;
}) {
    const { data, isPending, isError, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } =
        useInfiniteQuery({
            queryKey: queryKeys.support.feedback(),
            queryFn: ({ pageParam }) =>
                supportService.listFeedback({ limit: FEEDBACK_PAGE_SIZE, ...(pageParam && { before: pageParam }) }),
            initialPageParam: "" as string,
            getNextPageParam: (lastPage) => lastPage.nextBefore ?? undefined,
            staleTime: 30_000,
        });

    const feedback: FeedbackHistoryItem[] = useMemo(
        () =>
            (data?.pages ?? []).flatMap((page) =>
                (page.feedback ?? []).map((item) => ({
                    id: item.id,
                    category: item.category,
                    message: item.message,
                    screenshotUrl: item.screenshot?.url || null,
                    // Left out when the server has no date for it: never made up
                    sentAt: item.sentAt ? new Date(item.sentAt).toISOString() : null,
                })),
            ),
        [data],
    );

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="Talk to support"
                description="Find quick answers, or tell us how we can do better."
                backLink={MANUFACTURER_PROFILE_BACK_LINK}
            />

            <div className="flex max-w-3xl flex-col gap-8">
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

                <FeedbackHistory
                    feedback={feedback}
                    isLoading={isPending}
                    isError={isError}
                    hasOlder={hasNextPage}
                    onLoadOlder={() => void fetchNextPage()}
                    isLoadingOlder={isFetchingNextPage}
                    isLoadOlderError={isFetchNextPageError}
                />
            </div>
        </div>
    );
}
