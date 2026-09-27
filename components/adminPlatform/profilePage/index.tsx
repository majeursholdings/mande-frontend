"use client";

import { BriefcaseBusiness, Mail, Phone, Settings, ShieldCheck } from "lucide-react";
import ProfileStatCard from "@/components/manufacturerPlatform/profilePage/profileStatCard";
import {
    ProfileDetailsCard,
    breakableEmail,
} from "@/components/manufacturerPlatform/profilePage/profileCard";
import LinkList, { type LinkListItem } from "@/components/manufacturerPlatform/linkList";
import {
    ADMIN_ME_ID,
    ADMIN_POSITION_OPTIONS,
    ADMIN_SECURITY_URL,
    ADMIN_SETTINGS_URL,
    isRejectionFinal,
} from "@/constant/admin";
import { getOptionLabel } from "@/constant/manufacturer";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import { useAdminProfile } from "../dashboardLayout/adminProfileContext";

const PROFILE_LINKS: LinkListItem[] = [
    {
        href: ADMIN_SETTINGS_URL,
        icon: Settings,
        title: "Settings",
        description: "Your details, phone number, photo and notifications",
    },
    {
        href: ADMIN_SECURITY_URL,
        icon: ShieldCheck,
        title: "Security",
        description: "Password and two-factor authentication",
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Admin Profile — as a manufacturer's profile page lays it out: their card
// (photo, name, position, email, phone number) beside how many jobs they
// lead, and links to Settings and Security. Logout is in the sidebar, and
// the phone's Menu.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminProfilePage() {
    const { profile, fullName } = useAdminProfile();
    const { jobs } = useAdminJobs();
    const myJobs = jobs.filter((job) => job.projectLeadIds.includes(ADMIN_ME_ID));
    // Still open — a rejected job goes back to the manufacturer, unless that was its last rejection
    const leading = myJobs.filter((job) => job.status !== "completed" && !isRejectionFinal(job)).length;
    const completed = myJobs.filter((job) => job.status === "completed").length;

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Profile</h1>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <ProfileDetailsCard
                    name={fullName}
                    avatarUrl={profile.avatarUrl}
                    joinedAt={profile.joinedAt}
                    badge={
                        <span className="rounded-full bg-secondary-50 px-2 py-0.5 text-[11px] font-medium font-text text-secondary-700">
                            Admin
                        </span>
                    }
                    details={[
                        { label: "Email", value: profile.email, icon: Mail, format: breakableEmail },
                        { label: "Phone number", value: profile.phone, icon: Phone },
                        {
                            label: "Position",
                            value: getOptionLabel(ADMIN_POSITION_OPTIONS, profile.position),
                            icon: BriefcaseBusiness,
                        },
                        {
                            label: "Two-factor",
                            value: profile.security.twoFactorMethod
                                ? `On · codes from ${profile.security.twoFactorMethod === "app" ? "an app" : "email"}`
                                : "",
                            icon: ShieldCheck,
                            emptyLabel: "Off",
                        },
                    ]}
                    editHref={ADMIN_SETTINGS_URL}
                    className="lg:w-65 lg:shrink-0"
                />

                <div className="flex min-w-0 flex-1 flex-col gap-8 lg:gap-6">
                    <div className="grid grid-cols-2 gap-4 lg:gap-6">
                        <ProfileStatCard label="Jobs you're leading" value={String(leading)} />
                        <ProfileStatCard label="Jobs completed" value={String(completed)} />
                    </div>

                    <LinkList items={PROFILE_LINKS} />
                </div>
            </div>
        </div>
    );
}
