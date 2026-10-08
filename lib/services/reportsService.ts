import { api } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// The staff report endpoints (/reports/*, /activity): the shapes below match
// mande-backend/src/modules/reports exactly. Money is whole kobo, dates are
// ISO strings. Lists page by date: pass the previous page's `nextBefore` as
// `before` for the next (older) page; null means there's no more.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared ──────────────────────────────────────────────────────────────────

/** A stored photo, as the API shows it (media.service's mediaView). */
export type ReportMedia = {
  url: string;
  name: string | null;
  kind: "image" | "document";
  publicId: string;
};

/** Who an entry of a money list is for (reports.money's withPeople). */
export type ReportPerson = {
  manufacturerId: string;
  /** "First Last", or "Unknown" when the profile is gone. */
  manufacturerName: string;
  companyName: string;
  avatar: ReportMedia | null;
  isDeactivated: boolean;
};

export type ReportJobStatus = "pending" | "in-progress" | "in-review" | "rejected" | "completed";

/** The paging params of every list: up to 100 a page (20 by default), older than `before`. */
export type ReportPageParams = { limit?: number; before?: string };

// ─── Dashboard ───────────────────────────────────────────────────────────────

/** A headline number and its change since 30 days ago. Null change: nothing then to compare with. */
export type DashboardStatValue = { value: number; changePercent: number | null };

export type DashboardStats = {
  manufacturers: DashboardStatValue;
  payoutsKobo: DashboardStatValue;
  /** The platform's plan revenue: only in a super admin's answer. */
  subscriptionRevenueKobo?: DashboardStatValue;
  /** Value is a whole percent, null before any job finished; change is in percentage points. */
  successRate: { value: number | null; changePercent: number | null };
  activeManufacturers: DashboardStatValue & { total: number };
};

export type DashboardResponse = { stats: DashboardStats };

export type JobStatisticsRange = "weekly" | "monthly";

export type JobStatisticsResponse = {
  data: { label: string; successful: number; unsuccessful: number }[];
  axisMax: number;
  axisStep: number;
};

export type JobStatusResponse = { statuses: { status: ReportJobStatus; count: number }[] };

export type PendingReview = {
  jobId: string;
  jobTitle: string;
  /** Photos of the finished work, or proof of a production step. */
  kind: "finished-work" | "step";
  /** The production step, for "step". */
  step: string | null;
  manufacturerName: string;
  submittedAt: string;
  autoApproveAt: string;
  jobCode: string | null;
  /** The proof's first photo (or the finished piece's, or the job's own). */
  imageUrl: string | null;
};

export type PendingReviewsResponse = {
  reviews: PendingReview[];
  /** Everything waiting, beyond the page in `reviews`. */
  total: number;
};

// ─── Money ───────────────────────────────────────────────────────────────────

export type ReportTransactionType = "payment" | "withdrawal" | "subscription" | "charge" | "reversal";

export type ReportTransaction = ReportPerson & {
  id: string;
  type: ReportTransactionType;
  direction: "credit" | "debit";
  label: string;
  status: "pending" | "completed" | "failed";
  amountKobo: number;
  date: string;
  jobId: string | null;
  /** The job's title, for a payment or charge on a job. */
  jobTitle: string | null;
  /** A plan paid by card: not a wallet transaction. */
  paidByCard: boolean;
};

export type TransactionsParams = ReportPageParams & {
  type?: ReportTransactionType;
  manufacturerId?: string;
};

export type TransactionsResponse = { transactions: ReportTransaction[]; nextBefore: string | null };

export type TransactionSummary = {
  earnedKobo: number;
  withdrawnKobo: number;
  subscriptionsKobo: number;
  chargesKobo: number;
  balanceKobo: number;
  counts: { payment: number; withdrawal: number; subscription: number; charge: number };
};

export type TransactionSummaryResponse = { summary: TransactionSummary };

export type RevenueType = "subscription" | "charge" | "bonus";

export type RevenueEntry = ReportPerson & {
  id: string;
  type: RevenueType;
  /** Money in to MANDE, or out (bonuses). */
  direction: "in" | "out";
  description: string;
  detail: string;
  amountKobo: number;
  date: string;
};

export type RevenueParams = ReportPageParams & { type?: RevenueType };

