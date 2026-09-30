"use client";

import NotificationsList from "@/components/ui/notificationsList";
import { useNotifications } from "./notificationsContext";

/** The manufacturer's notifications, in the shared NotificationsList. */
export default function NotificationsPanel({
    onLinkClick,
    className,
}: {
    /** A link in a notification was clicked — close whatever the panel is shown in. */
    onLinkClick?: () => void;
    className?: string;
}) {
    const { notifications, hasUnread, markAllAsRead, markAsRead } = useNotifications();

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
            hasUnread={hasUnread}
            onMarkAllAsRead={markAllAsRead}
            onMarkAsRead={markAsRead}
            onLinkClick={onLinkClick}
            className={className}
        />
    );
}
