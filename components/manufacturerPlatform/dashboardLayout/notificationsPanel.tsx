"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import NotificationsList from "@/components/ui/notificationsList";
import { MANUFACTURER_NOTIFICATIONS_URL } from "@/constant/manufacturer";
import { POPUP_LIMIT, useNotifications } from "./notificationsContext";

/** The manufacturer's newest notifications, in the shared NotificationsList, and a way to every one. */
export default function NotificationsPanel({
    onLinkClick,
    className,
}: {
    /** A link in a notification was clicked: close whatever the panel is shown in. */
    onLinkClick?: () => void;
    className?: string;
}) {
    const { notifications, hasUnread, isLoading, isError, markAllAsRead, markAsRead } = useNotifications();
    // Ones that arrived live still show while the list loads or if it failed
    const hasNone = notifications.length === 0;

    return (
        <NotificationsList
            // The newest few (live ones included): the rest are on the Notifications page
            items={notifications.slice(0, POPUP_LIMIT).map((notification) => ({
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
            loading={isLoading && hasNone}
            error={isError && hasNone ? "Couldn't load your notifications. Please try again later." : undefined}
            hasUnread={hasUnread}
            onMarkAllAsRead={markAllAsRead}
            onMarkAsRead={markAsRead}
            onLinkClick={onLinkClick}
            className={className}
            footer={
                <Link
                    href={MANUFACTURER_NOTIFICATIONS_URL}
                    onClick={onLinkClick}
                    className="mt-1 flex items-center justify-center gap-1.5 border-t border-border px-1 pt-3 text-sm font-medium font-text text-secondary-700 hover:underline"
                >
                    See all notifications
                    <ArrowRight className="size-4" aria-hidden />
                </Link>
            }
        />
    );
}
