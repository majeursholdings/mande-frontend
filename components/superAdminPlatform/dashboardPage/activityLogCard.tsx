"use client";

import { useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { formatDayAndTime, getRelativeTimeLabel } from "@/lib/date";
import { useIsClient } from "@/hooks/useIsClient";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardCard from "@/components/adminPlatform/dashboardPage/dashboardCard";
import PillSelect from "@/components/adminPlatform/dashboardPage/pillSelect";
import EmptyState from "@/components/adminPlatform/emptyState";
import { useAdminJobs } from "@/components/adminPlatform/dashboardLayout/adminJobsContext";
import { useAdminManufacturers } from "@/components/adminPlatform/dashboardLayout/adminManufacturersContext";
import { SUPER_ADMIN_ACTIVITY_LOG_URL } from "@/constant/superAdmin";
import { ActivityAvatar, ActivityMessage } from "../activity/activityParts";
import {
    ACTIVITY_ACTOR_LABELS,
    ACTIVITY_CATEGORIES,
    getPlatformActivity,
    type ActivityCategory,
    type PlatformActivity,
} from "../activity/platformActivity";

const SHOWN = 6;

const CATEGORY_OPTIONS: { value: ActivityCategory | "all"; label: string }[] = [
    { value: "all", label: "All activity" },
    ...ACTIVITY_CATEGORIES,
];

// ─────────────────────────────────────────────────────────────────────────────
// ActivityLogCard — the latest of everything happening on the platform: what
// admins do to jobs and accounts, what manufacturers do on their jobs, with
// their money and to their sign-in, the payments Mande makes and their
// feedback. Filter by kind; "Show more" opens the full Activity Log. The
// list is worked out in the browser, as of now: a server render (at build
// time, for this static page) would list what had happened by then.
// ─────────────────────────────────────────────────────────────────────────────

export default function ActivityLogCard() {
    const { jobs } = useAdminJobs();
    const { manufacturers } = useAdminManufacturers();
    const [category, setCategory] = useState<ActivityCategory | "all">("all");
    const isClient = useIsClient();

    const now = new Date();
    const activity = isClient
        ? getPlatformActivity(jobs, manufacturers, undefined, now).filter(
              (entry) => category === "all" || entry.category === category,
          )
        : [];
    // The full log opens on the same kind
    const logHref = category === "all" ? SUPER_ADMIN_ACTIVITY_LOG_URL : `${SUPER_ADMIN_ACTIVITY_LOG_URL}?activity_type=${category}`;

    return (
        <DashboardCard
            title="Activity Log"
            action={<PillSelect label="Showing" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />}
        >
            {!isClient ? (
                <ActivityListSkeleton />
            ) : activity.length === 0 ? (
                <EmptyState
                    icon={History}
                    title="No activity yet"
                    description="What admins and manufacturers do on the platform will show up here"
                />
            ) : (
                <>
                    <ul className="-my-3 flex flex-col divide-y divide-border">
                        {activity.slice(0, SHOWN).map((entry) => (
                            <ActivityRow key={entry.id} activity={entry} now={now} />
                        ))}
                    </ul>

                    <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                        <p className="text-xs font-text text-mist-400 tabular-nums">
                            Showing {Math.min(SHOWN, activity.length)} of {activity.length}
                        </p>
                        {activity.length > SHOWN && (
                            <Link
                                href={logHref}
                                className="shrink-0 rounded-button border border-border px-3 py-1.5 text-xs font-medium font-text text-mist-900 transition-colors duration-200 hover:border-secondary-300 hover:bg-secondary-50 hover:text-secondary-700"
                            >
                                Show more
                            </Link>
                        )}
                    </div>
                </>
            )}
        </DashboardCard>
    );
}

function ActivityRow({ activity, now }: { activity: PlatformActivity; now: Date }) {
    const { actor, message, detail, at } = activity;

    return (
        <li className="flex items-start gap-3 py-3">
            <ActivityAvatar actor={actor} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <ActivityMessage message={message} />
                {detail && <p className="line-clamp-1 text-xs font-text text-mist-500">{detail}</p>}
                <p className="text-xs font-text text-mist-400">
                    {ACTIVITY_ACTOR_LABELS[actor.kind]} ·{" "}
                    <time dateTime={at} title={formatDayAndTime(new Date(at))}>
                        {getRelativeTimeLabel(new Date(at), now)}
                    </time>
                </p>
            </div>
        </li>
    );
}

/** Rows the shape of the log's, until it's worked out in the browser. */
export function ActivityListSkeleton({ rows = SHOWN }: { rows?: number }) {
    return (
        <ul aria-hidden className="-my-3 flex flex-col divide-y divide-border">
            {Array.from({ length: rows }, (_, index) => (
                <li key={index} className="flex items-start gap-3 py-3">
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2 pt-1">
                        <Skeleton className="h-3.5 w-4/5" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                </li>
            ))}
        </ul>
    );
}
