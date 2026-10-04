"use client";

import {
    DataTable,
    TableToolbar,
    useTableRows,
    type ColumnDef,
    type SelectFilterItem,
} from "@/components/customTable";
import { formatDayAndTime, getRelativeTimeLabel } from "@/lib/date";
import AdminPageHeader from "@/components/adminPlatform/pageHeader";
import { SUPER_ADMIN_REPORTING_URL } from "@/constant/superAdmin";
import { ActivityAvatar, ActivityMessage } from "../activity/activityParts";
import {
    ACTIVITY_ACTOR_LABELS,
    ACTIVITY_CATEGORIES,
    getActivityCategoryLabel,
    usePlatformActivity,
    type ActivityActor,
    type ActivityCategory,
    type PlatformActivity,
} from "../activity/platformActivity";

/** The dashboard card's "Show more" links here with ?activity_type=<category>. */
const TABLE_ID = "activity";

type ActivityRow = {
    id: string;
    at: string;
    category: ActivityCategory;
    actorKind: ActivityActor["kind"];
    /** The sentence and its detail, for search. */
    text: string;
    activity: PlatformActivity;
};

const ACTOR_ITEMS: SelectFilterItem[] = [
    { label: "Admins", value: "admin" },
    { label: "Manufacturers", value: "manufacturer" },
    { label: "Automatic", value: "system" },
];

function toRow(activity: PlatformActivity): ActivityRow {
    const sentence = activity.message.map((part) => (typeof part === "string" ? part : part.strong)).join("");
    return {
        id: activity.id,
        at: activity.at,
        category: activity.category,
        actorKind: activity.actor.kind,
        text: [sentence, activity.detail].filter(Boolean).join(" "),
        activity,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminActivityLogPage: everything that's happened on the platform
// (the API's activity feed, see usePlatformActivity), newest first: search
// it, filter it by kind or by who did it, and page back through it. Under
// Reporting.
// ─────────────────────────────────────────────────────────────────────────────

export default function SuperAdminActivityLogPage() {
    const feed = usePlatformActivity();
    const now = new Date();

    const { rows, pagination } = useTableRows({
        tableId: TABLE_ID,
        data: feed.activity.map(toRow),
        searchFields: ["text"],
        filters: [
            { paramKey: "type", field: "category" },
            { paramKey: "by", field: "actorKind" },
        ],
        sortField: "at",
        rowsPerPage: 20,
    });

    const columns: ColumnDef<ActivityRow>[] = [
        {
            key: "activity",
            header: "Activity",
            className: "min-w-72 whitespace-normal",
            cell: ({ activity }) => (
                <span className="flex items-start gap-3">
                    <ActivityAvatar actor={activity.actor} className="size-8" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                        <ActivityMessage message={activity.message} />
                        {activity.detail && (
                            <span className="line-clamp-2 text-xs text-mist-500">{activity.detail}</span>
                        )}
                        {/* Who and when, where their columns don't fit */}
                        <span className="text-xs text-mist-400 md:hidden">
                            {ACTIVITY_ACTOR_LABELS[activity.actor.kind]} · {getRelativeTimeLabel(new Date(activity.at), now)}
                        </span>
                    </span>
                </span>
            ),
        },
        {
            key: "by",
            header: "By",
            className: "hidden md:table-cell",
            cell: ({ actorKind }) => <span className="text-mist-600">{ACTIVITY_ACTOR_LABELS[actorKind]}</span>,
        },
        {
            key: "type",
            header: "Type",
            className: "hidden lg:table-cell",
            cell: ({ category }) => (
                <span className="rounded-full bg-mist-100 px-2 py-0.5 text-xs font-medium text-mist-700">
                    {getActivityCategoryLabel(category)}
                </span>
            ),
        },
        {
            key: "date",
            header: "Date",
            className: "hidden md:table-cell",
            cell: ({ at }) => (
                <span className="flex flex-col">
                    <time dateTime={at} className="text-mist-900">
                        {formatDayAndTime(new Date(at))}
                    </time>
                    <span className="text-xs text-mist-400">{getRelativeTimeLabel(new Date(at), now)}</span>
                </span>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-2">
            <AdminPageHeader
                title="Activity Log"
                description="Everything admins, manufacturers and Mande do on the platform, newest first."
                backLink={{ href: SUPER_ADMIN_REPORTING_URL, label: "Reporting" }}
            />

            <DataTable
                tableId={TABLE_ID}
                columns={columns}
                rows={rows}
                pagination={pagination}
                loading={feed.isPending}
                error={feed.isError ? "Couldn't load the activity. Please refresh to try again." : undefined}
                emptyMessage="No activity matches your search."
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search by name, job or account" }}
                        filters={[
                            { title: "Type", paramKey: "type", items: ACTIVITY_CATEGORIES },
                            { title: "By", paramKey: "by", items: ACTOR_ITEMS },
                        ]}
                        dateSort
                    />
                }
            />
        </div>
    );
}
