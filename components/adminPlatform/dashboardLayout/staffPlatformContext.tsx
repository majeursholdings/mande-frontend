"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
    ADMIN_DASHBOARD_URL,
    ADMIN_JOBS_URL,
    ADMIN_MANUFACTURERS_URL,
    ADMIN_ME_ID,
    ADMIN_NAV_ITEMS,
    ADMIN_NOTIFICATION_TYPES,
    ADMIN_NOTIFICATIONS,
    ADMIN_PROFILE,
    ADMIN_PROFILE_URL,
    ADMIN_SECURITY_URL,
    ADMIN_SETTINGS_URL,
    ADMIN_TRANSACTIONS_URL,
    getAdminManufacturerUrl,
    type AdminNavItem,
    type AdminNotification,
    type AdminNotificationType,
    type AdminProfile,
} from "@/constant/admin";
import {
    SUPER_ADMIN_DASHBOARD_URL,
    SUPER_ADMIN_JOBS_URL,
    SUPER_ADMIN_MANUFACTURERS_URL,
    SUPER_ADMIN_NAV_ITEMS,
    SUPER_ADMIN_NOTIFICATION_TYPES,
    SUPER_ADMIN_NOTIFICATIONS,
    SUPER_ADMIN_PROFILE,
    SUPER_ADMIN_PROFILE_EDIT_URL,
    SUPER_ADMIN_PROFILE_URL,
    SUPER_ADMIN_ROLE,
    SUPER_ADMIN_SECURITY_URL,
    SUPER_ADMIN_SETTINGS_URL,
    SUPER_ADMIN_TRANSACTIONS_URL,
    getSuperAdminManufacturerUrl,
    superAdminCan,
    type SuperAdminRole,
} from "@/constant/superAdmin";
import { ADMIN_LOGIN_URL, SUPER_ADMIN_LOGIN_URL } from "@/constant/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// StaffPlatformProvider — which staff platform the dashboard is for. The
// admin and super admin share one frame (sidebar, top bars, notifications,
// profile menu, logout) and the same pages; this says where each part links,
// whose profile and notifications they start from, and what the signed-in
// person may do. The layouts pass just the key, so the nav's icons never
// cross from the server.
// ─────────────────────────────────────────────────────────────────────────────

export type StaffPlatformKey = "admin" | "super-admin";

export type StaffPlatform = {
    key: StaffPlatformKey;
    /** At the bottom of the sidebar, e.g. "Admin platform". */
    name: string;
    /** On their profile, and with the notes they leave on a job, e.g. "Admin". */
    roleLabel: string;
    navItems: AdminNavItem[];
    /** Where the logo goes, and the nav item that's only active on its own page. */
    dashboardUrl: string;
    jobsUrl: string;
    manufacturersUrl: string;
    getManufacturerUrl: (manufacturerId: string) => string;
    transactionsUrl: string;
    profileUrl: string;
    /** Where they change their own details, photo and notifications. */
    profileEditUrl: string;
    /** The user menu's Settings — the admin's own settings, or the super admin's platform settings. */
    settingsUrl: string;
    securityUrl: string;
    /** Where logging out lands. */
    loginUrl: string;
    /** The signed-in person among the project leads. Null when they don't lead jobs. */
    leadId: string | null;
    /** A super admin's role (owner, manager or tech support); null on the admin platform. */
    superAdminRole: SuperAdminRole | null;
    /** The signed-in person, before any change they make. */
    profile: AdminProfile;
    notifications: AdminNotification[];
    /** What they can be notified about, in Settings › Notifications. */
    notificationTypes: { value: AdminNotificationType; label: string; description: string }[];
    permissions: {
        /** Every job's lead actions (an admin acts only on the jobs they lead). */
        actsOnEveryJob: boolean;
        /** Delete jobs and manufacturer accounts, and decide the deletions admins ask for. */
        deletes: boolean;
        /**
         * Run the platform from Settings (plans, platform-wide rules, and seeing
         * the other super admins) — and so change their own name, which for an
         * admin only a super admin can.
         */
        managesPlatform: boolean;
        /** Invite super admins, cancel invites and change roles: owners and tech support, not managers. */
        managesSuperAdmins: boolean;
        /** See and change the API keys (Settings › API keys): owners and tech support, not managers. */
        managesApiKeys: boolean;
        /** Sign off, or send back, finished work a lead held for further review (rated 3 stars or less). */
        decidesHeldJobs: boolean;
    };
};

