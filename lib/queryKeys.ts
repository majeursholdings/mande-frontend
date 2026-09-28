/**
 * Unified query key factory for consistent caching and targeted invalidation
 */
export const queryKeys = {
  // Auth & Current User
  auth: {
    all: ["auth"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
    profile: () => [...queryKeys.auth.all, "profile"] as const,
  },

  // Jobs
  jobs: {
    all: ["jobs"] as const,
    lists: () => [...queryKeys.jobs.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.jobs.lists(), filters] as const,
    details: () => [...queryKeys.jobs.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
    openJobs: (filters?: Record<string, unknown>) =>
      [...queryKeys.jobs.all, "open", filters] as const,
    steps: (jobId: string) => [...queryKeys.jobs.detail(jobId), "steps"] as const,
  },

  // Manufacturers
  manufacturers: {
    all: ["manufacturers"] as const,
    lists: () => [...queryKeys.manufacturers.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.manufacturers.lists(), filters] as const,
    details: () => [...queryKeys.manufacturers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.manufacturers.details(), id] as const,
    kyc: (id: string) => [...queryKeys.manufacturers.detail(id), "kyc"] as const,
  },

  // Staff & Project Leads
  staff: {
    all: ["staff"] as const,
    profile: () => [...queryKeys.staff.all, "profile"] as const,
    projectLeads: (filters?: Record<string, unknown>) =>
      [...queryKeys.staff.all, "project-leads", filters] as const,
    projectLead: (id: string) =>
      [...queryKeys.staff.all, "project-leads", id] as const,
  },

  // Wallet & Transactions
  wallet: {
    all: ["wallet"] as const,
    summary: () => [...queryKeys.wallet.all, "summary"] as const,
    details: () => [...queryKeys.wallet.all, "details"] as const,
    transactions: (filters?: Record<string, unknown>) =>
      [...queryKeys.wallet.all, "transactions", filters] as const,
  },

  // Notifications
  notifications: {
    all: ["notifications"] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unread-count"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.notifications.all, "list", filters] as const,
  },

  // Platform & Settings
  settings: {
    all: ["settings"] as const,
    platform: () => [...queryKeys.settings.all, "platform"] as const,
    plans: () => [...queryKeys.settings.all, "plans"] as const,
  },

  // Reports
  reports: {
    all: ["reports"] as const,
    dashboard: (filters?: Record<string, unknown>) =>
      [...queryKeys.reports.all, "dashboard", filters] as const,
    statistics: (range: string) =>
      [...queryKeys.reports.all, "statistics", range] as const,
    jobStatus: () => [...queryKeys.reports.all, "job-status"] as const,
  },
};
