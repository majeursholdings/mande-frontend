"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ADMIN_NOTIFICATIONS, type AdminNotification } from "@/constant/admin";

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsProvider — the admin's notifications, shared by the desktop
// and mobile top bars so the bell's unread dot and the panel stay in sync.
// Seeded from sample data and updated locally for now; once the backend is
// connected, load them from the API and persist "mark all as read" there.
// ─────────────────────────────────────────────────────────────────────────────

type NotificationsContextValue = {
    notifications: AdminNotification[];
    hasUnread: boolean;
    markAllAsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState(ADMIN_NOTIFICATIONS);
    const hasUnread = notifications.some((notification) => !notification.isRead);

    const markAllAsRead = () =>
        setNotifications((current) =>
            current.map((notification) => ({ ...notification, isRead: true })),
        );

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
