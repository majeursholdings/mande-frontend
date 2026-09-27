import type { ReactNode } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/ui/userAvatar";

export type NotificationListItem = {
    id: string;
    message: ReactNode;
    /** A link after the message, e.g. "View details". */
    link?: { label: string; href: string };
    timestamp: string;
    isRead: boolean;
    /** Who it's from, as their initials avatar — omit for a message from Mande itself. */
    avatarName?: string;
};

/**
 * The notifications list — in the desktop bell's dropdown and full screen on
 * phones, the same on both platforms. Each platform maps its notifications
 * to NotificationListItem.
 */
export default function NotificationsList({
    items,
    hasUnread,
    onMarkAllAsRead,
    onLinkClick,
    className,
}: {
    items: NotificationListItem[];
    hasUnread: boolean;
    onMarkAllAsRead: () => void;
    /** A link in a notification was clicked — close whatever the list is shown in. */
    onLinkClick?: () => void;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col", className)}>
            <div className="flex items-center justify-between px-1 pb-3">
                <h2 className="text-sm font-semibold font-text text-mist-950">Notifications</h2>
                <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    disabled={!hasUnread}
                    className="text-xs font-medium font-text text-secondary-600 enabled:hover:underline enabled:cursor-pointer disabled:text-mist-400"
                >
                    Mark all as read
                </button>
            </div>
            {items.length === 0 ? (
                <p className="py-8 text-center text-sm font-text text-mist-500">You&apos;re all caught up.</p>
            ) : (
                <ul className="flex flex-col divide-y divide-border">
                    {items.map((item) => (
                        <NotificationRow key={item.id} item={item} onLinkClick={onLinkClick} />
                    ))}
                </ul>
            )}
        </div>
    );
}

function NotificationRow({ item, onLinkClick }: { item: NotificationListItem; onLinkClick?: () => void }) {
    return (
        <li className="flex items-start gap-3 px-1 py-3">
            {item.avatarName ? (
                <UserAvatar name={item.avatarName} className="size-9 text-sm" />
            ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
                    <Leaf className="size-4 text-primary-600" strokeWidth={1.75} />
                </span>
            )}

            <div className="min-w-0 flex-1">
                <p className="text-sm font-text leading-snug text-mist-800">
                    {item.message}
                    {item.link && (
                        <>
                            {" "}
                            <Link href={item.link.href} onClick={onLinkClick} className="text-secondary-600 hover:underline">
                                {item.link.label}
                            </Link>
                        </>
                    )}
                </p>
                <span className="text-xs font-text text-mist-400">{item.timestamp}</span>
            </div>

            <span
                className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    item.isRead ? "border border-mist-300" : "bg-secondary-500",
                )}
                aria-hidden
            />
            {!item.isRead && <span className="sr-only">Unread</span>}
        </li>
    );
}
