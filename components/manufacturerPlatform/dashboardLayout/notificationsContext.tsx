"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type NotificationItem } from "@/constant/manufacturer";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { getSocket } from "@/lib/socket";
import { notificationService, type BackendNotification } from "@/lib/services/notificationService";

type NotificationsContextValue = {
    notifications: NotificationItem[];
    hasUnread: boolean;
    /** True until the first page of notifications has loaded. */
    isLoading: boolean;
    /** True when the notifications couldn't load. */
    isError: boolean;
    markAllAsRead: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export function toManufacturerNotification(raw: BackendNotification): NotificationItem {
    const message = Array.isArray(raw.message)
        ? raw.message.map((m) => (typeof m === "string" ? m : m.text)).join("")
        : String(raw.message || "");

    return {
        id: raw.id,
        message,
        href: raw.link?.href,
        linkLabel: raw.link?.label,
        timestamp: formatRelativeTime(raw.createdAt),
        isRead: Boolean(raw.readAt),
        avatarName: raw.actorName ?? undefined,
    };
}

/** How many the bell's list shows. */
export const POPUP_LIMIT = 10;

/**
 * Notifications marked read here, until the server's list catches up. They
 * hold only for the list they were marked against (`stamp`, the query's
 * dataUpdatedAt): once a newer list arrives, the server's word is final, so
 * a notification that came in after "mark all" never shows as read.
 */
type ReadOverride = { ids: Set<string>; all: boolean; allAt: number; stamp: number };

const NO_OVERRIDE: ReadOverride = { ids: new Set(), all: false, allAt: 0, stamp: -1 };

/** A notification that came over the socket, and when. */
type LiveNotification = { item: NotificationItem; receivedAt: number };

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [liveNotifications, setLiveNotifications] = useState<LiveNotification[]>([]);
    const [override, setOverride] = useState<ReadOverride>(NO_OVERRIDE);
    // Marked read but not yet confirmed: shown read meanwhile, put back if the server says no
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const [pendingAllAt, setPendingAllAt] = useState<number | null>(null);

    // Fetch initial notifications from backend
    const { data: apiData, isPending, isError, dataUpdatedAt } = useQuery({
        queryKey: queryKeys.notifications.list(),
        // The newest few, for the bell: every one is on the Notifications page
        queryFn: () => notificationService.getNotifications({ limit: POPUP_LIMIT }),
        staleTime: 60 * 1000,
        retry: 1,
    });
    const dataUpdatedAtRef = useRef(dataUpdatedAt);
    useEffect(() => {
        dataUpdatedAtRef.current = dataUpdatedAt;
    }, [dataUpdatedAt]);

    // Connect to WebSocket and listen for live notifications
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleNewNotification = (raw: BackendNotification) => {
            const newNotif = toManufacturerNotification(raw);

            // Prepend new notification to the live list
            setLiveNotifications((prev) => [
                { item: newNotif, receivedAt: Date.now() },
                ...prev.filter((n) => n.item.id !== newNotif.id),
            ]);

            // Toast with notification details
            toast.info(raw.actorName || "New notification", {
                description: newNotif.message,
                action: newNotif.href
                    ? {
                          label: newNotif.linkLabel || "View",
                          onClick: () => {
                              if (newNotif.href) router.push(newNotif.href);
                          },
                      }
                    : undefined,
            });

            // Invalidate React Query cache so background queries refresh
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        };

        // Read somewhere else (another tab): shown read until the refetch confirms it
        const handleReadNotification = (payload: { ids: string[] | "all" }) => {
            const stamp = dataUpdatedAtRef.current;
            setOverride((prev) => {
                const base = prev.stamp === stamp ? prev : { ...NO_OVERRIDE, stamp };
                return payload.ids === "all"
                    ? { ...base, all: true, allAt: Date.now() }
                    : { ...base, ids: new Set([...base.ids, ...(Array.isArray(payload.ids) ? payload.ids : [])]) };
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        };

        socket.on("notification:new", handleNewNotification);
        socket.on("notification:read", handleReadNotification);

        return () => {
            socket.off("notification:new", handleNewNotification);
            socket.off("notification:read", handleReadNotification);
        };
    }, [queryClient, router]);

    const baseNotifications = useMemo(() => {
        return (apiData?.notifications ?? []).map(toManufacturerNotification);
    }, [apiData]);

    // What's shown read locally, on top of what the server says
    const activeOverride = override.stamp === dataUpdatedAt ? override : NO_OVERRIDE;
    const readAllAt = Math.max(activeOverride.all ? activeOverride.allAt : 0, pendingAllAt ?? 0);
    const isLocallyRead = useCallback(
        (id: string, receivedAt: number | null) =>
            activeOverride.ids.has(id) ||
            pendingIds.has(id) ||
            // "Mark all" covers what was in the list then, not what arrived after
            (readAllAt > 0 && (receivedAt === null || receivedAt <= readAllAt)),
        [activeOverride, pendingIds, readAllAt],
    );

    // The server's copy wins once it has one: live ones only until the list includes them
    const newLive = useMemo(() => {
        const baseIds = new Set(baseNotifications.map((n) => n.id));
        return liveNotifications.filter((n) => !baseIds.has(n.item.id));
    }, [liveNotifications, baseNotifications]);

    const notifications = useMemo(
        () => [
            ...newLive.map(({ item, receivedAt }) =>
                isLocallyRead(item.id, receivedAt) ? { ...item, isRead: true } : item,
            ),
            ...baseNotifications.map((n) => (isLocallyRead(n.id, null) ? { ...n, isRead: true } : n)),
        ],
        [newLive, baseNotifications, isLocallyRead],
    );

    // From the server's unread count (it counts ones beyond the newest few), less
    // those read here since, plus ones that came in live since
    const hasUnread = useMemo(() => {
        const readHere = baseNotifications.filter((n) => !n.isRead && isLocallyRead(n.id, null)).length;
        const serverUnread = readAllAt > 0
            ? 0
            : Math.max(0, (apiData?.unreadCount ?? baseNotifications.filter((n) => !n.isRead).length) - readHere);
        const liveUnread = newLive.filter(({ item, receivedAt }) => !item.isRead && !isLocallyRead(item.id, receivedAt)).length;
        return serverUnread + liveUnread > 0;
    }, [apiData, baseNotifications, newLive, isLocallyRead, readAllAt]);

    const markAsRead = useCallback(
        async (id: string) => {
            setPendingIds((prev) => new Set([...prev, id]));
            try {
                await notificationService.markAsRead(id);
                const stamp = dataUpdatedAtRef.current;
                setOverride((prev) => {
                    const base = prev.stamp === stamp ? prev : { ...NO_OVERRIDE, stamp };
                    return { ...base, ids: new Set([...base.ids, id]) };
                });
                void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
            } catch (err) {
                toast.error(getErrorMessage(err, "Couldn't mark that notification as read. Please try again."));
            } finally {
                setPendingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            }
        },
        [queryClient],
    );

    const markAllAsRead = useCallback(async () => {
        const at = Date.now();
        setPendingAllAt(at);
        try {
            await notificationService.markAllAsRead();
            const stamp = dataUpdatedAtRef.current;
            setOverride((prev) => {
                const base = prev.stamp === stamp ? prev : { ...NO_OVERRIDE, stamp };
                return { ...base, all: true, allAt: at };
            });
            void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't mark your notifications as read. Please try again."));
        } finally {
            setPendingAllAt((current) => (current === at ? null : current));
        }
    }, [queryClient]);

    const value: NotificationsContextValue = useMemo(
        () => ({ notifications, hasUnread, isLoading: isPending, isError, markAllAsRead, markAsRead }),
        [notifications, hasUnread, isPending, isError, markAllAsRead, markAsRead],
    );

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationsProvider");
    }
    return context;
}

