import { api } from "@/lib/api";

/** What the website's contact form sends (POST /contact). */
export interface ContactMessagePayload {
  firstName: string;
  lastName: string;
  email: string;
  /** Left out when they didn't give one. */
  phone?: string;
  /** A CONTACT_TOPIC_OPTIONS value. */
  topic: string;
  message: string;
  agreeToPrivacyPolicy: true;
}

/** A message from the contact form, as super admins see it. */
export interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  /** A CONTACT_TOPIC_OPTIONS value. */
  topic: string;
  message: string;
  /** ISO dates. */
  sentAt: string;
  /** Null while it waits on the Actions page. */
  resolvedAt: string | null;
  resolvedByName: string | null;
}

export const contactService = {
  /** Sends a message to the MANDE team. Nothing comes back (204). */
  async sendMessage(payload: ContactMessagePayload): Promise<void> {
    await api.post("/contact", payload);
  },

  /** Super admins: messages waiting (or dealt with), newest first. */
  async listMessages(status: "open" | "resolved" = "open", limit = 50) {
    const { data } = await api.get<{ contactMessages: ContactMessage[]; nextBefore: string | null }>(
      "/contact-messages",
      { params: { status, limit } }
    );
    return data;
  },

  /** Super admins: they've replied, so it leaves the Actions page. */
  async resolveMessage(messageId: string): Promise<ContactMessage> {
    const { data } = await api.post<{ contactMessage: ContactMessage }>(
      `/contact-messages/${messageId}/resolve`
    );
    return data.contactMessage;
  },
};
