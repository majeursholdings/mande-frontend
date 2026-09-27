"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/ui/userAvatar";
import type { AdminNotification } from "@/constant/admin";
import { useNotifications } from "./notificationsContext";

/** The notifications list — in the desktop bell's popover, and full screen on phones. */
export default function NotificationsPanel({
    onLinkClick,
    className,
}: {
    /** A link in a notification was clicked — close whatever the panel is shown in. */
    onLinkClick?: () => void;
    className?: string;
}) {
    const { notifications, hasUnread, markAllAsRead } = useNotifications();

    return (
        <div className={cn("flex flex-col", className)}>
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <h2 className="text-lg font-semibold font-text text-mist-950">Notifications</h2>
                <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={!hasUnread}
                    className="text-sm font-text text-mist-500 enabled:hover:text-mist-900 enabled:cursor-pointer disabled:text-mist-300"
                >
                    Mark all as read
                </button>
            </div>
            {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm font-text text-mist-500">
                    You&apos;re all caught up.
                </p>
            ) : (
                <ul className="flex flex-col">
                    {notifications.map((notification) => (
                        <NotificationRow
                            key={notification.id}
                            notification={notification}
                            onLinkClick={onLinkClick}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

function NotificationRow({
    notification,
    onLinkClick,
}: {
    notification: AdminNotification;
    onLinkClick?: () => void;
}) {
    return (
        <li className="flex items-start gap-3 py-3">
            <UserAvatar name={notification.actorName} className="size-8 text-xs" />

            <div className="min-w-0 flex-1">
                <p className="text-sm font-text leading-snug text-mist-800">
                    {notification.message.map((part, index) =>
                        typeof part === "string" ? (
                            part
                        ) : (
                            <strong key={index} className="font-medium text-mist-950">
                                {part.strong}
                            </strong>
                        ),
                    )}
                    {notification.link && (
                        <>
                            {" "}
                            <Link
                                href={notification.link.href}
                                onClick={onLinkClick}
                                className="ml-1 text-secondary-600 underline underline-offset-4 hover:text-secondary-800"
                            >
                                {notification.link.label}
                            </Link>
                        </>
                    )}
                </p>
                <span className="text-xs font-text text-mist-400">{notification.timestamp}</span>
            </div>

            {/* Unread: a red dot in the ring — announced as "Unread" for screen readers */}
            <span
                className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-mist-200"
                aria-hidden
            >
                {!notification.isRead && <span className="size-1.5 rounded-full bg-error-600" />}
            </span>
            {!notification.isRead && <span className="sr-only">Unread</span>}
        </li>
    );
}
