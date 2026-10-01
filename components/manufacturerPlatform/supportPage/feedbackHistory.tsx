"use client";

import { useState } from "react";
import { formatDayAndTime } from "@/lib/date";
import type { ManufacturerFeedback } from "@/constant/manufacturer";
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
}: {
    feedback: ManufacturerFeedback[];
    isLoading?: boolean;
}) {
    const [showAll, setShowAll] = useState(false);
    const shown = showAll ? feedback : feedback.slice(0, PREVIEW_COUNT);
    const hiddenCount = feedback.length - shown.length;

    return (
        <SettingsSection
            title="Your feedback"
            description="Everything you've shared with us, newest first. Feedback can't be edited or deleted once it's sent."
        >
            {isLoading ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5 animate-pulse"
                        >
                            <div className="flex items-center justify-between">
                                <div className="h-5 w-20 rounded-full bg-mist-200" />
                                <div className="h-4 w-28 rounded bg-mist-200" />
                            </div>
                            <div className="h-4 w-full rounded bg-mist-200" />
                            <div className="h-4 w-3/4 rounded bg-mist-200" />
                        </div>
                    ))}
                </div>
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
