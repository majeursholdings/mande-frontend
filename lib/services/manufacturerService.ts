import { api } from "@/lib/api";

export interface BasicInfoPayload {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface CompanyInfoPayload {
  companyName: string;
  state: string;
  lga: string;
  address: string;
  yearsOfExperience: number;
  capacityPerMonth: number;
  machinery?: string[];
  materials?: string[];
  specializations?: string[];
}

export interface SubmitNinPayload {
  nin: string;
  consent: boolean;
}

export interface SubmitCacPayload {
  rcNumber: string;
  companyName: string;
}

export interface SubmitKycDocsPayload {
  ninSlipPublicId?: string;
  cacCertificatePublicId?: string;
}

export const manufacturerService = {
  // ── Profile ──────────────────────────────────────────────────────────

  async getProfile() {
    const { data } = await api.get("/profile");
    return data;
  },

  async updateBasicInfo(payload: BasicInfoPayload) {
    const { data } = await api.put("/profile/basic", payload);
    return data;
  },

  async updateCompanyInfo(payload: CompanyInfoPayload) {
    const { data } = await api.put("/profile/company", payload);
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

  // ── KYC & Verification ───────────────────────────────────────────────

  async getKycStatus() {
    const { data } = await api.get("/kyc/status");
    return data;
  },

  async submitNin(payload: SubmitNinPayload) {
    const { data } = await api.post("/kyc/nin", payload);
    return data;
  },

  async submitCac(payload: SubmitCacPayload) {
    const { data } = await api.post("/kyc/cac", payload);
    return data;
  },

  async submitDocuments(payload: SubmitKycDocsPayload) {
    const { data } = await api.post("/kyc/documents", payload);
    return data;
  },

  // ── Account, Suspension Appeals & Deletion ────────────────────────────

  async getAccountStatus() {
    const { data } = await api.get("/account");
    return data;
  },

  async submitAppeal(payload: { message: string; attachments?: Array<{ publicId: string; name: string }> }) {
    const { data } = await api.post("/account/appeals", payload);
    return data;
  },

  async requestAccountDeletion(reason: string) {
    const { data } = await api.post("/account/deletion-request", { reason });
    return data;
  },
};
