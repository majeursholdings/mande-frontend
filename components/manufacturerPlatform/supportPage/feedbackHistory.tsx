"use client";

import { useState } from "react";
import { formatDayAndTime } from "@/lib/date";
import type { ManufacturerFeedback } from "@/constant/manufacturer";
import { Skeleton } from "@/components/ui/skeleton";
import LoadError from "../loadError";
import SettingsSection from "../settingsSection";
import FeedbackCategoryBadge from "./feedbackCategoryBadge";

/** How many show before "Show all". */
const PREVIEW_COUNT = 3;

/**
 * The feedback the manufacturer has sent, newest first: to read back, not
 * change: sent feedback cannot be edited or deleted.
 */
export default function FeedbackHistory({
    feedback,
    isLoading = false,
    isError = false,
}: {
    feedback: ManufacturerFeedback[];
    isLoading?: boolean;
    isError?: boolean;
}) {
    const [showAll, setShowAll] = useState(false);
    const shown = showAll ? feedback : feedback.slice(0, PREVIEW_COUNT);
    const hiddenCount = feedback.length - shown.length;

    return (
        <SettingsSection
            title="Your feedback"
            description="Everything you've shared with us, newest first. Feedback can't be edited or deleted once it's sent."
        >
            {isError ? (
                <LoadError>Couldn&apos;t load your feedback. Please refresh the page to try again.</LoadError>
            ) : isLoading ? (
                <ul aria-hidden className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                        <li key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <Skeleton className="h-5 w-20 rounded-full" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </li>
                    ))}
                </ul>
            ) : feedback.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm font-text text-mist-500">
                    Feedback you send will show up here.
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    <ul className="flex flex-col gap-3">
                        {shown.map((item) => (
                            <li key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <FeedbackCategoryBadge category={item.category} />
                                    <span className="text-xs font-text text-mist-400">
                                        Sent {formatDayAndTime(new Date(item.sentAt))}
                                    </span>
                                </div>
                                <p className="text-sm font-text whitespace-pre-line text-mist-900">{item.message}</p>
                                {item.screenshotUrl && (
                                    <a
                                        href={item.screenshotUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-fit rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-secondary-300"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element -- may be a client-side blob: URL from the form */}
                                        <img
                                            src={item.screenshotUrl}
                                            alt="Screenshot you attached"
                                            className="h-28 w-auto rounded-lg border border-border object-cover"
                                        />
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>
                    {feedback.length > PREVIEW_COUNT && (
                        <button
                            type="button"
                            onClick={() => setShowAll((current) => !current)}
                            className="self-start text-sm font-medium font-text text-secondary-700 hover:underline cursor-pointer"
                        >
                            {showAll ? "Show less" : `Show all (${hiddenCount} more)`}
                        </button>
                    )}
                </div>
            )}
        </SettingsSection>
    );
}
