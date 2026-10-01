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
    overview: () => [...queryKeys.jobs.all, "overview"] as const,
    reviews: () => [...queryKeys.jobs.all, "reviews"] as const,
  },

  // Manufacturers
  manufacturers: {
    all: ["manufacturers"] as const,
    lists: () => [...queryKeys.manufacturers.all, "list"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.manufacturers.lists(), filters] as const,
    details: () => [...queryKeys.manufacturers.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.manufacturers.details(), id] as const,
    dashboard: () => [...queryKeys.manufacturers.all, "dashboard"] as const,
    kyc: (id: string) => [...queryKeys.manufacturers.detail(id), "kyc"] as const,
  },

  // Manufacturer Self Profile
  profile: {
    details: () => ["profile", "details"] as const,
  },

  // Support Feedback
  support: {
    feedback: (filters?: Record<string, unknown>) => ["support", "feedback", filters] as const,
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

  // The signed-in manufacturer's standing (flags, suspensions, appeals)
  account: {
    all: ["account"] as const,
    standing: () => [...queryKeys.account.all, "standing"] as const,
  },

  // Plan (the signed-in manufacturer's subscription)
  subscription: {
    all: ["subscription"] as const,
    details: () => [...queryKeys.subscription.all, "details"] as const,
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

  // Super Admin Platform
  superAdmin: {
    all: ["super-admin"] as const,
    directory: () => [...queryKeys.superAdmin.all, "directory"] as const,
    invites: () => [...queryKeys.superAdmin.all, "invites"] as const,
    apiKeys: () => [...queryKeys.superAdmin.all, "api-keys"] as const,
  },

  // Messages from the website's contact form (super admins)
  contactMessages: {
    all: ["contact-messages"] as const,
    list: (status: "open" | "resolved") =>
      [...queryKeys.contactMessages.all, status] as const,
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
