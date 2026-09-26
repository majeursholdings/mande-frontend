"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { NOTIFICATIONS, type NotificationItem } from "@/constant/manufacturer";

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsProvider — the dashboard's notifications, shared by the desktop
// and mobile top bars so the bell's unread dot and the panel stay in sync.
// Seeded from sample data and updated locally for now; once the backend and
// websocket are connected, load the list from the API, push incoming
// notifications in from the socket, and persist "mark all as read" here.
// ─────────────────────────────────────────────────────────────────────────────

type NotificationsContextValue = {
    notifications: NotificationItem[];
    hasUnread: boolean;
    markAllAsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState(NOTIFICATIONS);
    const hasUnread = notifications.some((n) => !n.isRead);

    const markAllAsRead = () =>
        setNotifications((current) => current.map((n) => ({ ...n, isRead: true })));

    return (
        <NotificationsContext.Provider value={{ notifications, hasUnread, markAllAsRead }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (!context) {
        throw new Error("useNotifications must be used within a NotificationsProvider");
    }
    return context;
}
