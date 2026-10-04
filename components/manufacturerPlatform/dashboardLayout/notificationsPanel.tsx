"use client";

import NotificationsList from "@/components/ui/notificationsList";
import { useNotifications } from "./notificationsContext";

/** The manufacturer's notifications, in the shared NotificationsList. */
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
            loading={isLoading && hasNone}
            error={isError && hasNone ? "Couldn't load your notifications. Please try again later." : undefined}
            hasUnread={hasUnread}
            onMarkAllAsRead={markAllAsRead}
            onMarkAsRead={markAsRead}
            onLinkClick={onLinkClick}
            className={className}
        />
    );
}
