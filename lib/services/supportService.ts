import { api } from "@/lib/api";

export type FeedbackCategory = "suggestion" | "problem" | "feedback";

export interface SendFeedbackPayload {
  category: FeedbackCategory;
  message: string;
  screenshot?: string;
}

export interface FeedbackRecord {
  id: string;
  category: FeedbackCategory;
  message: string;
  screenshot?: { url: string; name: string | null; kind: string } | null;
  sentAt: string | null;
}

export const supportService = {
  async sendFeedback(payload: SendFeedbackPayload) {
    const { data } = await api.post("/support/feedback", payload);
    return data;
  },

  async listFeedback(params: { category?: string; limit?: number; before?: string } = {}) {
    const { data } = await api.get("/support/feedback", { params });
    return data;
  },
};
