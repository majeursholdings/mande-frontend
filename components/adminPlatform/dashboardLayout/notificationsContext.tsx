"use client";

import { createContext, useCallback, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AdminNotification, AdminNotificationPart } from "@/constant/admin";
import { queryKeys } from "@/lib/queryKeys";
import { getSocket } from "@/lib/socket";
import { notificationService, type BackendNotification } from "@/lib/services/notificationService";
import { useAdminProfile } from "./adminProfileContext";

type NotificationsContextValue = {
    notifications: AdminNotification[];
    hasUnread: boolean;
    /** True while the first load of the notifications is in flight (show skeleton rows). */
    isLoading: boolean;
    /** True when the notifications couldn't be loaded. */
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

function toAdminNotification(raw: BackendNotification): AdminNotification {
    const messageParts: AdminNotificationPart[] = Array.isArray(raw.message)
        ? raw.message.map((part) =>
              typeof part === "string" ? part : part.strong ? { strong: part.text } : part.text,
          )
        : [String(raw.message || "")];

    return {
        id: raw.id,
        type: (raw.type as AdminNotification["type"]) || "reviews",
        actorName: raw.actorName || "Mande",
        message: messageParts,
        link: raw.link ? { label: raw.link.label, href: raw.link.href } : undefined,
        timestamp: formatRelativeTime(raw.createdAt),
        isRead: Boolean(raw.readAt),
    };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { profile } = useAdminProfile();

    const [liveNotifications, setLiveNotifications] = useState<AdminNotification[]>([]);
    const [locallyReadIds, setLocallyReadIds] = useState<Set<string>>(new Set());
    const [allLocallyRead, setAllLocallyRead] = useState(false);

    // Fetch initial notifications from backend
    const { data: apiData, isPending, isError } = useQuery({
        queryKey: queryKeys.notifications.list(),
        queryFn: () => notificationService.getNotifications({ limit: 50 }),
        staleTime: 60 * 1000,
        retry: 1,
    });

    // Check whether an in-app notification is enabled for this type according to user preferences
    const isTypeAllowedInApp = useMemo(() => {
        return (type: string) => {
            const prefs = profile.notificationPreferences;
            if (!prefs) return true;
            const channelPref = (prefs as Record<string, Record<string, boolean> | undefined>)?.[type];
            if (!channelPref) return true;
            return channelPref["in-app"] !== false;
        };
    }, [profile.notificationPreferences]);

    // Connect to WebSocket and listen for live notifications
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleNewNotification = (raw: BackendNotification) => {
            const newNotif = toAdminNotification(raw);

            // User preference check: if the user turned off in-app for this type, do not show or toast
            if (!isTypeAllowedInApp(newNotif.type)) {
                return;
            }

            // Prepend new notification to the live list
            setLiveNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);

            // Toast with notification details
            const plainMsg = Array.isArray(raw.message)
                ? raw.message.map((m) => (typeof m === "string" ? m : m.text)).join("")
                : String(raw.message || "");

            toast.info(raw.actorName || "New notification", {
                description: plainMsg,
                action: newNotif.link
                    ? {
                          label: newNotif.link.label || "View",
                          onClick: () => {
                              if (newNotif.link?.href) router.push(newNotif.link.href);
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
    }, [isTypeAllowedInApp, queryClient, router]);

    const baseNotifications = useMemo(() => {
        return (apiData?.notifications ?? []).map(toAdminNotification);
    }, [apiData]);

    // Combine live socket notifications, fetched API notifications, and apply read state
    const allNotifications = useMemo(() => {
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

    // Filter displayed notifications based on user's active in-app preferences
    const notifications = useMemo(() => {
        return allNotifications.filter((n) => isTypeAllowedInApp(n.type));
    }, [allNotifications, isTypeAllowedInApp]);

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

    // Socket notifications can arrive before the first load; show those rather than skeletons
    const hasLiveNotifications = liveNotifications.length > 0;
    const isLoading = isPending && !hasLiveNotifications;
    const isLoadError = isError && !hasLiveNotifications;

    const value: NotificationsContextValue = useMemo(
        () => ({ notifications, hasUnread, isLoading, isError: isLoadError, markAllAsRead, markAsRead }),
        [notifications, hasUnread, isLoading, isLoadError, markAllAsRead, markAsRead],
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

