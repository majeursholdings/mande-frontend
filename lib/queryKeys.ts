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
    /** The top bar's job search: one scope ("open" or "active") and term. */
    search: (scope: string, q: string) => [...queryKeys.jobs.all, "search", scope, q] as const,
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

  // Points & Ranks
  points: {
    all: ["points"] as const,
    mySummary: () => [...queryKeys.points.all, "me"] as const,
    myHistory: () => [...queryKeys.points.all, "history", "me"] as const,
    userHistory: (userId: string) => [...queryKeys.points.all, "history", userId] as const,
  },

  // Support Feedback
  support: {
    feedback: (filters?: Record<string, unknown>) => ["support", "feedback", filters] as const,
  },

  // The community channels and testimonials (public)
  community: {
    all: ["community"] as const,
    public: () => [...queryKeys.community.all, "public"] as const,
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
    /** The job rules the help pages quote (GET /settings/public-rules). */
    publicRules: () => [...queryKeys.settings.all, "public-rules"] as const,
  },

  // Machine booking (time on the factory machines)
  machineBookings: {
    all: ["machine-bookings"] as const,
    pricing: () => [...queryKeys.machineBookings.all, "pricing"] as const,
    mine: () => [...queryKeys.machineBookings.all, "mine"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.machineBookings.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.machineBookings.all, "detail", id] as const,
    /** A guest's bookings, looked up by email + code (keyed by the short-lived lookup token). */
    lookup: (lookupToken: string) => [...queryKeys.machineBookings.all, "lookup", lookupToken] as const,
    /** One booking from the private link in a booking email. */
    view: (token: string) => [...queryKeys.machineBookings.all, "view", token] as const,
  },

  // The machine catalogue (super admins)
  machines: {
    all: ["machines"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.machines.all, "list", filters] as const,
    categories: () => [...queryKeys.machines.all, "categories"] as const,
  },

  // The shop: a manufacturer's own store (/my-shop) and staff running it (/shop-admin)
  shop: {
    all: ["shop"] as const,
    myShop: () => [...queryKeys.shop.all, "my-shop"] as const,
    mySummary: (period: string) => [...queryKeys.shop.all, "my-shop", "summary", period] as const,
    myOrders: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "my-shop", "orders", filters] as const,
    myPayouts: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "my-shop", "payouts", filters] as const,
    mandeSummary: (period: string) => [...queryKeys.shop.all, "mande", "summary", period] as const,
    mandeOrders: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "mande", "orders", filters] as const,
    myProducts: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "my-shop", "products", filters] as const,
    payoutBanks: () => [...queryKeys.shop.all, "payout-banks"] as const,
    mande: () => [...queryKeys.shop.all, "mande"] as const,
    mandeProducts: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "mande", "products", filters] as const,
    allProducts: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "all-products", filters] as const,
    sellers: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "sellers", filters] as const,
    reports: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "reports", filters] as const,
    myReviews: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "my-reviews", filters] as const,
    mandeReviews: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "mande-reviews", filters] as const,
    allReviews: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "all-reviews", filters] as const,
    myReturns: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "my-returns", filters] as const,
    mandeReturns: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "mande-returns", filters] as const,
    allReturns: (filters?: Record<string, unknown>) => [...queryKeys.shop.all, "all-returns", filters] as const,
    seller: (id: string) => [...queryKeys.shop.all, "seller", id] as const,
  },

  // What's waiting on the signed-in person (the Actions pages and the menu's count)
  actions: {
    all: ["actions"] as const,
    mine: () => [...queryKeys.actions.all, "mine"] as const,
    lead: () => [...queryKeys.actions.all, "lead"] as const,
  },

  // Coupons (super admins create them; anyone can check one)
  coupons: {
    all: ["coupons"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.coupons.all, "list", filters] as const,
    redemptions: (couponId: string) => [...queryKeys.coupons.all, "redemptions", couponId] as const,
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
    leadOverview: () => [...queryKeys.reports.all, "lead-overview"] as const,
    pendingReviews: (limit?: number) => [...queryKeys.reports.all, "pending-reviews", limit] as const,
    transactions: (filters?: Record<string, unknown>) =>
      [...queryKeys.reports.all, "transactions", filters] as const,
    transactionsSummary: (manufacturerId?: string) =>
      [...queryKeys.reports.all, "transactions-summary", manufacturerId] as const,
    revenue: (filters?: Record<string, unknown>) => [...queryKeys.reports.all, "revenue", filters] as const,
    revenueSummary: () => [...queryKeys.reports.all, "revenue-summary"] as const,
    series: (metric: string, range: string) => [...queryKeys.reports.all, "series", metric, range] as const,
    jobReviews: (kind: string) => [...queryKeys.reports.all, "job-reviews", kind] as const,
    jobReviewSummary: () => [...queryKeys.reports.all, "job-review-summary"] as const,
    bookingTransactions: () => [...queryKeys.reports.all, "booking-transactions"] as const,
    bookingTransactionsSummary: () => [...queryKeys.reports.all, "booking-transactions-summary"] as const,
    actions: () => [...queryKeys.reports.all, "actions"] as const,
    activity: (filters?: Record<string, unknown>) => [...queryKeys.reports.all, "activity", filters] as const,
  },
};
