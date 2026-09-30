import { api } from "@/lib/api";

export interface BasicInfoPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface CompanyInfoPayload {
  companyName?: string;
  specialities?: string[];
  staffRange?: string;
  productionLeadTime?: string;
  materialsInventory?: string;
}

export interface SubmitNinPayload {
  ninNumber: string;
  image?: string;
}

export interface SubmitBusinessDocsPayload {
  companyTaxNumber?: string;
  businessLicenseNumber?: string;
}

export interface ListManufacturersQuery {
  status?: "active" | "flagged" | "suspended" | "deactivated";
  planId?: string;
  q?: string;
  limit?: number;
  before?: string;
}

export interface StaffDeletionRequestPayload {
  reason: string;
  attachments?: Array<{ publicId: string; name: string }>;
}

export interface StaffDeactivatePayload {
  reason: string;
  confirmName: string;
}

export const manufacturerService = {
  // ── Manufacturer Self-Service: Profile ───────────────────────────────

  async getProfile() {
    const { data } = await api.get("/profile");
    return data;
  },

  async updateBasicInfo(payload: BasicInfoPayload) {
    const { data } = await api.put("/profile/basic", payload);
    return data;
  },

  async updateCompanyInfo(payload: CompanyInfoPayload) {
    const { data } = await api.patch("/profile/company", payload);
    return data;
  },

  async setAvatar(publicId: string | null) {
    if (publicId) {
      const { data } = await api.put("/profile/avatar", { publicId });
      return data;
    }
    const { data } = await api.delete("/profile/avatar");
    return data;
  },

  // ── Manufacturer Self-Service: KYC & Verification ────────────────────

  async getKyc() {
    const { data } = await api.get("/kyc");
    return data;
  },

  async submitNin(payload: SubmitNinPayload) {
    const { data } = await api.put("/kyc/nin", payload);
    return data;
  },

  async submitBusinessDocuments(payload: SubmitBusinessDocsPayload) {
    const { data } = await api.put("/kyc/business", payload);
    return data;
  },

  // ── Manufacturer Self-Service: Account Standing & Appeals ────────────

  async getAccountStatus() {
    const { data } = await api.get("/account");
    return data;
  },

  async submitAppeal(payload: { message: string; attachments?: Array<{ publicId: string; name: string }> }) {
    const { data } = await api.post("/account/appeals", payload);
    return data;
  },

  // ── Staff & Admin: Manufacturers Management ─────────────────────────

  async getStaffManufacturers(params?: ListManufacturersQuery) {
    const { data } = await api.get("/manufacturers", { params });
    return data;
  },

  async getStaffManufacturer(manufacturerId: string) {
    const { data } = await api.get(`/manufacturers/${manufacturerId}`);
    return data;
  },

  async getManufacturerActivity(manufacturerId: string, params?: { limit?: number; before?: string }) {
    const { data } = await api.get(`/manufacturers/${manufacturerId}/activity`, { params });
    return data;
  },

  async changeStatus(
    manufacturerId: string,
    status: "active" | "flagged" | "suspended",
    reason?: string | null
  ) {
    const { data } = await api.post(`/manufacturers/${manufacturerId}/status`, {
      status,
      ...(reason != null ? { reason } : {}),
    });
    return data;
  },

  async decideAppeal(
    manufacturerId: string,
    appealId: string,
    decision: "approved" | "declined",
    response?: string | null
  ) {
    const { data } = await api.post(
      `/manufacturers/${manufacturerId}/appeals/${appealId}/decision`,
      {
        decision,
        ...(response != null ? { response } : {}),
      }
    );
    return data;
  },

  async requestDeletion(manufacturerId: string, payload: StaffDeletionRequestPayload) {
    const { data } = await api.post(`/manufacturers/${manufacturerId}/deletion-request`, payload);
    return data;
  },

  async declineDeletionRequest(manufacturerId: string) {
    const { data } = await api.delete(`/manufacturers/${manufacturerId}/deletion-request`);
    return data;
  },

  async getDeactivationWarnings(manufacturerId: string) {
    const { data } = await api.get(`/manufacturers/${manufacturerId}/deactivation-warnings`);
    return data;
  },

  async deactivateManufacturer(
    manufacturerId: string,
    payload: StaffDeactivatePayload,
    reauthToken?: string
  ) {
    const headers: Record<string, string> = {};
    if (reauthToken) headers["X-Reauth-Token"] = reauthToken;
    const { data } = await api.post(`/manufacturers/${manufacturerId}/deactivate`, payload, {
      headers,
    });
    return data;
  },

  async reactivateManufacturer(
    manufacturerId: string,
    reason: string,
    reauthToken?: string
  ) {
    const headers: Record<string, string> = {};
    if (reauthToken) headers["X-Reauth-Token"] = reauthToken;
    const { data } = await api.post(
      `/manufacturers/${manufacturerId}/reactivate`,
      { reason },
      { headers }
    );
    return data;
  },

  // ── Staff & Admin: KYC Document Verification Decisions ──────────────

  async getStaffManufacturerKyc(manufacturerId: string) {
    const { data } = await api.get(`/manufacturers/${manufacturerId}/kyc`);
    return data;
  },

  async decideDocumentVerification(
    manufacturerId: string,
    document: "nin" | "company-tax-number" | "business-license-number",
    decision: "verified" | "rejected",
    reason?: string | null
  ) {
    const { data } = await api.post(
      `/manufacturers/${manufacturerId}/kyc/${document}/decision`,
      {
        decision,
        ...(reason != null ? { reason } : {}),
      }
    );
    return data;
  },
};
