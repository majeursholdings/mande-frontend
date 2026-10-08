"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Award,
    BadgeCheck,
    Briefcase,
    BriefcaseBusiness,
    Star,
    Mail,
    Pencil,
    Phone,
    Settings,
    ShieldCheck,
    SlidersHorizontal,
    UserRoundPen,
} from "lucide-react";
import ProfileStatCard from "@/components/manufacturerPlatform/profilePage/profileStatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileDetailsCard, breakableEmail } from "@/components/manufacturerPlatform/profilePage/profileCard";
import LinkList from "@/components/manufacturerPlatform/linkList";
import { ADMIN_POSITION_OPTIONS, isRejectionFinal } from "@/constant/admin";
import { getOptionLabel } from "@/constant/manufacturer";
import { getSuperAdminRoleLabel } from "@/constant/superAdmin";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import { useAdminManufacturers } from "../dashboardLayout/adminManufacturersContext";
import { useAdminProfile } from "../dashboardLayout/adminProfileContext";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import { useProjectLeads } from "@/components/adminPlatform/dashboardLayout/useProjectLeads";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import RankBadge from "@/components/common/points/rankBadge";
import PointsSummaryCard from "@/components/common/points/pointsSummaryCard";
import { useMyPoints } from "@/hooks/usePoints";

// ─────────────────────────────────────────────────────────────────────────────
// Admin Profile — as a manufacturer's profile page lays it out: their card
// (photo, name, position, email, phone number) beside how many jobs they
// lead, and links to Settings and Security. Logout is in the sidebar, and
// the phone's Menu. A super admin's has their role (owner, manager or tech
// support) instead of a position, counts the admins and manufacturers they
// look after, and has Edit profile (their Settings are the platform's).
// ─────────────────────────────────────────────────────────────────────────────

/** The project lead's points page: their history and how ranks work. */
const POINTS_URL = "/admin/profile/points";

