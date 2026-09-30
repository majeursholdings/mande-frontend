import { api } from "@/lib/api";

export interface StaffBasicInfoPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface StaffNotificationsPayload {
  applications?: { "in-app"?: boolean; email?: boolean };
  reviews?: { "in-app"?: boolean; email?: boolean };
  delays?: { "in-app"?: boolean; email?: boolean };
  "job-responses"?: { "in-app"?: boolean; email?: boolean };
  appeals?: { "in-app"?: boolean; email?: boolean };
  chats?: { "in-app"?: boolean; email?: boolean };
  [key: string]: { "in-app"?: boolean; email?: boolean } | undefined;
}

export interface ProjectLeadsQuery {
  q?: string;
  status?: "active" | "deactivated" | "pending_verification";
  position?: string;
}

export const staffService = {
  // ── Staff Profile ──────────────────────────────────────────────────

  async getProfile() {
    const { data } = await api.get("/staff/profile");
    return data;
  },

  async updateBasicInfo(payload: StaffBasicInfoPayload) {
    const { data } = await api.put("/staff/profile/basic", payload);
    return data;
  },

  async setAvatar(publicId: string | null) {
    if (publicId) {
      const { data } = await api.put("/staff/profile/avatar", { publicId });
      return data;
    }
    const { data } = await api.delete("/staff/profile/avatar");
    return data;
  },

  async updateNotifications(payload: StaffNotificationsPayload) {
    const { data } = await api.put("/staff/profile/notifications", payload);
    return data;
  },

  // ── Project Leads Directory & Management ───────────────────────────

  async getProjectLeads(params: ProjectLeadsQuery = {}) {
    const { data } = await api.get("/project-leads", { params });
    return data;
  },

  async getProjectLead(leadId: string) {
    const { data } = await api.get(`/project-leads/${leadId}`);
    return data;
  },

  async updateProjectLead(
    leadId: string,
    payload: { firstName?: string; lastName?: string; phone?: string; position?: string },
    reauthToken: string
  ) {
    const { data } = await api.patch(`/project-leads/${leadId}`, payload, {
      headers: { "X-Reauth-Token": reauthToken },
    });
    return data;
  },

  async getDeactivationWarnings(leadId: string) {
    const { data } = await api.get(`/project-leads/${leadId}/deactivation-warnings`);
    return data;
  },

  async deactivateProjectLead(
    leadId: string,
    payload: { reason: string; replacementLeadId?: string },
    reauthToken: string
  ) {
    const { data } = await api.post(`/project-leads/${leadId}/deactivate`, payload, {
      headers: { "X-Reauth-Token": reauthToken },
    });
    return data;
  },

  async reactivateProjectLead(leadId: string, reauthToken: string) {
    const { data } = await api.post(
      `/project-leads/${leadId}/reactivate`,
      {},
      { headers: { "X-Reauth-Token": reauthToken } }
    );
    return data;
  },
};
