import { api } from "@/lib/api";

export interface BackendNotification {
  id: string;
  userId: string;
  type: string;
  actorName: string | null;
  message: Array<{ text: string; strong: boolean }>;
  link: { label: string; href: string } | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationsResponse {
  notifications: BackendNotification[];
  unreadCount: number;
}

export const notificationService = {
  async getNotifications(params?: { limit?: number; before?: string }): Promise<ListNotificationsResponse> {
    const { data } = await api.get<ListNotificationsResponse>("/notifications", { params });
    return data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.post(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.post("/notifications/read-all");
  },
};
