"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, ShieldCheck } from "lucide-react";
import { staffService } from "@/lib/services/staffService";
import { ADMIN_POSITION_OPTIONS } from "@/constant/admin";
import { getOptionLabel } from "@/constant/manufacturer";
import { getRankProgression } from "@/constant/points";
import UserAvatar from "@/components/ui/userAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import ResponsiveTabs from "@/components/ui/responsiveTabs";
import RankBadge from "@/components/common/points/rankBadge";
import PointsSummaryCard from "@/components/common/points/pointsSummaryCard";
import PointsHistoryList from "@/components/common/points/pointsHistoryList";
import PointsGuideModal from "@/components/common/points/pointsGuideModal";
import { usePointsHistory } from "@/hooks/usePoints";
import { formatOrdinalDate } from "@/lib/date";

type LeadTab = "jobs" | "points" | "info";

export default function ProjectLeadDetailPage({ leadId }: { leadId: string }) {
    const [guideOpen, setGuideOpen] = useState(false);

    const leadQuery = useQuery({
        queryKey: ["staff", "lead", leadId],
        queryFn: () => staffService.getProjectLead(leadId),
        staleTime: 60_000,
    });

    const lead = leadQuery.data?.projectLead;
    const router = useRouter();

    // Profile URLs use the readable userId: a link by database id lands on it
    const canonicalId: string | null | undefined = lead?.userId;
    useEffect(() => {
        if (canonicalId && canonicalId !== leadId) router.replace(`/super-admin/project-leads/${encodeURIComponent(canonicalId)}`);
    }, [canonicalId, leadId, router]);
    const { entries, isLoading: isPointsLoading } = usePointsHistory(leadId);

    const points = lead?.points ?? 0;
    const rank = lead?.rank ?? "associate-lead";
    const progression = useMemo(
        () => getRankProgression("admin", points, lead?.completedJobsCount ?? 0, lead?.averageRating ?? 5.0),
        [points, lead?.completedJobsCount, lead?.averageRating],
    );

    if (leadQuery.isPending) {
        return (
            <div className="flex flex-col gap-6" aria-busy="true">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl lg:col-span-2" />
                </div>
            </div>
        );
    }

    if (leadQuery.isError || !lead) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
                <p className="text-sm font-text text-mist-600">Project lead not found.</p>
                <Link
                    href="/super-admin/project-leads"
                    className="text-xs text-secondary-700 font-medium hover:underline flex items-center gap-1.5"
                >
                    <ArrowLeft className="size-3.5" /> Back to Project Leads
                </Link>
            </div>
        );
    }

    const activeJobs = lead.activeJobs ?? [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/super-admin/project-leads"
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-white text-mist-600 hover:bg-mist-50 transition-colors"
                        title="Back to project leads"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold font-text text-mist-950">{lead.name}</h1>
                        <p className="text-xs text-mist-500 font-text">
                            {getOptionLabel(ADMIN_POSITION_OPTIONS, lead.position)} • Joined{" "}
                            {formatOrdinalDate(new Date(lead.joinedAt))}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <RankBadge rankId={rank} role="admin" size="md" />
                </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                {/* Left Card: Summary Profile */}
                <div className="flex flex-col gap-5 rounded-xl border border-border bg-white p-5 lg:w-72 lg:shrink-0 shadow-xs">
                    <div className="flex flex-col items-center text-center gap-3">
                        <UserAvatar name={lead.name} src={lead.avatarUrl} className="size-20 text-lg shadow-xs" />
                        <div>
                            <h2 className="font-semibold font-text text-mist-950 text-base">{lead.name}</h2>
                            <p className="text-xs text-mist-500 font-text">
                                {getOptionLabel(ADMIN_POSITION_OPTIONS, lead.position)}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 flex flex-col gap-3 text-xs font-text">
                        <div className="flex items-center gap-2.5 text-mist-700">
                            <Mail className="size-3.5 text-mist-400 shrink-0" />
                            <span className="truncate">{lead.email}</span>
                        </div>
                        {lead.phone && (
                            <div className="flex items-center gap-2.5 text-mist-700">
                                <Phone className="size-3.5 text-mist-400 shrink-0" />
                                <span>{lead.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2.5 text-mist-700">
                            <ShieldCheck className="size-3.5 text-mist-400 shrink-0" />
                            <span>
                                2FA: {lead.twoFactorMethod ? `Active (${lead.twoFactorMethod})` : "Disabled"}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-mist-400 block">Active Jobs</span>
                            <span className="text-base font-bold text-mist-900 tabular-nums">
                                {lead.activeJobsCount ?? activeJobs.length}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-mist-400 block">Avg Rating</span>
                            <span className="text-base font-bold text-mist-900 tabular-nums">
                                {lead.averageRating ? `${lead.averageRating.toFixed(1)}★` : "—"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Tab Panels */}
                <div className="min-w-0 flex-1">
                    <ResponsiveTabs<LeadTab>
                        label={`${lead.name}'s details`}
                        defaultValue="jobs"
                        tabs={[
                            {
                                value: "jobs",
                                label: "Active Jobs",
                                panel: (
                                    <div className="flex flex-col gap-3">
                                        {activeJobs.length === 0 ? (
                                            <div className="p-8 rounded-xl border border-dashed border-border bg-white text-center">
                                                <p className="text-xs text-mist-500 font-text">
                                                    No active jobs currently led by this admin.
                                                </p>
                                            </div>
                                        ) : (
                                            activeJobs.map((job: { id: string; code: string; title: string; status: string; dueDate: string | null }) => (
                                                <div
                                                    key={job.id}
                                                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-white hover:border-mist-300 transition-colors"
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-mono font-bold text-mist-600">
                                                            {job.code}
                                                        </span>
                                                        <Link
                                                            href={`/super-admin/jobs?job=${encodeURIComponent(job.code.toLowerCase())}`}
                                                            className="text-sm font-medium font-text text-mist-950 hover:underline"
                                                        >
                                                            {job.title}
                                                        </Link>
                                                        <span className="text-[11px] text-mist-500 font-text">
                                                            Due: {job.dueDate ? formatOrdinalDate(new Date(job.dueDate)) : "Not set"}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-mist-100 text-mist-700">
                                                        {job.status}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ),
                            },
                            {
                                value: "points",
                                label: "Points & Rank",
                                panel: (
                                    <div className="flex flex-col gap-6">
                                        <PointsSummaryCard
                                            points={points}
                                            progression={progression}
                                            role="admin"
                                            onOpenGuide={() => setGuideOpen(true)}
                                        />

                                        <div className="flex flex-col gap-3">
                                            <h3 className="text-sm font-semibold font-text text-mist-900">
                                                Point Activity Log
                                            </h3>
                                            <PointsHistoryList entries={entries} loading={isPointsLoading} />
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                value: "info",
                                label: "Account Info",
                                panel: (
                                    <div className="rounded-xl border border-border bg-white p-5 flex flex-col gap-4 text-xs font-text">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-mist-400 block text-[11px]">Full Name</span>
                                                <span className="font-medium text-mist-900">{lead.name}</span>
                                            </div>
                                            <div>
                                                <span className="text-mist-400 block text-[11px]">Email Address</span>
                                                <span className="font-medium text-mist-900">{lead.email}</span>
                                            </div>
                                            <div>
                                                <span className="text-mist-400 block text-[11px]">Assigned Role</span>
                                                <span className="font-medium text-mist-900">Project Lead</span>
                                            </div>
                                            <div>
                                                <span className="text-mist-400 block text-[11px]">Account Status</span>
                                                <span className="font-medium text-emerald-700 capitalize">
                                                    {lead.status ?? "active"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </div>
            </div>

            <PointsGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} role="admin" />
        </div>
    );
}