export type RevenueResponse = { entries: RevenueEntry[]; nextBefore: string | null };

export type RevenueSummary = {
  subscription: { totalKobo: number; count: number };
  charge: { totalKobo: number; count: number; stillOwedKobo: number };
  bonus: { totalKobo: number; count: number };
  netKobo: number;
};

export type RevenueSummaryResponse = { summary: RevenueSummary };

// ─── Super admin reports ─────────────────────────────────────────────────────

export type JobsReportPeriod = "all" | "year" | "month" | "week";

export type JobsReportResponse = {
  activity: { status: ReportJobStatus; count: number }[];
  data: {
    created: number;
    valueKobo: number;
    paidOutKobo: number;
    completed: number;
    onTimePercent: number | null;
    averageDaysToComplete: number | null;
    stepsSentBack: number;
    rejections: number;
    extensionsRequested: number;
    extensionsApproved: number;
    faults: number;
  };
};

export type AdminPosition = "support" | "project-lead" | "inventory-manager";

export type ProjectLeadReportEntry = {
  id: string;
  name: string;
  avatar: ReportMedia | null;
  position: AdminPosition | null;
  status: "pending_verification" | "active" | "disabled" | "deactivated";
  jobsHandled: number;
  reviews: number;
  /** Out of 5, to one decimal. Null before their first rating. */
  averageRating: number | null;
  points: number;
  /** A rank tier id, e.g. "associate-lead". */
  rank: string;
};

export type ProjectLeadsParams = { position?: AdminPosition; q?: string };

export type ProjectLeadsResponse = { projectLeads: ProjectLeadReportEntry[] };

export type PendingActions = {
  deletionRequests: {
    manufacturerId: string;
    manufacturerName: string;
    companyName: string;
    reason: string;
    requestedByName: string;
    requestedAt: string;
  }[];
  heldJobs: {
    jobId: string;
    title: string;
    rating: number | null;
    comment: string | null;
    ratedByName: string | null;
    ratedAt: string | null;
  }[];
  leadRatings: {
    jobId: string;
    title: string;
    manufacturerId: string;
    leadId: string;
    rating: number;
    comment: string;
    createdAt: string;
  }[];
  payments: {
    problem: "no-live-keys" | "test-mode";
    provider: string | null;
    testProviders: string[];
  }[];
  stuckWithdrawals: {
    reference: string;
    amountKobo: number;
    provider: string | null;
    manufacturerId: string;
    sentAt: string;
  }[];
  deliveryDisputes?: import("@/constant/points").DeliveryDisputeRecord[];
};

export type PendingActionsResponse = { actions: PendingActions };

export type ActivityFeedCategory = "jobs" | "payments" | "accounts" | "feedback";
export type ActivityFeedActorKind = "admin" | "manufacturer" | "system";

export type ActivityFeedEntry = {
  id: string;
  at: string;
  category: ActivityFeedCategory;
  action: string;
  actor:
    | { kind: "system" }
    | { kind: "admin" | "manufacturer"; name: string; role: "admin" | "super_admin" | "manufacturer"; avatarUrl: string | null };
  /** Starts with who did it; `{ strong }` parts are bold. */
  message: (string | { strong: string })[];
  detail: string | null;
};

export type ActivityParams = ReportPageParams & {
  category?: ActivityFeedCategory;
  actor?: ActivityFeedActorKind;
  q?: string;
};

export type ActivityResponse = { activity: ActivityFeedEntry[]; nextBefore: string | null };

// ─── Every page of a list ────────────────────────────────────────────────────

/** The API's largest page for report lists. */
const MAX_PAGE_SIZE = 500;

/**
 * Every page of a date-paged list, newest first, up to `maxPages` (so a huge
 * log can't load forever): for screens that search, filter, sort and page
 * the whole list in the browser.
 */
async function fetchAllPages<T>(
  fetchPage: (before: string | undefined) => Promise<{ items: T[]; nextBefore: string | null }>,
  maxPages: number,
): Promise<T[]> {
  const all: T[] = [];
  let before: string | undefined;
  for (let page = 0; page < maxPages; page += 1) {
    const { items, nextBefore } = await fetchPage(before);
    all.push(...items);
    if (!nextBefore) break;
    before = nextBefore;
  }
  return all;
}