const STAFF_PLATFORMS: Record<StaffPlatformKey, StaffPlatform> = {
    admin: {
        key: "admin",
        name: "Admin platform",
        roleLabel: "Admin",
        navItems: ADMIN_NAV_ITEMS,
        dashboardUrl: ADMIN_DASHBOARD_URL,
        jobsUrl: ADMIN_JOBS_URL,
        manufacturersUrl: ADMIN_MANUFACTURERS_URL,
        getManufacturerUrl: getAdminManufacturerUrl,
        transactionsUrl: ADMIN_TRANSACTIONS_URL,
        profileUrl: ADMIN_PROFILE_URL,
        profileEditUrl: ADMIN_SETTINGS_URL,
        settingsUrl: ADMIN_SETTINGS_URL,
        securityUrl: ADMIN_SECURITY_URL,
        loginUrl: ADMIN_LOGIN_URL,
        leadId: ADMIN_ME_ID,
        superAdminRole: null,
        profile: ADMIN_PROFILE,
        notifications: ADMIN_NOTIFICATIONS,
        notificationTypes: ADMIN_NOTIFICATION_TYPES,
        permissions: {
            actsOnEveryJob: false,
            deletes: false,
            managesPlatform: false,
            managesSuperAdmins: false,
            managesApiKeys: false,
            decidesHeldJobs: false,
        },
    },
    "super-admin": {
        key: "super-admin",
        name: "Super admin platform",
        roleLabel: "Super admin",
        navItems: SUPER_ADMIN_NAV_ITEMS,
        dashboardUrl: SUPER_ADMIN_DASHBOARD_URL,
        jobsUrl: SUPER_ADMIN_JOBS_URL,
        manufacturersUrl: SUPER_ADMIN_MANUFACTURERS_URL,
        getManufacturerUrl: getSuperAdminManufacturerUrl,
        transactionsUrl: SUPER_ADMIN_TRANSACTIONS_URL,
        profileUrl: SUPER_ADMIN_PROFILE_URL,
        profileEditUrl: SUPER_ADMIN_PROFILE_EDIT_URL,
        settingsUrl: SUPER_ADMIN_SETTINGS_URL,
        securityUrl: SUPER_ADMIN_SECURITY_URL,
        loginUrl: SUPER_ADMIN_LOGIN_URL,
        leadId: null,
        superAdminRole: SUPER_ADMIN_ROLE,
        profile: SUPER_ADMIN_PROFILE,
        notifications: SUPER_ADMIN_NOTIFICATIONS,
        notificationTypes: SUPER_ADMIN_NOTIFICATION_TYPES,
        permissions: {
            actsOnEveryJob: true,
            deletes: true,
            managesPlatform: true,
            managesSuperAdmins: superAdminCan(SUPER_ADMIN_ROLE, "manage-super-admins"),
            managesApiKeys: superAdminCan(SUPER_ADMIN_ROLE, "manage-api-keys"),
            decidesHeldJobs: true,
        },
    },
};

const StaffPlatformContext = createContext<StaffPlatform>(STAFF_PLATFORMS.admin);

export function StaffPlatformProvider({ platform, children }: { platform: StaffPlatformKey; children: ReactNode }) {
    const { data: currentUser } = useCurrentUser();
    const currentUserId = currentUser?.id;
    const config = useMemo(() => {
        const base = STAFF_PLATFORMS[platform];
        if (platform === "admin" && currentUserId) {
            return {
                ...base,
                leadId: currentUserId,
            };
        }
        return base;
    }, [platform, currentUserId]);

    return <StaffPlatformContext.Provider value={config}>{children}</StaffPlatformContext.Provider>;
}

/** The staff platform the page is on — the admin's outside a StaffPlatformProvider. */
export function useStaffPlatform() {
    return useContext(StaffPlatformContext);
}

/** The dashboard is active only on its own page; every other section on its pages below it too. */
export function isStaffNavItemActive(platform: StaffPlatform, item: AdminNavItem, pathname: string): boolean {
    return item.href === platform.dashboardUrl ? pathname === item.href : pathname.startsWith(item.href);
}

/** Whether the signed-in person can act on `job` as its lead would. */
export function canActOnJob(platform: StaffPlatform, job: { projectLeadIds: string[] }): boolean {
    return platform.permissions.actsOnEveryJob || (!!platform.leadId && job.projectLeadIds.includes(platform.leadId));
}
