import type { ReactNode } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/ui/userAvatar";
import { Skeleton } from "@/components/ui/skeleton";

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
    onMarkAsRead,
    className,
    loading = false,
    error,
}: {
    items: NotificationListItem[];
    /** Still loading: skeleton rows under the real heading. */
    loading?: boolean;
    /** Couldn't load: shown in place of the list. */
    error?: ReactNode;
    hasUnread: boolean;
    onMarkAllAsRead: () => void;
    /** A link in a notification was clicked — close whatever the list is shown in. */
    onLinkClick?: () => void;
    onMarkAsRead?: (id: string) => void;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col", className)}>
            <div className="flex items-center justify-between px-1 pb-3">
                <h2 className="text-sm font-semibold font-text text-mist-950">Notifications</h2>
                <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    disabled={loading || !hasUnread}
                    className="text-xs font-medium font-text text-secondary-600 enabled:hover:underline enabled:cursor-pointer disabled:text-mist-400"
                >
                    Mark all as read
                </button>
            </div>
            {loading ? (
                <ul className="flex flex-col divide-y divide-border" aria-busy>
                    {Array.from({ length: 4 }, (_, i) => (
                        <li key={i} className="flex items-start gap-3 px-1 py-3">
                            <Skeleton className="size-9 shrink-0 rounded-full" />
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-14" />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : error ? (
                <p role="alert" className="py-8 text-center text-sm font-text text-error-600">{error}</p>
            ) : items.length === 0 ? (
                <p className="py-8 text-center text-sm font-text text-mist-500">You&apos;re all caught up.</p>
            ) : (
                <ul className="flex flex-col divide-y divide-border">
                    {items.map((item) => (
                        <NotificationRow
                            key={item.id}
                            item={item}
                            onLinkClick={onLinkClick}
                            onMarkAsRead={onMarkAsRead}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

function NotificationRow({
    item,
    onLinkClick,
    onMarkAsRead,
}: {
    item: NotificationListItem;
    onLinkClick?: () => void;
    onMarkAsRead?: (id: string) => void;
}) {
    const handleClick = () => {
        if (!item.isRead && onMarkAsRead) {
            onMarkAsRead(item.id);
        }
    };

    const handleLinkClick = () => {
        if (!item.isRead && onMarkAsRead) {
            onMarkAsRead(item.id);
        }
        onLinkClick?.();
    };

    return (
        <li
            onClick={handleClick}
            className={cn(
                "flex items-start gap-3 px-1 py-3 transition-colors",
                !item.isRead && "cursor-pointer hover:bg-mist-50/50",
            )}
        >
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
                            <Link
                                href={item.link.href}
                                onClick={handleLinkClick}
                                className="text-secondary-600 hover:underline"
                            >
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