/** GET /reports/lead-overview: the jobs a project lead leads, and the money they moved (kobo). */
export type LeadOverview = {
  manufacturers: { onPlatform: number; workedWithYou: number };
  jobs: { allTime: number; active: number; pending: number; inReview: number; completed: number };
  money: {
    jobValueKobo: number;
    paidOutKobo: number;
    payments: number;
    /** Still to be paid on their jobs underway. */
    pendingKobo: number;
    chargesKobo: number;
    charges: number;
  };
};

export const reportsService = {
  // ── Admin & Super Admin Reports ─────────────────────────────────────

  /** A project lead's own numbers, for the admin's overview cards. */
  async getLeadOverview() {
    const { data } = await api.get<{ overview: LeadOverview }>("/reports/lead-overview");
    return data.overview;
  },

  async getDashboard() {
    const { data } = await api.get<DashboardResponse>("/reports/dashboard");
    return data;
  },

  async getJobStatistics(range: JobStatisticsRange = "monthly") {
    const { data } = await api.get<JobStatisticsResponse>("/reports/job-statistics", {
      params: { range },
    });
    return data;
  },

  async getJobStatusSummary() {
    const { data } = await api.get<JobStatusResponse>("/reports/job-status");
    return data;
  },

  async getTransactions(params: TransactionsParams = {}) {
    const { data } = await api.get<TransactionsResponse>("/reports/transactions", { params });
    return data;
  },

  /** Every transaction (up to 2,000), newest first. */
  async getAllTransactions(params: Omit<TransactionsParams, "limit" | "before"> = {}) {
    return fetchAllPages(async (before) => {
      const page = await reportsService.getTransactions({ ...params, limit: MAX_PAGE_SIZE, before });
      return { items: page.transactions, nextBefore: page.nextBefore };
    }, 4);
  },

  async getTransactionsSummary(manufacturerId?: string) {
    const { data } = await api.get<TransactionSummaryResponse>("/reports/transactions/summary", {
      params: manufacturerId ? { manufacturerId } : undefined,
    });
    return data;
  },

  /** Updates waiting for a lead, newest first: up to `limit` (1 to 50, 10 by default). */
  async getPendingReviews(limit?: number) {
    const { data } = await api.get<PendingReviewsResponse>("/reports/pending-reviews", {
      params: limit ? { limit } : undefined,
    });
    return data;
  },

  // ── Super Admin Only Reports ────────────────────────────────────────

  async getPlatformRevenue(params: RevenueParams = {}) {
    const { data } = await api.get<RevenueResponse>("/reports/revenue", { params });
    return data;
  },

  /** Every revenue entry (up to 2,000), newest first. */
  async getAllPlatformRevenue(params: Omit<RevenueParams, "limit" | "before"> = {}) {
    return fetchAllPages(async (before) => {
      const page = await reportsService.getPlatformRevenue({ ...params, limit: MAX_PAGE_SIZE, before });
      return { items: page.entries, nextBefore: page.nextBefore };
    }, 4);
  },

  async getRevenueSummary() {
    const { data } = await api.get<RevenueSummaryResponse>("/reports/revenue/summary");
    return data;
  },

  async getProjectLeadsPerformance(params: ProjectLeadsParams = {}) {
    const { data } = await api.get<ProjectLeadsResponse>("/reports/project-leads", { params });
    return data;
  },

  async getSuperAdminActions() {
    const { data } = await api.get<PendingActionsResponse>("/reports/actions");
    return data;
  },

  async getSuperAdminJobsReport(period: JobsReportPeriod = "all") {
    const { data } = await api.get<JobsReportResponse>("/reports/jobs", { params: { period } });
    return data;
  },

  async getActivityLogs(params: ActivityParams = {}) {
    const { data } = await api.get<ActivityResponse>("/activity", { params });
    return data;
  },

  /** The activity log's newest 1,000 entries. */
  async getAllActivityLogs(params: Omit<ActivityParams, "limit" | "before"> = {}) {
    return fetchAllPages(async (before) => {
      const page = await reportsService.getActivityLogs({ ...params, limit: MAX_PAGE_SIZE, before });
      return { items: page.activity, nextBefore: page.nextBefore };
    }, 2);
  },
};
