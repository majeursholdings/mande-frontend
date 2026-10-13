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

export interface FeedbackPage {
  feedback: FeedbackRecord[];
  /** Where the next, older page starts; null on the last page. */
  nextBefore: string | null;
}

export const supportService = {
  async sendFeedback(payload: SendFeedbackPayload) {
    const { data } = await api.post("/support/feedback", payload);
    return data;
  },

  async listFeedback(params: { category?: string; limit?: number; before?: string } = {}): Promise<FeedbackPage> {
    const { data } = await api.get<FeedbackPage>("/support/feedback", { params });
    return data;
  },
};
