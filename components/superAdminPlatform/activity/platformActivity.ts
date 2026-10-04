"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdminNotificationPart } from "@/constant/admin";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService, type ActivityFeedEntry } from "@/lib/services/reportsService";

// ─────────────────────────────────────────────────────────────────────────────
// Everything that happens on the platform, for the super admin's activity
// log: the API's /activity feed (the audit trail), newest first.
// ─────────────────────────────────────────────────────────────────────────────

export type ActivityCategory = "jobs" | "payments" | "accounts" | "feedback";

export const ACTIVITY_CATEGORIES: { value: ActivityCategory; label: string }[] = [
    { value: "jobs", label: "Jobs" },
    { value: "payments", label: "Payments" },
    { value: "accounts", label: "Accounts" },
    { value: "feedback", label: "Feedback" },
];

export const getActivityCategoryLabel = (category: ActivityCategory) =>
    ACTIVITY_CATEGORIES.find((option) => option.value === category)?.label ?? category;

type PersonActor = { kind: "admin" | "manufacturer"; name: string; avatarUrl: string | null };

/** Who did it: a person, or Mande itself (automatic approvals and payments). */
export type ActivityActor = PersonActor | { kind: "system" };

export const ACTIVITY_ACTOR_LABELS: Record<ActivityActor["kind"], string> = {
    admin: "Admin",
    manufacturer: "Manufacturer",
    system: "Automatic",
};

export type PlatformActivity = {
    id: string;
    /** ISO date. */
    at: string;
    category: ActivityCategory;
    actor: ActivityActor;
    /** Starts with who did it. `{ strong }` parts are the people, jobs and accounts it's about. */
    message: AdminNotificationPart[];
    /** A line under it: a reason, a device, what was written. */
    detail: string | null;
};

/** A feed entry as the log shows it: people with their photo (or initials, without one). */
function toPlatformActivity(entry: ActivityFeedEntry): PlatformActivity {
    return {
        id: entry.id,
        at: entry.at,
        category: entry.category,
        actor: entry.actor.kind === "system" ? { kind: "system" } : { kind: entry.actor.kind, name: entry.actor.name, avatarUrl: entry.actor.avatarUrl },
        message: entry.message,
        detail: entry.detail,
    };
}

/**
 * The activity log, newest first: its latest 1,000 entries (see
 * getAllActivityLogs), shared by the dashboard's card and the Activity Log
 * page, which search, filter and page it in the browser.
 */
export function usePlatformActivity() {
    const query = useQuery({
        queryKey: queryKeys.reports.activity({ all: true }),
        queryFn: () => reportsService.getAllActivityLogs(),
        staleTime: 30_000,
    });
    return {
        activity: (query.data ?? []).map(toPlatformActivity),
        isPending: query.isPending,
        isError: query.isError,
    };
}
