import { api } from "@/lib/api";
import type { SupportFeedbackRecord } from "@/constant/platformRecords";

export interface BasicInfoPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface CompanyInfoPayload {
  companyName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
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

/** A file the API keeps (private ones come with a short-lived link). */
export interface ApiMedia {
  url: string | null;
  name: string | null;
  kind: "document" | "image";
  publicId: string;
}

/** The manufacturer's own standing: flagged or suspended, and their appeals (newest first). */
export interface AccountStanding {
  accountStatus: "active" | "flagged" | "suspended";
  statusHistory: { status: "active" | "flagged" | "suspended"; reason: string | null; byName: string; at: string }[];
  appeals: {
    id: string;
    message: string;
    attachments: (ApiMedia | null)[];
    sentAt: string;
    status: "pending" | "approved" | "declined";
    response: string | null;
    decidedByName: string | null;
    decidedAt: string | null;
  }[];
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

/** One entry in a manufacturer's account activity, from the activity log. */
export type ManufacturerActivityEntry = {
  id: string;
  /** ISO date. */
  at: string;
  /** e.g. "auth.password_reset". */
  action: string;
  /** What happened, in a sentence. */
  summary: string;
  actorName: string;
  /** They did it themselves (else a staff member did, named in actorName). */
  byThem: boolean;
  device: string | null;
};

export const manufacturerService = {
  // Manufacturer Self-Service: Profile

  async getDashboard() {
    const { data } = await api.get<{
      dashboard: {
        jobs: { total: number; active: number };
        wallet: { totalMadeKobo: number; balanceKobo: number };
        /** Null before there's a finished job to count. */
        deliveryRate: { user: number | null; platform: number | null };
        /** Over completed jobs only; null before one is rated. */
        starRate: { user: number | null; platform: number | null };
      };
    }>("/manufacturer/dashboard");
    return data.dashboard;
  },

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

  async getAccountStatus(): Promise<{ account: AccountStanding }> {
    const { data } = await api.get<{ account: AccountStanding }>("/account");
    return data;
  },

  /** Only while suspended, one at a time. Answers with the standing, the new appeal first. */
  async submitAppeal(payload: {
    message: string;
    attachments?: Array<{ publicId: string; name: string }>;
  }): Promise<{ account: AccountStanding }> {
    const { data } = await api.post<{ account: AccountStanding }>("/account/appeals", payload);
    return data;
  },

  // ── Staff & Admin: Manufacturers Management ─────────────────────────

  async getStaffManufacturers(params?: ListManufacturersQuery) {
    const { data } = await api.get("/manufacturers", { params });
    return data;
  },

  async getStaffManufacturer(manufacturerId: string) {
    const { data } = await api.get(`/manufacturers/${encodeURIComponent(manufacturerId)}`);
    return data;
  },

  async getManufacturerActivity(
    manufacturerId: string,
    params?: { limit?: number; before?: string }
  ): Promise<{ activity: ManufacturerActivityEntry[]; nextBefore: string | null }> {
    const { data } = await api.get(`/manufacturers/${encodeURIComponent(manufacturerId)}/activity`, { params });
    return data;
  },

  /** What they shared from Talk to support, newest first (for staff). */
  async getManufacturerFeedback(
    manufacturerId: string,
    params?: { limit?: number; before?: string }
  ): Promise<{ feedback: SupportFeedbackRecord[]; nextBefore: string | null }> {
    const { data } = await api.get<{
      feedback: Array<{ id: string; category: SupportFeedbackRecord["category"]; message: string; screenshot: { url: string } | null; sentAt: string | null }>;
      nextBefore: string | null;
    }>(`/manufacturers/${encodeURIComponent(manufacturerId)}/feedback`, { params });
    return {
      feedback: data.feedback.map((item) => ({
        id: item.id,
        manufacturerId,
        category: item.category,
        message: item.message,
        screenshotUrl: item.screenshot?.url ?? null,
        sentAt: item.sentAt ?? "",
      })),
      nextBefore: data.nextBefore,
    };
  },

  async changeStatus(
    manufacturerId: string,
    status: "active" | "flagged" | "suspended",
    reason?: string | null
  ) {
    const { data } = await api.post(`/manufacturers/${encodeURIComponent(manufacturerId)}/status`, {
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
      `/manufacturers/${encodeURIComponent(manufacturerId)}/appeals/${appealId}/decision`,
      {
        decision,
        ...(response != null ? { response } : {}),
      }
    );
    return data;
  },

  async requestDeletion(manufacturerId: string, payload: StaffDeletionRequestPayload) {
    const { data } = await api.post(`/manufacturers/${encodeURIComponent(manufacturerId)}/deletion-request`, payload);
    return data;
  },

  async declineDeletionRequest(manufacturerId: string) {
    const { data } = await api.delete(`/manufacturers/${encodeURIComponent(manufacturerId)}/deletion-request`);
    return data;
  },

  async getDeactivationWarnings(manufacturerId: string) {
    const { data } = await api.get(`/manufacturers/${encodeURIComponent(manufacturerId)}/deactivation-warnings`);
    return data;
  },

  async deactivateManufacturer(
    manufacturerId: string,
    payload: StaffDeactivatePayload,
    reauthToken?: string
  ) {
    const headers: Record<string, string> = {};
    if (reauthToken) headers["X-Reauth-Token"] = reauthToken;
    const { data } = await api.post(`/manufacturers/${encodeURIComponent(manufacturerId)}/deactivate`, payload, {
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
      `/manufacturers/${encodeURIComponent(manufacturerId)}/reactivate`,
      { reason },
      { headers }
    );
    return data;
  },

  // ── Staff & Admin: KYC Document Verification Decisions ──────────────

  async getStaffManufacturerKyc(manufacturerId: string) {
    const { data } = await api.get(`/manufacturers/${encodeURIComponent(manufacturerId)}/kyc`);
    return data;
  },

  async decideDocumentVerification(
    manufacturerId: string,
    document: "nin" | "company-tax-number" | "business-license-number",
    decision: "verified" | "rejected",
    reason?: string | null
  ) {
    const { data } = await api.post(
      `/manufacturers/${encodeURIComponent(manufacturerId)}/kyc/${document}/decision`,
      {
        decision,
        ...(reason != null ? { reason } : {}),
      }
    );
    return data;
  },
};
