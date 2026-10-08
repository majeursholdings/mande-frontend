import { api } from "@/lib/api";

/**
 * What the API's job lists take: a page size (up to 50) and a date cursor.
 * Nothing else: they're strict, and an unknown key is a 422. Filter and
 * search the loaded list instead.
 */
export interface JobQueryFilters {
  limit?: number;
  /** ISO date: jobs created before it (the previous page's nextBefore). */
  before?: string;
}

export interface StepProofPayload {
  photos: string[]; // Cloudinary publicIds
  note?: string;
}

export interface ApproveStepPayload {
  outcome?: "approved";
}

export interface RejectStepPayload {
  reason: string;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  category: string;
  amountKobo: number;
  dueDate: string;
  startDate?: string | null;
  deliveryLocation?: {
    street?: string;
    city: string;
    state: string;
    country?: string;
  } | null;
  image?: { publicId: string; name?: string } | null;
  attachments?: { publicId: string; name?: string }[];
  projectLeadIds?: string[];
  manufacturerIds?: string[];
}

export interface UpdateJobPayload {
  title?: string;
  description?: string;
  category?: string;
  amountKobo?: number;
  dueDate?: string;
  startDate?: string | null;
  deliveryLocation?: {
    street?: string;
    city: string;
    state: string;
    country?: string;
  } | null;
  image?: { publicId: string; name?: string } | null;
  attachments?: { publicId: string; name?: string }[];
  projectLeadIds?: string[];
}


/** A file the form has already uploaded; only its publicId and name go to the API. */
type UploadedFileLike = { publicId?: string | null; name?: string };

/** The API takes uploads as { publicId, name } only; anything not uploaded yet is left out. */
const toUploads = (files: UploadedFileLike[]) =>
  files.flatMap((file) => (file.publicId ? [{ publicId: file.publicId, ...(file.name && { name: file.name.slice(0, 200) }) }] : []));

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
    // Only what the API takes: the shared review form also carries (empty) client proofs
    const { data } = await api.post(`/my-jobs/${jobId}/lead-review`, { rating: payload.rating, comment: payload.comment });
    return data;
  },

  async addManufacturerNote(jobId: string, message: string) {
    const { data } = await api.post(`/my-jobs/${jobId}/notes`, { message });
    return data;
  },

  async getReviews() {
    const { data } = await api.get<{
      reviews: Array<{
        id: string;
        jobId: string;
        jobCode: string;
        jobTitle: string;
        rating: number;
        comment: string;
        author: string;
        createdAt: string;
      }>;
      overview: {
        averageRating: number;
        totalReviews: number;
        fiveStarCount: number;
        positiveRate: number;
      };
    }>("/my-jobs/reviews");
    return data;
  },

  async getOverview() {
    const { data } = await api.get<{
      overview: {
        activeCount: number;
        inReviewCount: number;
        completedCount: number;
        openMarketCount: number;
      };
    }>("/my-jobs/overview");
    return data.overview;
  },

  // Staff & Admin Jobs

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

  async updateJob(jobId: string, payload: UpdateJobPayload) {
    const { data } = await api.patch(`/jobs/${jobId}`, payload);
    return data;
  },

  async deleteJob(jobId: string) {
    const { data } = await api.delete(`/jobs/${jobId}`);
    return data;
  },

  async offerJob(jobId: string, manufacturerIds: string[]) {
    const { data } = await api.put(`/jobs/${jobId}/offer`, { manufacturerIds });
    return data;
  },

  async assignJob(jobId: string, manufacturerIds: string[]) {
    return this.offerJob(jobId, manufacturerIds);
  },

  async reviewStep(jobId: string, stepKey: string, payload: { outcome: "approved" | "sent-back"; reason?: string }) {
    const { data } = await api.post(`/jobs/${jobId}/steps/${stepKey}/review`, payload);
    return data;
  },

  async approveStep(jobId: string, stepKey: string) {
    return this.reviewStep(jobId, stepKey, { outcome: "approved" });
  },

  async rejectStep(jobId: string, stepKey: string, payload: RejectStepPayload) {
    return this.reviewStep(jobId, stepKey, { outcome: "sent-back", reason: payload.reason });
  },

  async signOffLowRatedStep(jobId: string) {
    return this.signOffHeldJob(jobId);
  },

  async rateManufacturer(jobId: string, payload: { rating: number; comment: string }) {
    const { data } = await api.put(`/jobs/${jobId}/manufacturer-review`, payload);
    return data;
  },

  async addJobNote(jobId: string, note: string) {
    const { data } = await api.post(`/jobs/${jobId}/notes`, { message: note });
    return data;
  },

  async followUpLeadReview(jobId: string, manufacturerId: string, note: string) {
    const { data } = await api.post(`/jobs/${jobId}/lead-reviews/${manufacturerId}/follow-up`, { note });
    return data;
  },

  async signOffJob(jobId: string, payload: { rating: number; comment: string; clientProofs: UploadedFileLike[] }) {
    const { data } = await api.post(`/jobs/${jobId}/sign-off`, { ...payload, clientProofs: toUploads(payload.clientProofs) });
    return data;
  },

  async signOffHeldJob(jobId: string) {
    const { data } = await api.post(`/jobs/${jobId}/held/sign-off`);
    return data;
  },

  async rejectJob(jobId: string, payload: { reason: string; attachments: UploadedFileLike[] }) {
    const { data } = await api.post(`/jobs/${jobId}/reject`, { ...payload, attachments: toUploads(payload.attachments) });
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
