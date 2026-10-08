"use client";

import { Bell, Headset, LogOut, Scale, Settings, ShieldCheck, UsersRound, Clock } from "lucide-react";
import {
    MANUFACTURER_COMMUNITY_URL,
    MANUFACTURER_LEGAL_URL,
    MANUFACTURER_NOTIFICATIONS_URL,
    MANUFACTURER_PLAN_SETTINGS_URL,
    MANUFACTURER_SECURITY_URL,
    MANUFACTURER_SETTINGS_URL,
    MANUFACTURER_SUPPORT_URL,
    PRODUCTION_LEAD_TIME_OPTIONS,
    STAFF_RANGE_OPTIONS,
    getOptionLabel,
} from "@/constant/manufacturer";
import { useManufacturerProfile } from "../dashboardLayout/manufacturerProfileContext";
import { useLogout } from "../dashboardLayout/logoutContext";
import LinkList, { type LinkListItem } from "../linkList";
import ProfileCard from "./profileCard";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { subscriptionService } from "@/lib/services/subscriptionService";
import { useMyPoints } from "@/hooks/usePoints";
import PointsSummaryCard from "@/components/common/points/pointsSummaryCard";
import ManufacturerPlanCard, { ManufacturerPlanCardSkeleton } from "@/components/adminPlatform/manufacturerDetailPage/manufacturerPlanCard";

const PROFILE_LINKS: LinkListItem[] = [
    {
        href: "/manufacturer/profile/points",
        icon: UsersRound,
        title: "Points & standing",
        description: "Your Maker rank tier, point history and point guide",
    },
    {
        href: MANUFACTURER_NOTIFICATIONS_URL,
        icon: Bell,
        title: "Notifications",
        description: "Everything we've told you about your jobs, payments and account",
    },
    {
        href: MANUFACTURER_COMMUNITY_URL,
        icon: UsersRound,
        title: "Our community",
        description: "Join other makers on WhatsApp, TikTok, Instagram and more",
    },
    {
        href: MANUFACTURER_SETTINGS_URL,
        icon: Settings,
        title: "Settings",
        description: "Your details, company information and plan",
    },
    {
        href: MANUFACTURER_SECURITY_URL,
        icon: ShieldCheck,
        title: "Security",
        description: "Password, linked accounts and two-factor authentication",
    },
    {
        href: MANUFACTURER_LEGAL_URL,
        icon: Scale,
        title: "Legal information",
        description: "Terms, privacy and payment policies",
    },
    {
        href: MANUFACTURER_SUPPORT_URL,
        icon: Headset,
        title: "Talk to support",
        description: "Chat with us, read the FAQs or send feedback",
    },
];

/** "21 to 30" -> "21 - 30". */
function formatRange(label: string): string {
    return label.replace(" to ", " - ");
}

/** Their points page: history and how ranks work. */
const POINTS_URL = "/manufacturer/profile/points";

export default function ManufacturerProfilePage() {
    const { profile, isLoading } = useManufacturerProfile();
    const { requestLogout } = useLogout();
    const router = useRouter();
    // Their standing (rank, stars, points; over completed jobs) and their plan (the shell has loaded it already)
    const points = useMyPoints();
    const { data: plan, isPending: isPlanLoading } = useQuery({
        queryKey: queryKeys.subscription.details(),
        queryFn: () => subscriptionService.getSubscription(),
    });
    const subscription = plan?.subscription;

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Profile</h1>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex flex-col gap-6 lg:w-65 lg:shrink-0">
                    <ProfileCard
                        profile={profile}
                        loading={isLoading}
                        standing={
                            points.summary ? { rankId: points.summary.rank, averageRating: points.summary.averageRating } : undefined
                        }
                    />
                    {isPlanLoading ? (
                        <ManufacturerPlanCardSkeleton />
                    ) : (
                        subscription && (
                            <ManufacturerPlanCard
                                subscription={{
                                    planId: subscription.planId,
                                    billingCycle: subscription.billingCycle,
                                    renewsAt: subscription.renewsAt ?? new Date().toISOString(),
                                    renewalsPaidFrom: subscription.renewalsPaidFrom,
                                }}
                                manageHref={MANUFACTURER_PLAN_SETTINGS_URL}
                            />
                        )
                    )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-8 lg:gap-6">
                    <OverviewCardGrid columns={2}>
                        <OverviewCard
                            icon={UsersRound}
                            label="Number of staff"
                            value={formatRange(getOptionLabel(STAFF_RANGE_OPTIONS, profile.staffRange))}
                            loading={isLoading}
                        />
                        <OverviewCard
                            icon={Clock}
                            label="Avg. production time"
                            value={formatRange(getOptionLabel(PRODUCTION_LEAD_TIME_OPTIONS, profile.productionLeadTime))}
                            loading={isLoading}
                        />
                    </OverviewCardGrid>

                    {/* Their rank, points and how far to the next rank */}
                    {points.isError ? null : (
                        <PointsSummaryCard
                            points={points.summary?.points ?? 0}
                            progression={points.summary?.progression}
                            role="manufacturer"
                            loading={points.isLoading}
                            onOpenGuide={() => router.push(POINTS_URL)}
                        />
                    )}

                    <LinkList items={PROFILE_LINKS} />
                </div>
            </div>

            {/* Mobile only - the desktop sidebar has its own Logout, the bottom nav doesn't */}
            <button
                type="button"
                onClick={requestLogout}
                className="lg:hidden mx-auto flex items-center gap-2 py-2 text-base font-medium font-text text-secondary-600 cursor-pointer"
            >
                <LogOut className="size-5" strokeWidth={1.75} />
                Logout
            </button>
        </div>
    );
}
