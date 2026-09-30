"use client";

import NotificationsList from "@/components/ui/notificationsList";
import { useNotifications } from "./notificationsContext";

/** The admin's notifications, in the shared NotificationsList — names they're about in bold. */
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
                message: notification.message.map((part, index) =>
                    typeof part === "string" ? (
                        part
                    ) : (
                        <strong key={index} className="font-medium text-mist-950">
                            {part.strong}
                        </strong>
                    ),
                ),
                link: notification.link,
                timestamp: notification.timestamp,
                isRead: notification.isRead,
                avatarName: notification.actorName,
            }))}
            hasUnread={hasUnread}
            onMarkAllAsRead={markAllAsRead}
            onMarkAsRead={markAsRead}
            onLinkClick={onLinkClick}
            className={className}
        />
    );
}
