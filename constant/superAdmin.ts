import {
    Banknote,
    CalendarClock,
    ChartLine,
    Cog,
    FileChartColumn,
    Store,
    Coins,
    LayoutGrid,
    ListChecks,
    ListTodo,
    ReceiptText,
    Settings,
    ShieldUser,
    TicketPercent,
    UserRound,
    UsersRound,
    Wrench,
} from "lucide-react";
import {
    ADMIN_NOTIFICATION_CHANNELS,
    ADMIN_NOTIFICATION_TYPES,
    type AdminNavItem,
    type AdminNotificationChannel,
    type AdminNotificationPreferences,
    type AdminNotificationType,
    type AdminProfile,
} from "@/constant/admin";
import {
    type JobPaymentMilestone,
} from "@/constant/jobWorkflow";
import { SUPER_ADMIN_DASHBOARD_URL } from "@/constant/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// The super admin platform. It shares the admin's dashboard chrome (see
// components/adminPlatform/dashboardLayout/staffPlatformContext.tsx) and
// reads the same API records, across every manufacturer and admin.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Dashboard navigation ─────────────────────────────────────────────────────

export { SUPER_ADMIN_DASHBOARD_URL };
/** What's waiting for a super admin: deletions to confirm, low ratings to review, payment problems. */
export const SUPER_ADMIN_ACTIONS_URL = "/super-admin/actions";
export const SUPER_ADMIN_JOBS_URL = "/super-admin/jobs";
/** The jobs by status and their figures, and the project lead report. */
/** Reviews of how the jobs and their project leads are going (no money: that's on Reporting). */
export const SUPER_ADMIN_JOB_REVIEW_URL = "/super-admin/jobs/review";
export const SUPER_ADMIN_MANUFACTURERS_URL = "/super-admin/manufacturers";
export const SUPER_ADMIN_PROJECT_LEADS_URL = "/super-admin/project-leads";
export const SUPER_ADMIN_TRANSACTIONS_URL = "/super-admin/transactions";
export const SUPER_ADMIN_MACHINE_BOOKINGS_URL = "/super-admin/machine-bookings";
/** Every payment for a machine booking. */
export const SUPER_ADMIN_BOOKING_TRANSACTIONS_URL = "/super-admin/machine-bookings/transactions";
/** The machine catalogue makers book time on. */
export const SUPER_ADMIN_MACHINES_URL = "/super-admin/machines";
/** MANDE Shop: MANDE's own stock, every product, and the sellers. */
export const SUPER_ADMIN_SHOP_URL = "/super-admin/shop";
/** Shop customers: their orders and store credit, and deactivating them. */
export const SUPER_ADMIN_CUSTOMERS_URL = "/super-admin/customers";
/** Coupon codes for machine bookings, subscriptions or both. */
export const SUPER_ADMIN_COUPONS_URL = "/super-admin/coupons";
/** The platform's own money by area: jobs, the shop, machine bookings and subscriptions. */
export const SUPER_ADMIN_REVENUE_URL = "/super-admin/revenue";
export const SUPER_ADMIN_REPORTING_URL = "/super-admin/reporting";
export const SUPER_ADMIN_ACTIVITY_LOG_URL = "/super-admin/reporting/activity-log";
export const SUPER_ADMIN_PROFILE_URL = "/super-admin/profile";
/** Their own details, photo and notifications. */
export const SUPER_ADMIN_PROFILE_EDIT_URL = "/super-admin/profile/edit";
export const SUPER_ADMIN_SECURITY_URL = "/super-admin/profile/security";
/** The platform's settings: super admins, plans, platform-wide rules, payment keys. */
export const SUPER_ADMIN_SETTINGS_URL = "/super-admin/settings";

export const getSuperAdminManufacturerUrl = (manufacturerId: string) =>
    `${SUPER_ADMIN_MANUFACTURERS_URL}/${encodeURIComponent(manufacturerId)}`;