export default function AdminProfilePage() {
    const { profile, fullName } = useAdminProfile();
    const { jobs, isLoading: isJobsLoading } = useAdminJobs();
    const { manufacturers, isLoading: isManufacturersLoading } = useAdminManufacturers();
    const { leadId, roleLabel, superAdminRole, settingsUrl, profileEditUrl, securityUrl, permissions, jobsUrl } = useStaffPlatform();
    const router = useRouter();
    // A project lead's standing: points, rank and stars (super admins have none)
    const myPoints = useMyPoints({ enabled: !!leadId });
    const rating = myPoints.summary?.averageRating ?? null;
    // Only the super admin's stats count the leads
    const { leads, isLoading: isLeadsLoading } = useProjectLeads({ status: "all", enabled: !leadId });
    const myJobs = leadId ? jobs.filter((job) => job.projectLeadIds.includes(leadId)) : [];
    // Still open — a rejected job goes back to the manufacturer, unless that was its last rejection
    const leading = myJobs.filter((job) => job.status !== "completed" && !isRejectionFinal(job)).length;
    const completed = myJobs.filter((job) => job.status === "completed").length;
    const stats = leadId
        ? [
              { label: "Jobs you're leading", value: leading, isLoading: isJobsLoading },
              { label: "Jobs completed", value: completed, isLoading: isJobsLoading },
          ]
        : [
              { label: "Admins", value: leads.length, isLoading: isLeadsLoading },
              { label: "Manufacturers", value: manufacturers.length, isLoading: isManufacturersLoading },
          ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold font-text text-mist-950">Profile</h1>
                {permissions.managesPlatform && (
                    <Link
                        href={profileEditUrl}
                        className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-secondary-700 px-3 text-sm font-medium font-text text-white transition-colors hover:bg-secondary-900"
                    >
                        <Pencil className="size-4" aria-hidden />
                        Edit profile
                    </Link>
                )}
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <ProfileDetailsCard
                    name={fullName}
                    avatarUrl={profile.avatarUrl}
                    joinedAt={profile.joinedAt}
                    badge={
                        <span className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-secondary-50 px-2 py-0.5 text-[11px] font-medium font-text text-secondary-700">
                                {roleLabel}
                            </span>
                            {/* Their present rank */}
                            {leadId && myPoints.summary && <RankBadge rankId={myPoints.summary.rank} role="admin" size="sm" />}
                        </span>
                    }
                    details={[
                        { label: "Email", value: profile.email, icon: Mail, format: breakableEmail },
                        { label: "Phone number", value: profile.phone, icon: Phone },
                        ...(leadId
                            ? [
                                  {
                                      label: "Position",
                                      value: getOptionLabel(ADMIN_POSITION_OPTIONS, profile.position),
                                      icon: BriefcaseBusiness,
                                  },
                              ]
                            : []),
                        ...(superAdminRole ? [{ label: "Role", value: getSuperAdminRoleLabel(superAdminRole), icon: BadgeCheck }] : []),
                        {
                            label: "Two-factor",
                            value: profile.security.twoFactorMethod
                                ? `On · codes from ${profile.security.twoFactorMethod === "app" ? "an app" : "email"}`
                                : "",
                            icon: ShieldCheck,
                            emptyLabel: "Off",
                        },
                    ]}
                    editHref={profileEditUrl}
                    className="lg:w-65 lg:shrink-0"
                />

                <div className="flex min-w-0 flex-1 flex-col gap-8 lg:gap-6">
                    {leadId ? (
                        <>
                            <OverviewCardGrid columns={2}>
                                <OverviewCard
                                    icon={Briefcase}
                                    label="Jobs you're leading"
                                    value={leading.toLocaleString()}
                                    detail={{ label: "Jobs completed", value: completed.toLocaleString(), tone: "green" }}
                                    href={jobsUrl}
                                    loading={isJobsLoading}
                                />
                                <OverviewCard
                                    icon={Star}
                                    label="Average rating"
                                    value={rating === null ? "Not rated yet" : `${rating.toFixed(1)} ★`}
                                    detail={{ label: "Points", value: myPoints.summary?.points.toLocaleString(), tone: "blue" }}
                                    href={POINTS_URL}
                                    loading={myPoints.isLoading}
                                />
                            </OverviewCardGrid>
                            {/* Their rank, and how far to the next */}
                            <PointsSummaryCard
                                points={myPoints.summary?.points ?? 0}
                                progression={myPoints.summary?.progression}
                                role="admin"
                                loading={myPoints.isLoading}
                                onOpenGuide={() => router.push(POINTS_URL)}
                            />
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 lg:gap-6">
                            {stats.map((stat) =>
                                stat.isLoading ? (
                                    // The label shows straight away; the count is a skeleton until it loads
                                    <div
                                        key={stat.label}
                                        aria-busy="true"
                                        className="flex flex-col justify-center gap-1 rounded-xl border border-border bg-white p-4 lg:p-5"
                                    >
                                        <p className="text-xs lg:text-sm font-text text-mist-500">{stat.label}</p>
                                        <Skeleton className="my-0.5 h-6 w-12 lg:h-7" />
                                    </div>
                                ) : (
                                    <ProfileStatCard key={stat.label} label={stat.label} value={String(stat.value)} />
                                ),
                            )}
                        </div>
                    )}

                    <LinkList
                        items={[
                            permissions.managesPlatform
                                ? {
                                      href: profileEditUrl,
                                      icon: UserRoundPen,
                                      title: "Edit profile",
                                      description: "Your name, phone number, photo and notifications",
                                  }
                                : {
                                      href: settingsUrl,
                                      icon: Settings,
                                      title: "Settings",
                                      description: "Your details, phone number, photo and notifications",
                                  },
                            {
                                href: securityUrl,
                                icon: ShieldCheck,
                                title: "Security",
                                description: "Password and two-factor authentication",
                            },
                            ...(!permissions.managesPlatform
                                ? [
                                      {
                                          href: "/admin/profile/points",
                                          icon: Award,
                                          title: "Points & standing",
                                          description: "Your Lead rank tier, performance points and guide",
                                      },
                                  ]
                                : []),
                            ...(permissions.managesPlatform
                                ? [
                                      {
                                          href: settingsUrl,
                                          icon: SlidersHorizontal,
                                          title: "Platform settings",
                                          description: permissions.managesApiKeys
                                              ? "Super admins, plans, platform-wide rules and API keys"
                                              : "Super admins, plans and platform-wide rules",
                                      },
                                  ]
                                : []),
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}
