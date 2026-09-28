"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useAdminProfile } from "@/components/adminPlatform/dashboardLayout/adminProfileContext";
import { PLAN_DISCOUNT_PERCENT, PRICING_PLANS, type PricingPlan } from "@/constant/sampleData";
import {
    SUPER_ADMINS,
    SUPER_ADMIN_INVITES,
    type SuperAdminInviteRecord,
    type SuperAdminRecord,
} from "@/constant/sampleDb";
import { API_KEYS, PLATFORM_SETTINGS, type ApiKey, type PlatformSettings, type SuperAdminRole } from "@/constant/superAdmin";

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminSettingsProvider — what the super admin changes in Settings: who
// else is a super admin and with what role (and who's been invited), the
// plans and the offer on them, the rules every job follows, and the API keys
// for the platforms Mande connects to (several sets each, one of them
// active). Shared across the super admin dashboard so a change stays put
// between pages.
// Seeded from sample data and kept in memory for now; once the backend is
// connected, load these from the API and send each change there.
// ─────────────────────────────────────────────────────────────────────────────

/** What Edit plan changes. */
export type PlanChanges = Pick<PricingPlan, "targetAudience" | "monthlyPrice" | "annualPrice" | "features" | "maxConcurrentJobs">;

type SuperAdminSettingsValue = {
    superAdmins: SuperAdminRecord[];
    invites: SuperAdminInviteRecord[];
    inviteSuperAdmin: (invite: Pick<SuperAdminInviteRecord, "firstName" | "lastName" | "email" | "role">) => void;
    /** Sends the invite email again. */
    resendInvite: (id: string) => void;
    cancelInvite: (id: string) => void;
    /** Owners and tech support only, never their own, and never leaving the platform without an owner. */
    changeSuperAdminRole: (id: string, role: SuperAdminRole) => void;

    plans: PricingPlan[];
    /** The offer on every plan, as a percent off (0 for none). */
    discountPercent: number;
    updatePlan: (id: string, changes: PlanChanges) => void;
    setDiscountPercent: (percent: number) => void;

    platformSettings: PlatformSettings;
    updatePlatformSettings: (changes: Partial<PlatformSettings>) => void;

    apiKeys: ApiKey[];
    /**
     * Adds a set of keys for a platform — active straight away if `isActive`
     * (the platform's first set always is), which switches its other sets off.
     */
    addApiKey: (key: Omit<ApiKey, "id" | "addedBy" | "addedAt">) => void;
    /** Makes a set the one its platform uses, switching the others off. */
    setActiveApiKey: (id: string) => void;
    /** Removing the active set leaves the platform with none until another is made active. */
    removeApiKey: (id: string) => void;
};

const SuperAdminSettingsContext = createContext<SuperAdminSettingsValue | null>(null);

export function SuperAdminSettingsProvider({ children }: { children: ReactNode }) {
    const { fullName: myName } = useAdminProfile();
    const [superAdmins, setSuperAdmins] = useState(SUPER_ADMINS);
    const [invites, setInvites] = useState(SUPER_ADMIN_INVITES);
    const [plans, setPlans] = useState(PRICING_PLANS);
    const [discountPercent, setDiscountPercent] = useState(PLAN_DISCOUNT_PERCENT);
    const [platformSettings, setPlatformSettings] = useState(PLATFORM_SETTINGS);
    const [apiKeys, setApiKeys] = useState(API_KEYS);

    const value: SuperAdminSettingsValue = {
        superAdmins,
        invites,
        inviteSuperAdmin: (invite) =>
            setInvites((current) => [
                { ...invite, id: `invite-${Date.now()}`, invitedBy: myName, invitedAt: new Date().toISOString() },
                ...current,
            ]),
        resendInvite: (id) =>
            setInvites((current) =>
                current.map((invite) => (invite.id === id ? { ...invite, invitedAt: new Date().toISOString() } : invite)),
            ),
        cancelInvite: (id) => setInvites((current) => current.filter((invite) => invite.id !== id)),
        changeSuperAdminRole: (id, role) =>
            setSuperAdmins((current) => current.map((superAdmin) => (superAdmin.id === id ? { ...superAdmin, role } : superAdmin))),

        plans,
        discountPercent,
        updatePlan: (id, changes) =>
            setPlans((current) => current.map((plan) => (plan.id === id ? { ...plan, ...changes } : plan))),
        setDiscountPercent,

        platformSettings,
        updatePlatformSettings: (changes) => setPlatformSettings((current) => ({ ...current, ...changes })),

        apiKeys,
        addApiKey: (key) =>
            setApiKeys((current) => {
                const isActive = key.isActive || !current.some((existing) => existing.provider === key.provider);
                return [
                    { ...key, isActive, id: `key-${key.provider}-${Date.now()}`, addedBy: myName, addedAt: new Date().toISOString() },
                    ...current.map((existing) =>
                        isActive && existing.provider === key.provider ? { ...existing, isActive: false } : existing,
                    ),
                ];
            }),
        setActiveApiKey: (id) =>
            setApiKeys((current) => {
                const provider = current.find((key) => key.id === id)?.provider;
                return current.map((key) => (key.provider === provider ? { ...key, isActive: key.id === id } : key));
            }),
        removeApiKey: (id) => setApiKeys((current) => current.filter((key) => key.id !== id)),
    };

    return <SuperAdminSettingsContext.Provider value={value}>{children}</SuperAdminSettingsContext.Provider>;
}

/** The settings on the super admin platform, and null anywhere else — for chrome shared with the admin's. */
export function useOptionalSuperAdminSettings() {
    return useContext(SuperAdminSettingsContext);
}

export function useSuperAdminSettings() {
    const context = useContext(SuperAdminSettingsContext);
    if (!context) throw new Error("useSuperAdminSettings must be used within a SuperAdminSettingsProvider");
    return context;
}
