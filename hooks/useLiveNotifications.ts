"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { queryKeys } from "@/lib/queryKeys";

import type { BackendNotification } from "@/lib/services/notificationService";

/**
 * Subscribes to backend live notification pushes over WebSocket.
 * Invalidates notification cache and displays a rich toast.
 */
export function useLiveNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (notification: BackendNotification) => {
      // Invalidate notification queries to refresh counter and list
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      const plainText = Array.isArray(notification.message)
        ? notification.message.map((m) => (typeof m === "string" ? m : m.text)).join("")
        : String(notification.message || "");

      // Pop toast notification
      toast.info(notification.actorName || "New notification", {
        description: plainText,
        action: notification.link
          ? {
              label: notification.link.label || "View",
              onClick: () => {
                if (notification.link?.href) window.location.href = notification.link.href;
              },
            }
          : undefined,
      });
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [queryClient]);
}