export const getSuperAdminCustomerUrl = (customerId: string) => `${SUPER_ADMIN_CUSTOMERS_URL}/${encodeURIComponent(customerId)}`;
export const getSuperAdminMachineBookingUrl = (bookingId: string) =>
    `${SUPER_ADMIN_MACHINE_BOOKINGS_URL}/${encodeURIComponent(bookingId)}`;

export const SUPER_ADMIN_NAV_ITEMS: AdminNavItem[] = [
    { label: "Dashboard", href: SUPER_ADMIN_DASHBOARD_URL, icon: LayoutGrid, inBottomBar: true },
    { label: "Actions", href: SUPER_ADMIN_ACTIONS_URL, icon: ListTodo, countsPendingActions: true },
    {
        label: "Jobs",
        href: SUPER_ADMIN_JOBS_URL,
        icon: ListChecks,
        inBottomBar: true,
        children: [
            {
                label: "Manufacturers",
                shortLabel: "Manufacturer",
                href: SUPER_ADMIN_MANUFACTURERS_URL,
                icon: Wrench,
                inBottomBar: true,
            },
            { label: "Transactions", href: SUPER_ADMIN_TRANSACTIONS_URL, icon: ReceiptText, inBottomBar: true },
            { label: "Job review", href: SUPER_ADMIN_JOB_REVIEW_URL, icon: FileChartColumn },
        ],
    },
    { label: "Project Leads", href: SUPER_ADMIN_PROJECT_LEADS_URL, icon: ShieldUser },
    {
        label: "Machines",
        href: SUPER_ADMIN_MACHINES_URL,
        icon: Cog,
        children: [
            { label: "Machine bookings", href: SUPER_ADMIN_MACHINE_BOOKINGS_URL, icon: CalendarClock },
            { label: "Booking transactions", href: SUPER_ADMIN_BOOKING_TRANSACTIONS_URL, icon: Banknote },
        ],
    },
    {
        label: "Shop",
        href: SUPER_ADMIN_SHOP_URL,
        icon: Store,
        children: [{ label: "Customers", href: SUPER_ADMIN_CUSTOMERS_URL, icon: UsersRound }],
    },
    { label: "Coupons", href: SUPER_ADMIN_COUPONS_URL, icon: TicketPercent },
    { label: "Revenue", href: SUPER_ADMIN_REVENUE_URL, icon: Coins },
    { label: "Reporting", href: SUPER_ADMIN_REPORTING_URL, icon: ChartLine },
    { label: "Profile", href: SUPER_ADMIN_PROFILE_URL, icon: UserRound },
    { label: "Settings", href: SUPER_ADMIN_SETTINGS_URL, icon: Settings },
];

// ─── Roles ────────────────────────────────────────────────────────────────────

/**
 * What kind of super admin someone is. Owners and tech support can do
 * everything; managers run the platform day to day, but can't invite or
 * change super admins, or see the API keys. The API checks the same rules
 * (mande-backend src/constants/roles.ts), so hiding things here is only so
 * a manager isn't shown what they can't use.
 */
export type SuperAdminRole = "owner" | "manager" | "tech-support";

export const SUPER_ADMIN_ROLE_OPTIONS: {
    value: SuperAdminRole;
    label: string;
    /** In a sentence, e.g. "They're now a manager". */
    phrase: string;
    description: string;
}[] = [
    { value: "owner", label: "Owner", phrase: "an owner", description: "Full control of the platform, including super admins and API keys." },
    { value: "tech-support", label: "Tech support", phrase: "tech support", description: "Full control of the platform, including super admins and API keys." },
    { value: "manager", label: "Manager", phrase: "a manager", description: "Everything except inviting or changing super admins, and API keys." },
];

