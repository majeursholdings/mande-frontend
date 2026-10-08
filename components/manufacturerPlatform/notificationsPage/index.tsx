"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import NotificationsList from "@/components/ui/notificationsList";
import { MANUFACTURER_PROFILE_BACK_LINK } from "@/constant/manufacturer";
import { queryKeys } from "@/lib/queryKeys";
import { notificationService } from "@/lib/services/notificationService";
import { toManufacturerNotification, useNotifications } from "../dashboardLayout/notificationsContext";
import PageHeader from "../pageHeader";

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Every notification, newest first, a page at a time (the bell shows only the
// newest few and links here). Marking read goes through the bell's own
// actions, so the two always agree.
// ─────────────────────────────────────────────────────────────────────────────

export default function ManufacturerNotificationsPage() {
    const { markAllAsRead, markAsRead } = useNotifications();
    const query = useInfiniteQuery({
        queryKey: queryKeys.notifications.list({ page: "all" }),
        queryFn: ({ pageParam }) => notificationService.getNotifications({ limit: PAGE_SIZE, before: pageParam ?? undefined }),
        initialPageParam: null as string | null,
        // Older ones are before the last one shown; a short page means there are none
        getNextPageParam: (last) => (last.notifications.length < PAGE_SIZE ? null : (last.notifications.at(-1)?.createdAt ?? null)),
    });

    const notifications = (query.data?.pages ?? []).flatMap((page) => page.notifications).map(toManufacturerNotification);
    const unreadCount = query.data?.pages[0]?.unreadCount ?? 0;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="Notifications" description="Everything we've told you, newest first." backLink={MANUFACTURER_PROFILE_BACK_LINK} />

            <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 sm:p-5">
                <NotificationsList
                    items={notifications.map((notification) => ({
                        id: notification.id,
                        message: notification.message,
                        link:
                            notification.linkLabel && notification.href
                                ? { label: notification.linkLabel, href: notification.href }
                                : undefined,
                        timestamp: notification.timestamp,
                        isRead: notification.isRead,
                        avatarName: notification.avatarName,
                    }))}
                    loading={query.isPending}
                    error={query.isError ? "Couldn't load your notifications. Please refresh the page." : undefined}
                    hasUnread={unreadCount > 0}
                    onMarkAllAsRead={markAllAsRead}
                    onMarkAsRead={markAsRead}
                />
                {query.hasNextPage && (
                    <button
                        type="button"
                        onClick={() => void query.fetchNextPage()}
                        disabled={query.isFetchingNextPage}
                        className="self-center text-sm font-medium font-text text-secondary-700 hover:underline disabled:opacity-60"
                    >
                        {query.isFetchingNextPage ? "Loading..." : "Show older"}
                    </button>
                )}
            </div>
        </div>
    );
}
