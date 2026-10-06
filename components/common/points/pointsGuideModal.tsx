import { useState } from "react";
import { ShieldAlert, Sparkles, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    ADMIN_RANKS,
    DEFAULT_POINT_SETTINGS,
    MANUFACTURER_RANKS,
    type PointSettingsConfig,
} from "@/constant/points";
import RankBadge from "./rankBadge";
import { cn } from "@/lib/utils";

interface PointsGuideModalProps {
    open: boolean;
    onClose: () => void;
    role?: "manufacturer" | "admin";
    pointSettings?: PointSettingsConfig;
}

export default function PointsGuideModal({
    open,
    onClose,
    role = "manufacturer",
    pointSettings = DEFAULT_POINT_SETTINGS,
}: PointsGuideModalProps) {
    const [activeTab, setActiveTab] = useState<"ranks" | "allocations" | "rules">("ranks");

    const ranks = role === "manufacturer" ? MANUFACTURER_RANKS : ADMIN_RANKS;
    const mfrSettings = pointSettings.manufacturer;
    const admSettings = pointSettings.admin;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
                <div className="p-6 pb-4 border-b border-border sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Trophy className="size-5 text-secondary-600" aria-hidden />
                            <DialogTitle className="text-lg font-semibold font-text text-mist-950">
                                Points & Ranking Guide
                            </DialogTitle>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 border-b border-border -mb-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab("ranks")}
                            className={cn(
                                "pb-3 text-sm font-medium font-text border-b-2 transition-colors",
                                activeTab === "ranks"
                                    ? "border-secondary-600 text-secondary-900"
                                    : "border-transparent text-mist-500 hover:text-mist-800",
                            )}
                        >
                            Rank Ladders
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("allocations")}
                            className={cn(
                                "pb-3 text-sm font-medium font-text border-b-2 transition-colors",
                                activeTab === "allocations"
                                    ? "border-secondary-600 text-secondary-900"
                                    : "border-transparent text-mist-500 hover:text-mist-800",
                            )}
                        >
                            How Points Are Earned
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("rules")}
                            className={cn(
                                "pb-3 text-sm font-medium font-text border-b-2 transition-colors",
                                activeTab === "rules"
                                    ? "border-secondary-600 text-secondary-900"
                                    : "border-transparent text-mist-500 hover:text-mist-800",
                            )}
                        >
                            Disputes & Extension Rules
                        </button>
                    </div>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {activeTab === "ranks" && (
                        <div className="flex flex-col gap-4">
                            <p className="text-xs text-mist-600 font-text">
                                Higher ranks require achieving both minimum point totals and meeting delivery performance
                                thresholds (completed jobs and customer star ratings).
                            </p>

                            <div className="flex flex-col gap-3">
                                {ranks.map((rank) => (
                                    <div
                                        key={rank.id}
                                        className="p-4 rounded-xl border border-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <RankBadge rankId={rank.id} role={role} size="sm" />
                                                <span className="text-xs font-mono font-bold text-mist-700">
                                                    Tier {rank.level}
                                                </span>
                                            </div>
                                            <p className="text-xs text-mist-600 mt-1">{rank.description}</p>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs font-text text-mist-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 shrink-0">
                                            <div>
                                                <span className="text-mist-400 block text-[10px] uppercase font-bold">
                                                    Points
                                                </span>
                                                <span className="font-bold tabular-nums">
                                                    {rank.minPoints.toLocaleString()}+
                                                </span>
                                            </div>
                                            {rank.minCompletedJobs > 0 && (
                                                <div className="border-l border-slate-200 pl-3">
                                                    <span className="text-mist-400 block text-[10px] uppercase font-bold">
                                                        Jobs
                                                    </span>
                                                    <span className="font-bold tabular-nums">
                                                        ≥{rank.minCompletedJobs}
                                                    </span>
                                                </div>
                                            )}
                                            {rank.minAverageRating > 0 && (
                                                <div className="border-l border-slate-200 pl-3">
                                                    <span className="text-mist-400 block text-[10px] uppercase font-bold">
                                                        Rating
                                                    </span>
                                                    <span className="font-bold tabular-nums">
                                                        ≥{rank.minAverageRating}★
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "allocations" && (
                        <div className="flex flex-col gap-5">
                            {role === "manufacturer" ? (
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-xs font-bold font-text text-mist-800 uppercase tracking-wider">
                                        Manufacturer Point System
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>Application Accepted</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{mfrSettings.applicationAccepted}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>Job Started (Accepted Offer)</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{mfrSettings.offerAccepted}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>Production Step Approved</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{mfrSettings.stepApproved}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-red-50/40 flex justify-between items-center">
                                            <span>Production Step Sent Back</span>
                                            <span className="font-bold text-red-700 font-mono">
                                                {mfrSettings.stepSentBack}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>Job Signed Off & Delivered</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{mfrSettings.jobDeliveredSignedOff}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-red-50/40 flex justify-between items-center">
                                            <span>Rejected at Delivery</span>
                                            <span className="font-bold text-red-700 font-mono">
                                                {mfrSettings.deliveryRejected}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>5-Star Rating Received</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{mfrSettings.rating5Star}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>4-Star Rating Received</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{mfrSettings.rating4Star}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>3-Star Rating Received</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{mfrSettings.rating3Star}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-red-50/40 flex justify-between items-center">
                                            <span>Rating &lt; 3 Stars (1-2★)</span>
                                            <span className="font-bold text-red-700 font-mono">
                                                {mfrSettings.rating2Star} to {mfrSettings.rating1Star}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-red-50/40 flex justify-between items-center">
                                            <span>Account Flagged</span>
                                            <span className="font-bold text-red-700 font-mono">
                                                {mfrSettings.accountFlagged}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>On-Time Bonus Released</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{mfrSettings.bonusReleased}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-xs font-bold font-text text-mist-800 uppercase tracking-wider">
                                        Project Lead Point System
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>Job Started</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{admSettings.jobStarted}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>Job Successfully Completed</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{admSettings.jobCompleted}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>Step Reviewed On-Time (&lt;24h)</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{admSettings.stepReviewedOntime}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-red-50/40 flex justify-between items-center">
                                            <span>Step Delayed Review (per day added)</span>
                                            <span className="font-bold text-red-700 font-mono">
                                                {admSettings.stepReviewDelayedPerDay} / day
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-red-50/40 flex justify-between items-center">
                                            <span>Defect Rejection at Delivery</span>
                                            <span className="font-bold text-red-700 font-mono">
                                                {admSettings.deliveryRejected}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>5-Star Lead Rating</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{admSettings.rating5Star}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>4-Star Lead Rating</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{admSettings.rating4Star}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-emerald-50/40 flex justify-between items-center">
                                            <span>3-Star Lead Rating</span>
                                            <span className="font-bold text-emerald-700 font-mono">
                                                +{admSettings.rating3Star}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-red-50/40 flex justify-between items-center">
                                            <span>Rating &lt; 3 Stars (1-2★)</span>
                                            <span className="font-bold text-red-700 font-mono">
                                                {admSettings.rating2Star} to {admSettings.rating1Star}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-lg border border-border bg-red-50/40 flex justify-between items-center">
                                            <span>Warranty Fault Reported</span>
                                            <span className="font-bold text-red-700 font-mono">
                                                {admSettings.faultReported}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "rules" && (
                        <div className="flex flex-col gap-4 text-xs font-text text-mist-700 leading-relaxed">
                            <div className="p-4 rounded-xl border border-secondary-200 bg-secondary-50/50 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-secondary-900 font-semibold">
                                    <Sparkles className="size-4" />
                                    <span>Compensatory Review Delays (+1 Day per 12h)</span>
                                </div>
                                <p>
                                    To protect manufacturers from unreviewed delays on production steps 1 through 5
                                    (Design, Materials, Frame, Assembly, Finishing), the job deadline moves out by{" "}
                                    <strong>1 extra day for every 12 hours of delay</strong> past the 24-hour review
                                    window (excluding Sundays in Lagos time).
                                </p>
                                <p className="text-[11px] text-secondary-700">
                                    Note: Step 6 (Delivery) is exempted from automatic extensions due to external logistics and site receipt variables.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-amber-900 font-semibold">
                                    <ShieldAlert className="size-4" />
                                    <span>48-Hour Delivery Dispute (&ldquo;Fight Back&rdquo;) Window</span>
                                </div>
                                <p>
                                    When goods are rejected during the delivery step, points are initially deducted from both
                                    parties. If the rejection was caused by site access issues, third-party logistics damage,
                                    or inaccurate specifications, either the admin or manufacturer has{" "}
                                    <strong>48 hours</strong> to submit a dispute with evidence.
                                </p>
                                <p className="text-[11px] text-amber-800">
                                    Super Admins review disputed delivery rejections. If the dispute is upheld, deducted points
                                    are immediately refunded.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
