"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { queryKeys } from "@/lib/queryKeys";

interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  link?: string;
  type: string;
}

/**
 * Subscribes to backend live notification pushes over WebSocket.
 * Invalidates notification cache and displays a rich toast.
 */
export function useLiveNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (notification: NotificationPayload) => {
      // Invalidate notification queries to refresh counter and list
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });

      // Pop toast notification
      toast.info(notification.title, {
        description: notification.body,
        action: notification.link
          ? {
              label: "View",
              onClick: () => {
                if (notification.link) window.location.href = notification.link;
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
