// ─────────────────────────────────────────────────────────────────────────────
// Points, ranks, milestones, and dispute configuration for manufacturers
// and admins. Used across profile cards, tables, settings, and the points guide.
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = "manufacturer" | "admin" | "super_admin";

// ─── Default Point Numbers (can be customized via PlatformSettings) ──────────

export interface ManufacturerPointSettings {
    applicationAccepted: number;
    offerAccepted: number;
    stepApproved: number;
    stepSentBack: number;
    jobDeliveredSignedOff: number;
    deliveryRejected: number;
    finalRejectionClosed: number;
    rating5Star: number;
    rating4Star: number;
    rating3Star: number;
    rating2Star: number;
    rating1Star: number;
    accountFlagged: number;
    accountSuspended: number;
    bonusReleased: number;
    faultReported: number;
}

export interface AdminPointSettings {
    jobStarted: number;
    jobCompleted: number;
    stepReviewedOntime: number;
    stepReviewDelayedPerDay: number;
    deliveryRejected: number;
    rating5Star: number;
    rating4Star: number;
    rating3Star: number;
    rating2Star: number;
    rating1Star: number;
    faultReported: number;
}

export interface PointSettingsConfig {
    manufacturer: ManufacturerPointSettings;
    admin: AdminPointSettings;
}

export const DEFAULT_POINT_SETTINGS: PointSettingsConfig = {
    manufacturer: {
        applicationAccepted: 10,
        offerAccepted: 10,
        stepApproved: 5,
        stepSentBack: -8,
        jobDeliveredSignedOff: 50,
        deliveryRejected: -30,
        finalRejectionClosed: -50,
        rating5Star: 30,
        rating4Star: 15,
        rating3Star: 5,
        rating2Star: -15,
        rating1Star: -30,
        accountFlagged: -100,
        accountSuspended: -200,
        bonusReleased: 25,
        faultReported: -40,
    },
    admin: {
        jobStarted: 10,
        jobCompleted: 20,
        stepReviewedOntime: 5,
        stepReviewDelayedPerDay: -5,
        deliveryRejected: -20,
        rating5Star: 25,
        rating4Star: 10,
        rating3Star: 5,
        rating2Star: -15,
        rating1Star: -30,
        faultReported: -40,
    },
};

// ─── Ranks ───────────────────────────────────────────────────────────────────

export type ManufacturerRankTier =
    | "rising-maker"
    | "skilled-maker"
    | "pro-maker"
    | "expert-maker"
    | "master-craftsman";

export type AdminRankTier =
    | "associate-lead"
    | "senior-lead"
    | "principal-lead";

export interface RankDefinition {
    id: string;
    name: string;
    level: number;
    minPoints: number;
    minCompletedJobs: number;
    minAverageRating: number;
    badgeColor: string;
    description: string;
}

export const MANUFACTURER_RANKS: RankDefinition[] = [
    {
        id: "rising-maker",
        name: "Rising Maker",
        level: 1,
        minPoints: 0,
        minCompletedJobs: 0,
        minAverageRating: 0,
        badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
        description: "New and emerging manufacturers building their portfolio.",
    },
    {
        id: "skilled-maker",
        name: "Skilled Maker",
        level: 2,
        minPoints: 250,
        minCompletedJobs: 2,
        minAverageRating: 3.5,
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        description: "Consistent production history with solid quality feedback.",
    },
    {
        id: "pro-maker",
        name: "Pro Maker",
        level: 3,
        minPoints: 750,
        minCompletedJobs: 5,
        minAverageRating: 4.0,
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        description: "Proven record of on-time deliveries with minimal step rejections.",
    },
    {
        id: "expert-maker",
        name: "Expert Maker",
        level: 4,
        minPoints: 2000,
        minCompletedJobs: 15,
        minAverageRating: 4.2,
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        description: "High-volume artisan workshop trusted for complex bespoke orders.",
    },
    {
        id: "master-craftsman",
        name: "Master Craftsman",
        level: 5,
        minPoints: 5000,
        minCompletedJobs: 30,
        minAverageRating: 4.5,
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        description: "Top-tier craftsmanship and exemplary quality on the platform.",
    },
];