export function getSuperAdminRoleLabel(role: SuperAdminRole): string {
    return SUPER_ADMIN_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

/** e.g. "an owner", "a manager", "tech support". */
export function getSuperAdminRolePhrase(role: SuperAdminRole): string {
    return SUPER_ADMIN_ROLE_OPTIONS.find((option) => option.value === role)?.phrase ?? role;
}

/** What only some super admins can do. Anything else, every super admin can. */
export type SuperAdminPermission = "manage-super-admins" | "manage-api-keys";

const SUPER_ADMIN_ROLE_PERMISSIONS: Record<SuperAdminRole, readonly SuperAdminPermission[]> = {
    owner: ["manage-super-admins", "manage-api-keys"],
    "tech-support": ["manage-super-admins", "manage-api-keys"],
    manager: [],
};

export function superAdminCan(role: SuperAdminRole, permission: SuperAdminPermission): boolean {
    return SUPER_ADMIN_ROLE_PERMISSIONS[role].includes(permission);
}

// ─── Profile ──────────────────────────────────────────────────────────────────

const EVERY_CHANNEL = Object.fromEntries(
    ADMIN_NOTIFICATION_CHANNELS.map(({ value }) => [value, true]),
) as Record<AdminNotificationChannel, boolean>;

/**
 * A signed-in super admin's profile, in the staff profile shape the
 * dashboard's top bars read, before their account has loaded: blank. Super
 * admins have no position. The real one comes from /auth/me.
 */
export const BLANK_SUPER_ADMIN_PROFILE: AdminProfile = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "" as AdminProfile["position"],
    avatarUrl: null,
    joinedAt: "",
    security: { twoFactorMethod: null },
    // Every notification, in the app and by email, until they have a Settings page to choose
    notificationPreferences: Object.fromEntries(
        ADMIN_NOTIFICATION_TYPES.map(({ value }) => [value, EVERY_CHANNEL]),
    ) as AdminNotificationPreferences,
};

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * What a super admin can be notified about: the admin's kinds, across every
 * job rather than their own (they have no points or rank).
 */
export const SUPER_ADMIN_NOTIFICATION_TYPES: { value: AdminNotificationType; label: string; description: string }[] = [
    { value: "applications", label: "Job applications", description: "A manufacturer applies for a job" },
    {
        value: "reviews",
        label: "Work to review",
        description: "Proof of a production step, or the finished furniture, is waiting for a lead",
    },
    { value: "delays", label: "Delay reports", description: "A manufacturer asks for more time on a job" },
    { value: "job-responses", label: "Job responses", description: "A manufacturer accepts or declines a job" },
    {
        value: "appeals",
        label: "Appeals",
        description: "A suspended manufacturer asks for the suspension to be lifted",
    },
    { value: "disputes", label: "Delivery disputes", description: "A lead or manufacturer disputes a rejected delivery" },
    {
        value: "accounts",
        label: "Manufacturer accounts",
        description: "An admin asks for a manufacturer's account to be closed",
    },
    { value: "machine-bookings", label: "Machine bookings", description: "When a machine booking is paid" },
    { value: "product-reports", label: "Product reports", description: "A shop customer reports a product" },
    { value: "shop-ratings", label: "Low seller ratings", description: "A seller's rating falls below the shop's low rating alert" },
];

// ─── Settings ─────────────────────────────────────────────────────────────────
// What a super admin changes from Settings, read from and saved to the API;
// the platform (prices, job payments, review windows) follows what's saved.

