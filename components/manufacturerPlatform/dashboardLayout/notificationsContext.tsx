"use client";

import { createContext, useCallback, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type NotificationItem } from "@/constant/manufacturer";
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

function toManufacturerNotification(raw: BackendNotification): NotificationItem {
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

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [liveNotifications, setLiveNotifications] = useState<NotificationItem[]>([]);
    const [locallyReadIds, setLocallyReadIds] = useState<Set<string>>(new Set());
    const [allLocallyRead, setAllLocallyRead] = useState(false);

    // Fetch initial notifications from backend
    const { data: apiData, isPending, isError } = useQuery({
        queryKey: queryKeys.notifications.list(),
        queryFn: () => notificationService.getNotifications({ limit: 50 }),
        staleTime: 60 * 1000,
        retry: 1,
    });

    // Connect to WebSocket and listen for live notifications
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleNewNotification = (raw: BackendNotification) => {
            const newNotif = toManufacturerNotification(raw);

            // Prepend new notification to the live list
            setLiveNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);

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

        const handleReadNotification = (payload: { ids: string[] | "all" }) => {
            if (payload.ids === "all") {
                setAllLocallyRead(true);
            } else if (Array.isArray(payload.ids)) {
                setLocallyReadIds((prev) => new Set([...prev, ...payload.ids]));
            }
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

    const notifications = useMemo(() => {
        const liveIds = new Set(liveNotifications.map((n) => n.id));
        const merged = [...liveNotifications, ...baseNotifications.filter((n) => !liveIds.has(n.id))];

        if (allLocallyRead) {
            return merged.map((n) => ({ ...n, isRead: true }));
        }
        if (locallyReadIds.size > 0) {
            return merged.map((n) => (locallyReadIds.has(n.id) ? { ...n, isRead: true } : n));
        }
        return merged;
    }, [liveNotifications, baseNotifications, allLocallyRead, locallyReadIds]);

    const hasUnread = useMemo(() => {
        return notifications.some((n) => !n.isRead);
    }, [notifications]);

    const markAsRead = useCallback(
        async (id: string) => {
            setLocallyReadIds((prev) => new Set([...prev, id]));
            try {
                await notificationService.markAsRead(id);
                queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
            } catch (err) {
                console.error("Failed to mark notification read on backend:", err);
            }
        },
        [queryClient],
    );

    const markAllAsRead = useCallback(async () => {
        setAllLocallyRead(true);
        try {
            await notificationService.markAllAsRead();
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        } catch (err) {
            console.error("Failed to mark notifications read on backend:", err);
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

