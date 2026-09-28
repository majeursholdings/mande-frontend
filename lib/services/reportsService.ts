import { api } from "@/lib/api";

export const reportsService = {
  // ── Admin & Super Admin Reports ─────────────────────────────────────

  async getDashboard() {
    const { data } = await api.get("/reports/dashboard");
    return data;
  },

  async getJobStatistics(range: "weekly" | "monthly" | "yearly" = "weekly") {
    const { data } = await api.get("/reports/job-statistics", {
      params: { range },
    });
    return data;
  },

  async getJobStatusSummary() {
    const { data } = await api.get("/reports/job-status");
    return data;
  },

  async getTransactions(params: { page?: number; limit?: number; type?: string } = {}) {
    const { data } = await api.get("/reports/transactions", { params });
    return data;
  },

  async getTransactionsSummary() {
    const { data } = await api.get("/reports/transactions/summary");
    return data;
  },

  async getPendingReviews() {
    const { data } = await api.get("/reports/pending-reviews");
    return data;
  },

  // ── Super Admin Only Reports ────────────────────────────────────────

  async getPlatformRevenue() {
    const { data } = await api.get("/reports/revenue");
    return data;
  },

  async getRevenueSummary() {
    const { data } = await api.get("/reports/revenue/summary");
    return data;
  },

  async getProjectLeadsPerformance() {
    const { data } = await api.get("/reports/project-leads");
    return data;
  },

  async getSuperAdminActions() {
    const { data } = await api.get("/reports/actions");
    return data;
  },

  async getSuperAdminJobsReport(period: "week" | "month" | "year" = "month") {
    const { data } = await api.get("/reports/jobs", { params: { period } });
    return data;
  },

  async getActivityLogs(params: { category?: string; page?: number; limit?: number } = {}) {
    const { data } = await api.get("/activity", { params });
    return data;
  },
};