/** The rules every job follows, platform-wide. */
export type PlatformSettings = {
    /** Percent of a job's amount paid at each milestone — adds up to 100. */
    paymentSchedule: Record<JobPaymentMilestone, number>;
    /** Extra, as a percent of the amount, for work delivered on time with nothing sent back. */
    bonusPercent: number;
    /** Charged from the manufacturer's wallet each time their finished work is rejected, as a percent of the amount. */
    rejectionChargePercent: number;
    /** How long a lead has to review proof or finished work before it's approved automatically. */
    reviewWindowHours: number;
    /** How long after sign-off a fault can be reported, cancelling the bonus. */
    faultReportDays: number;
    /** Rejections of finished work before a job closes. */
    maxRejections: number;
    /** The most a due date can be pushed back, as a percent of the job's length. */
    maxExtensionPercent: number;
    /** Manufacturers who can share one job. */
    maxManufacturersPerJob: number;
    /** Whether new manufacturers can sign up. */
    manufacturerSignUpsOpen: boolean;
    /** Points allocated for different events for manufacturers and admins. */
    pointSettings?: import("@/constant/points").PointSettingsConfig;
    /** Social channels config for the community pages. */
    communityChannels?: import("@/constant/community").CommunityChannel[];
    /** Machine booking: the unit, the longest booking, machines per booking and the schedule (prices live on the machines). */
    machineBooking?: import("@/lib/services/machineBookingService").MachineBookingSettings;
    /** The shop's rules (Settings › Shop). */
    shop?: ShopSettings;
    /** What manufacturers pay to withdraw (Settings › Platform › Withdrawal fee). */
    withdrawalFee?: WithdrawalFeeSettings;
};

/**
 * The bank transfer fee on wallet withdrawals: the fee of the first tier a
 * withdrawal fits ("up to" inclusive, the last tier null for no limit), from
 * `startsAt` (null: not charged, MANDE pays it). Kobo.
 */
export type WithdrawalFeeSettings = { startsAt: string | null; tiers: { upToKobo: number | null; feeKobo: number }[] };

/** The shop's rules: the selling switch, MANDE's charge on each sale, who pays Paystack's fee, and the day limits. */
export type ShopSettings = {
    /** Off takes every manufacturer's products off the shop (MANDE stock stays). */
    manufacturerSellingEnabled: boolean;
    /** A whole percent of the item price (up to 50), or a flat amount in kobo per order, item line or unit. */
    platformCharge: { type: "percentage" | "flat"; value: number; flatBasis: "order" | "line" | "unit" };
    /** A shipped order counts as delivered after this many days, if the customer doesn't say so first. */
    deliveryConfirmDays: number;
    /** How long after delivery a customer can report a problem. */
    problemReportDays: number;
    /** How long after delivery a customer can review. */
    reviewWindowDays: number;
    /** How long a seller has to pay back a refund before their products are paused. */
    debtGraceDays: number;
    /** Returns: days after delivery to ask; days to send it back once approved; and the grace after that before an approved return lapses. */
    returnWindowDays: number;
    returnSendBackDays: number;
    returnGraceDays: number;
    /** A manufacturer's share goes to their wallet this many hours after delivery. */
    payoutDelayHours: number;
    /** Flags a seller to staff when their rating falls below this, once they have this many reviews. */
    lowRatingAlert: { belowRating: number; minReviews: number };
};

export type CandidateJobReview = {
    jobId: string;
    jobTitle: string;
    rating: number;
    quote: string;
    authorName: string;
    business: string;
    createdAt: string;
};

export type AdminCommunityData = {
    channels: import("@/constant/community").CommunityChannel[];
    testimonials: (import("@/constant/community").CommunityTestimonial & { order?: number; isActive?: boolean; jobId?: string | null })[];
    candidateReviews: CandidateJobReview[];
};

/**
 * The kinds of outside platforms Mande connects to with API keys: each a
 * section of Settings › API keys. Payments and identity checks for now; CMS
 * and others later are a group here and their providers in API_PROVIDERS.
 * The same as the API's constants/apiKeys.ts.
 */
export type ApiKeyGroup = "payments" | "verification";

export const API_KEY_GROUPS: {
    value: ApiKeyGroup;
    label: string;
    description: string;
    /** What the live/test choice is about, and what each means, in the Add keys form. */
    modeLabel: string;
    modeDescriptions: Record<ApiKeyMode, string>;
}[] = [
    {
        value: "payments",
        label: "Payments",
        description: "Taking plan payments from manufacturers, and paying them out.",
        modeLabel: "Payments",
        modeDescriptions: { live: "Real payments from manufacturers.", test: "For trying payments out. No real money moves." },
    },
    {
        value: "verification",
        label: "Identity checks",
        description: "Checking manufacturers' NINs and company registration numbers.",
        modeLabel: "Checks",
        modeDescriptions: { live: "Real checks, which the platform charges for.", test: "The platform's sandbox, for trying checks out." },
    },
];