export const ADMIN_RANKS: RankDefinition[] = [
    {
        id: "associate-lead",
        name: "Associate Lead",
        level: 1,
        minPoints: 0,
        minCompletedJobs: 0,
        minAverageRating: 0,
        badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
        description: "New project lead managing active job workflows.",
    },
    {
        id: "senior-lead",
        name: "Senior Lead",
        level: 2,
        minPoints: 500,
        minCompletedJobs: 5,
        minAverageRating: 4.0,
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        description: "Proven quality controller with fast turnaround times.",
    },
    {
        id: "principal-lead",
        name: "Principal Lead",
        level: 3,
        minPoints: 2000,
        minCompletedJobs: 20,
        minAverageRating: 4.5,
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        description: "Senior platform leader supervising major furniture commissions.",
    },
];

export interface RankProgression {
    currentRank: RankDefinition;
    nextRank: RankDefinition | null;
    pointsToNext: number;
    completedJobsNeeded: number;
    ratingNeeded: number;
    progressPercent: number;
}

/** Determines a user's current rank and progression towards the next rank */
export function getRankProgression(
    role: "manufacturer" | "admin",
    points: number,
    completedJobs = 0,
    averageRating = 5.0,
): RankProgression {
    const ladder = role === "manufacturer" ? MANUFACTURER_RANKS : ADMIN_RANKS;
    let current = ladder[0]!;

    for (const rank of ladder) {
        if (
            points >= rank.minPoints &&
            completedJobs >= rank.minCompletedJobs &&
            averageRating >= rank.minAverageRating
        ) {
            current = rank;
        }
    }

    const currentIndex = ladder.findIndex((r) => r.id === current.id);
    const nextRank = currentIndex < ladder.length - 1 ? ladder[currentIndex + 1]! : null;

    let pointsToNext = 0;
    let completedJobsNeeded = 0;
    let ratingNeeded = 0;
    let progressPercent = 100;

    if (nextRank) {
        pointsToNext = Math.max(0, nextRank.minPoints - points);
        completedJobsNeeded = Math.max(0, nextRank.minCompletedJobs - completedJobs);
        ratingNeeded = Math.max(0, Number((nextRank.minAverageRating - averageRating).toFixed(1)));

        const tierSpan = nextRank.minPoints - current.minPoints;
        const currentProgress = Math.max(0, points - current.minPoints);
        progressPercent = tierSpan > 0 ? Math.min(100, Math.round((currentProgress / tierSpan) * 100)) : 100;
    }

    return {
        currentRank: current,
        nextRank,
        pointsToNext,
        completedJobsNeeded,
        ratingNeeded,
        progressPercent,
    };
}

// ─── Point Ledger Entries ───────────────────────────────────────────────────

export interface PointEntryRecord {
    id: string;
    userId: string;
    role: "manufacturer" | "admin";
    event: string;
    points: number;
    reference: string;
    jobId?: string | null;
    jobCode?: string | null;
    jobTitle?: string | null;
    summary: string;
    createdAt: string;
}

// ─── 48-Hour Delivery Dispute ("Fight Back") Model ──────────────────────────

export interface DeliveryDisputeRecord {
    id: string;
    jobId: string;
    jobTitle: string;
    jobCode: string;
    rejectionId: string;
    submittedByUserId: string;
    submittedByRole: "manufacturer" | "admin";
    submittedByName: string;
    reason: string;
    attachments: Array<{
        publicId: string;
        url: string;
        name: string;
        bytes?: number;
    }>;
    submittedAt: string;
    status: "pending" | "upheld" | "dismissed";
    decisionNote?: string | null;
    decidedAt?: string | null;
    decidedByName?: string | null;
}

export const DISPUTE_WINDOW_HOURS = 48;

/** Checks if a delivery rejection is still within the 48-hour dispute window */
export function isDeliveryDisputeEligible(rejectedAt: string | Date, now: Date = new Date()): boolean {
    const diffMs = now.getTime() - new Date(rejectedAt).getTime();
    return diffMs <= DISPUTE_WINDOW_HOURS * 60 * 60 * 1000 && diffMs >= 0;
}

export const POINT_MILESTONES = [250, 500, 1000, 2500, 5000, 10000] as const;
