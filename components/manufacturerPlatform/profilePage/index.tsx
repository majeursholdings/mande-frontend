"use client";

import { Headset, LogOut, Scale, Settings, ShieldCheck, UsersRound } from "lucide-react";
import {
    MANUFACTURER_COMMUNITY_URL,
    MANUFACTURER_LEGAL_URL,
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
import ProfileCard, { ProfileCardSkeleton } from "./profileCard";
import ProfileStatCard, { ProfileStatCardSkeleton } from "./profileStatCard";

const PROFILE_LINKS: LinkListItem[] = [
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

export default function ManufacturerProfilePage() {
    const { profile, isLoading } = useManufacturerProfile();
    const { requestLogout } = useLogout();

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Profile</h1>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                {isLoading ? (
                    <ProfileCardSkeleton className="lg:w-65 lg:shrink-0" />
                ) : (
                    <ProfileCard profile={profile} className="lg:w-65 lg:shrink-0" />
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-8 lg:gap-6">
                    <div className="grid grid-cols-2 gap-4 lg:gap-6">
                        {isLoading ? (
                            <>
                                <ProfileStatCardSkeleton />
                                <ProfileStatCardSkeleton />
                            </>
                        ) : (
                            <>
                                <ProfileStatCard
                                    label="Number of Staff"
                                    value={formatRange(getOptionLabel(STAFF_RANGE_OPTIONS, profile.staffRange))}
                                />
                                <ProfileStatCard
                                    label="Avg. Production Time"
                                    value={formatRange(
                                        getOptionLabel(PRODUCTION_LEAD_TIME_OPTIONS, profile.productionLeadTime),
                                    )}
                                />
                            </>
                        )}
                    </div>

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
