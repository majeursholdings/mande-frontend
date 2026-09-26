import Link from "next/link";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTIFICATIONS, type NotificationItem } from "@/constant/manufacturer";
import UserAvatar from "./userAvatar";

export default function NotificationsPanel({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-col", className)}>
            <div className="flex items-center justify-between px-1 pb-3">
                <h2 className="text-sm font-semibold font-text text-mist-950">Notifications</h2>
                <button
                    type="button"
                    className="text-xs font-medium font-text text-secondary-600 hover:underline cursor-pointer"
                >
                    Mark all as read
                </button>
            </div>
            <ul className="flex flex-col divide-y divide-border">
                {NOTIFICATIONS.map((notification) => (
                    <NotificationRow key={notification.id} notification={notification} />
                ))}
            </ul>
        </div>
    );
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
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