export type ApiProvider = "paystack" | "flutterwave" | "youverify";
export type ApiKeyMode = "test" | "live";

/**
 * Each platform Mande can connect to, in its group. How its keys start, for
 * each mode, catches a key pasted in the wrong box (null when its keys have
 * no set start).
 */
export const API_PROVIDERS: {
    value: ApiProvider;
    group: ApiKeyGroup;
    label: string;
    description: string;
    keyPrefixes: Record<ApiKeyMode, { publicKey: string | null; secretKey: string | null }>;
    /** Youverify has only a secret key. */
    hasPublicKey: boolean;
    /** Flutterwave also needs an encryption key for card payments. */
    hasEncryptionKey: boolean;
    /** Flutterwave proves its webhooks with a secret hash set on its dashboard. */
    hasWebhookSecret: boolean;
    /**
     * Payment platforms tell the API about payments and transfers here (under
     * the API's base URL). Set as the webhook URL on the platform's dashboard.
     */
    webhook: { path: string; where: string } | null;
}[] = [
    {
        value: "paystack",
        group: "payments",
        label: "Paystack",
        description: "Card, bank transfer and USSD payments for plans",
        keyPrefixes: {
            test: { publicKey: "pk_test_", secretKey: "sk_test_" },
            live: { publicKey: "pk_live_", secretKey: "sk_live_" },
        },
        hasPublicKey: true,
        hasEncryptionKey: false,
        hasWebhookSecret: false,
        webhook: { path: "/webhooks/paystack", where: "Settings, API Keys & Webhooks, as the Test or Live Webhook URL (to match the keys)" },
    },
    {
        value: "flutterwave",
        group: "payments",
        label: "Flutterwave",
        description: "Card and bank payments, and payouts to manufacturers' banks",
        keyPrefixes: {
            test: { publicKey: "FLWPUBK_TEST-", secretKey: "FLWSECK_TEST-" },
            live: { publicKey: "FLWPUBK-", secretKey: "FLWSECK-" },
        },
        hasPublicKey: true,
        hasEncryptionKey: true,
        hasWebhookSecret: true,
        webhook: { path: "/webhooks/flutterwave", where: "Settings, Webhooks, with the same secret hash you add here" },
    },
    {
        value: "youverify",
        group: "verification",
        label: "Youverify",
        description: "NIN and company registration checks for manufacturers' verification",
        keyPrefixes: { test: { publicKey: null, secretKey: null }, live: { publicKey: null, secretKey: null } },
        hasPublicKey: false,
        hasEncryptionKey: false,
        hasWebhookSecret: false,
        webhook: null,
    },
];

export const API_KEY_MODE_OPTIONS: { value: ApiKeyMode; label: string }[] = [
    { value: "live", label: "Live" },
    { value: "test", label: "Test" },
];

/**
 * A set of keys for one platform, as the dashboard holds them: the public
 * key in full (it's meant to be shared), the secret only by its last four
 * characters. The whole secret goes to the API once, when it's added, and
 * never comes back to the browser. A platform can have several sets; the
 * one that's active is the one Mande uses.
 */
export type ApiKey = {
    id: string;
    provider: ApiProvider;
    /** To tell sets apart, e.g. "Main account". */
    name: string;
    mode: ApiKeyMode;
    /** Null for a platform without one (Youverify). */
    publicKey: string | null;
    secretKeyLast4: string;
    hasEncryptionKey: boolean;
    hasWebhookSecret: boolean;
    /** At most one per platform. */
    isActive: boolean;
    addedBy: string;
    /** ISO date. */
    addedAt: string;
};

