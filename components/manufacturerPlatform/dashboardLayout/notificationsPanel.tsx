"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/constant/manufacturer";
import { useNotifications } from "./notificationsContext";
import UserAvatar from "./userAvatar";

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
            <div className="flex items-center justify-between px-1 pb-3">
                <h2 className="text-sm font-semibold font-text text-mist-950">Notifications</h2>
                <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={!hasUnread}
                    className="text-xs font-medium font-text text-secondary-600 enabled:hover:underline enabled:cursor-pointer disabled:text-mist-400"
                >
                    Mark all as read
                </button>
            </div>
            <ul className="flex flex-col divide-y divide-border">
                {notifications.map((notification) => (
                    <NotificationRow
                        key={notification.id}
                        notification={notification}
                        onLinkClick={onLinkClick}
                    />
                ))}
            </ul>
        </div>
    );
}

function NotificationRow({
    notification,
    onLinkClick,
}: {
    notification: NotificationItem;
    onLinkClick?: () => void;
}) {
    return (
        <li className="flex items-start gap-3 px-1 py-3">
            {notification.avatarName ? (
                <UserAvatar name={notification.avatarName} className="size-9 text-sm" />
            ) : (
                <span className="flex items-center justify-center size-9 rounded-full bg-primary-50 shrink-0">
                    <Leaf className="size-4 text-primary-600" strokeWidth={1.75} />
                </span>
            )}

            <div className="min-w-0 flex-1">
                <p className="text-sm font-text text-mist-800 leading-snug">
                    {notification.message}
                    {notification.linkLabel && notification.href && (
                        <>
                            {" "}
                            <Link
                                href={notification.href}
                                onClick={onLinkClick}
                                className="text-secondary-600 hover:underline"
                            >
                                {notification.linkLabel}
                            </Link>
                        </>
                    )}
                </p>
                <span className="text-xs text-mist-400 font-text">{notification.timestamp}</span>
            </div>

            <span
                className={cn(
                    "mt-1.5 size-2 rounded-full shrink-0",
                    notification.isRead ? "border border-mist-300" : "bg-secondary-500",
                )}
                aria-hidden
            />
        </li>
    );
}
