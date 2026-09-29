import { api } from "@/lib/api";

export interface JobQueryFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StepProofPayload {
  photos: string[]; // Cloudinary publicIds
  note?: string;
}

export interface ApproveStepPayload {
  rating: number; // 1-5 integer
  feedback?: string;
}

export interface RejectStepPayload {
  reason: string;
  photos?: string[];
}

export interface CreateJobPayload {
  title: string;
  description: string;
  category: string;
  totalCostKobo: number;
  deliveryDate: string;
  specifications?: Record<string, unknown>;
  projectLeadIds?: string[];
  manufacturerIds?: string[];
}

export const jobsService = {
  // ── Open Jobs Marketplace (Manufacturers) ───────────────────────────

  async getOpenJobs(params: JobQueryFilters = {}) {
    const { data } = await api.get("/open-jobs", { params });
    return data;
  },

  async getOpenJob(jobId: string) {
    const { data } = await api.get(`/open-jobs/${jobId}`);
    return data;
  },

  async applyForJob(jobId: string) {
    const { data } = await api.post(`/open-jobs/${jobId}/application`);
    return data;
  },

  async withdrawApplication(jobId: string) {
    const { data } = await api.delete(`/open-jobs/${jobId}/application`);
    return data;
  },

  // ── Manufacturer Own Jobs ──────────────────────────────────────────

  async getMyJobs(params: JobQueryFilters = {}) {
    const { data } = await api.get("/my-jobs", { params });
    return data;
  },

  async getMyJobDetail(jobId: string) {
    const { data } = await api.get(`/my-jobs/${jobId}`);
    return data;
  },

  async acceptJob(jobId: string) {
    const { data } = await api.post(`/my-jobs/${jobId}/accept`);
    return data;
  },

  async declineJob(jobId: string, reason: string) {
    const { data } = await api.post(`/my-jobs/${jobId}/decline`, { reason });
    return data;
  },

  async cancelJob(jobId: string, reason: string) {
    const { data } = await api.post(`/my-jobs/${jobId}/cancel`, { reason });
    return data;
  },

  async submitStepProof(jobId: string, stepKey: string, payload: StepProofPayload) {
    const { data } = await api.post(`/my-jobs/${jobId}/steps/${stepKey}/proof`, payload);
    return data;
  },

  async submitFinishedWork(jobId: string, photos: string[]) {
    const { data } = await api.post(`/my-jobs/${jobId}/submit`, { photos });
    return data;
  },

  async requestExtension(jobId: string, payload: { requestedDueDate: string; reason: string }) {
    const { data } = await api.post(`/my-jobs/${jobId}/extensions`, payload);
    return data;
  },

  async rateLead(jobId: string, payload: { rating: number; comment?: string }) {
    const { data } = await api.post(`/my-jobs/${jobId}/lead-review`, payload);
    return data;
  },

  async addManufacturerNote(jobId: string, message: string) {
    const { data } = await api.post(`/my-jobs/${jobId}/notes`, { message });
    return data;
  },

  async confirmDelivery(jobId: string) {
    const { data } = await api.post(`/my-jobs/${jobId}/delivery/confirm`);
    return data;
  },

  // ── Staff & Admin Jobs ─────────────────────────────────────────────

  async getStaffJobs(params: JobQueryFilters = {}) {
    const { data } = await api.get("/jobs", { params });
    return data;
  },

  async getStaffJobDetail(jobId: string) {
    const { data } = await api.get(`/jobs/${jobId}`);
    return data;
  },

  async createJob(payload: CreateJobPayload) {
    const { data } = await api.post("/jobs", payload);
    return data;
  },

  async updateJob(jobId: string, payload: Partial<CreateJobPayload>) {
    const { data } = await api.patch(`/jobs/${jobId}`, payload);
    return data;
  },

  async deleteJob(jobId: string) {
    const { data } = await api.delete(`/jobs/${jobId}`);
    return data;
  },

  async assignJob(jobId: string, manufacturerIds: string[]) {
    const { data } = await api.post(`/jobs/${jobId}/assign`, { manufacturerIds });
    return data;
  },

  async approveStep(jobId: string, stepKey: string, payload: ApproveStepPayload) {
    const { data } = await api.post(`/jobs/${jobId}/steps/${stepKey}/approve`, payload);
    return data;
  },

  async rejectStep(jobId: string, stepKey: string, payload: RejectStepPayload) {
    const { data } = await api.post(`/jobs/${jobId}/steps/${stepKey}/reject`, payload);
    return data;
  },

  async signOffLowRatedStep(jobId: string, stepKey: string) {
    const { data } = await api.post(`/jobs/${jobId}/steps/${stepKey}/sign-off`);
    return data;
  },

  async addJobNote(jobId: string, note: string) {
    const { data } = await api.post(`/jobs/${jobId}/notes`, { note });
    return data;
  },

  async followUpLeadReview(jobId: string, manufacturerId: string, note: string) {
    const { data } = await api.post(`/jobs/${jobId}/lead-reviews/${manufacturerId}/follow-up`, { note });
    return data;
  },

  async signOffJob(jobId: string, payload: { rating: number; comment?: string }) {
    const { data } = await api.post(`/jobs/${jobId}/sign-off`, payload);
    return data;
  },

  async signOffHeldJob(jobId: string) {
    const { data } = await api.post(`/jobs/${jobId}/held/sign-off`);
    return data;
  },

  async rejectJob(
    jobId: string,
    payload: { reason: string; attachments?: Array<{ publicId?: string; name?: string; url?: string; kind?: "document" | "image" }> }
  ) {
    const { data } = await api.post(`/jobs/${jobId}/reject`, payload);
    return data;
  },

  async decideApplication(jobId: string, applicationId: string, decision: "accepted" | "declined") {
    const { data } = await api.post(`/jobs/${jobId}/applications/${applicationId}/decision`, { decision });
    return data;
  },

  async decideExtension(jobId: string, extensionId: string, decision: "approved" | "rejected") {
    const { data } = await api.post(`/jobs/${jobId}/extensions/${extensionId}/decision`, { decision });
    return data;
  },

  async reportFault(jobId: string, reason: string) {
    const { data } = await api.post(`/jobs/${jobId}/fault`, { reason });
    return data;
  },
};
