"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, History, Trophy } from "lucide-react";
import { useMyPoints, usePointsHistory } from "@/hooks/usePoints";
import PointsSummaryCard from "@/components/common/points/pointsSummaryCard";
import PointsHistoryList from "@/components/common/points/pointsHistoryList";
import PointsGuideModal from "@/components/common/points/pointsGuideModal";
import DeliveryDisputeDialog from "@/components/common/points/deliveryDisputeDialog";
import type { PointEntryRecord } from "@/constant/points";
import { cn } from "@/lib/utils";
import { LoadError } from "@/components/adminPlatform/emptyState";

interface PointsProfilePageViewProps {
    role: "manufacturer" | "admin";
    backUrl: string;
}

export default function PointsProfilePageView({ role, backUrl }: PointsProfilePageViewProps) {
    const { summary, isLoading: isSummaryLoading, isError: isSummaryError } = useMyPoints();
    const history = usePointsHistory();
    const [guideOpen, setGuideOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"history" | "guide">("history");
    const [disputeEntry, setDisputeEntry] = useState<PointEntryRecord | null>(null);

    const points = summary?.points ?? 0;
    const progression = summary?.progression;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href={backUrl}
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-white text-mist-600 hover:bg-mist-50 transition-colors"
                        title="Back to profile"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold font-text text-mist-950">Points & Standing</h1>
                        <p className="text-xs text-mist-500 font-text">
                            Track your performance ranking, point rewards, and complete ledger history.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium font-text text-secondary-700 bg-secondary-50 hover:bg-secondary-100 rounded-lg border border-secondary-200 transition-colors shadow-xs"
                >
                    <BookOpen className="size-3.5" />
                    <span>Point Guide</span>
                </button>
            </div>

            {isSummaryError ? (
                <LoadError message="We couldn't load your points. Please refresh the page." />
            ) : (
                <PointsSummaryCard
                    points={points}
                    progression={progression}
                    role={role}
                    loading={isSummaryLoading}
                    onOpenGuide={() => setGuideOpen(true)}
                />
            )}

            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-border">
                    <button
                        type="button"
                        onClick={() => setActiveTab("history")}
                        className={cn(
                            "flex items-center gap-2 pb-3 text-sm font-medium font-text border-b-2 transition-colors",
                            activeTab === "history"
                                ? "border-secondary-600 text-secondary-900"
                                : "border-transparent text-mist-500 hover:text-mist-800",
                        )}
                    >
                        <History className="size-4" />
                        <span>Point History</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("guide")}
                        className={cn(
                            "flex items-center gap-2 pb-3 text-sm font-medium font-text border-b-2 transition-colors",
                            activeTab === "guide"
                                ? "border-secondary-600 text-secondary-900"
                                : "border-transparent text-mist-500 hover:text-mist-800",
                        )}
                    >
                        <Trophy className="size-4" />
                        <span>Ranks & Rules</span>
                    </button>
                </div>

                {activeTab === "history" ? (
                    <PointsHistoryList
                        entries={history.entries}
                        loading={history.isLoading}
                        error={history.isError}
                        hasMore={history.hasMore}
                        onLoadMore={history.loadMore}
                        loadingMore={history.isLoadingMore}
                        onDisputeClick={(entry) => setDisputeEntry(entry)}
                    />
                ) : (
                    <div className="rounded-xl border border-border bg-white p-6 flex flex-col gap-4">
                        <p className="text-xs text-mist-600 font-text">
                            Points reflect your execution consistency, quality ratings, and adherence to delivery specs.
                        </p>
                        <button
                            type="button"
                            onClick={() => setGuideOpen(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold font-text text-white bg-secondary-700 hover:bg-secondary-800 rounded-lg shadow-xs transition-colors self-start"
                        >
                            <BookOpen className="size-4" />
                            Open Interactive Point Guide
                        </button>
                    </div>
                )}
            </div>

            <PointsGuideModal
                open={guideOpen}
                onClose={() => setGuideOpen(false)}
                role={role}
            />

            {disputeEntry?.dispute && disputeEntry.jobId && (
                <DeliveryDisputeDialog
                    open
                    onClose={() => setDisputeEntry(null)}
                    jobId={disputeEntry.jobId}
                    jobTitle={disputeEntry.jobTitle ?? "the job"}
                    // From the API, never read out of the entry's reference
                    rejectionId={disputeEntry.dispute.rejectionId}
                    // The entry then shows its dispute as sent
                    onSuccess={() => void history.refetch()}
                />
            )}
        </div>
    );
}
