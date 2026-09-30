"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredAccessToken } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { superAdminService } from "@/lib/services/superAdminService";
import { PRICING_PLANS, type PricingPlan } from "@/constant/sampleData";
import {
    SUPER_ADMINS,
    SUPER_ADMIN_INVITES,
    type SuperAdminInviteRecord,
    type SuperAdminRecord,
} from "@/constant/sampleDb";
import { API_KEYS, PLATFORM_SETTINGS, type ApiKey, type PlatformSettings, type SuperAdminRole } from "@/constant/superAdmin";
import type { ApiKeyDraft } from "./form/apiKeyForm";

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminSettingsProvider — what the super admin changes in Settings: who
// else is a super admin and with what role (and who's been invited), the
// plans and the offer on them, the rules every job follows, and the API keys
// for the platforms Mande connects to.
// Loaded from the REST API endpoints and kept synchronized via React Query.
// ─────────────────────────────────────────────────────────────────────────────

/** What Edit plan changes. */
export type PlanChanges = Pick<PricingPlan, "targetAudience" | "monthlyPrice" | "annualPrice" | "features" | "maxConcurrentJobs">;

type SuperAdminSettingsValue = {
    superAdmins: SuperAdminRecord[];
    invites: SuperAdminInviteRecord[];
    inviteSuperAdmin: (invite: Pick<SuperAdminInviteRecord, "firstName" | "lastName" | "email" | "role">, reauthToken: string) => Promise<void>;
    /** Sends the invite email again. */
    resendInvite: (id: string) => Promise<void>;
    cancelInvite: (id: string) => Promise<void>;
    /** Owners and tech support only, never their own, and never leaving the platform without an owner. */
    changeSuperAdminRole: (id: string, role: SuperAdminRole, reauthToken: string) => Promise<void>;

    plans: PricingPlan[];
    /** The offer on every plan, as a percent off (0 for none). */
    discountPercent: number;
    updatePlan: (id: string, changes: PlanChanges) => Promise<void>;
    setDiscountPercent: (percent: number) => Promise<void>;

    platformSettings: PlatformSettings;
    updatePlatformSettings: (changes: Partial<PlatformSettings>, reauthToken?: string) => Promise<void>;

    apiKeys: ApiKey[];
    /**
     * Adds a set of keys for a platform — active straight away if `isActive`
     * (the platform's first set always is), which switches its other sets off.
     */
    addApiKey: (key: ApiKeyDraft, reauthToken: string) => Promise<void>;
    /** Makes a set the one its platform uses, switching the others off. */
    setActiveApiKey: (id: string, reauthToken: string) => Promise<void>;
    /** Removing the active set leaves the platform with none until another is made active. */
    removeApiKey: (id: string, reauthToken: string) => Promise<void>;
    isLoading: boolean;
};

const SuperAdminSettingsContext = createContext<SuperAdminSettingsValue | null>(null);

export function SuperAdminSettingsProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const hasToken = Boolean(getStoredAccessToken());

    // 1. Super Admins
    const { data: serverSuperAdmins, isLoading: isLoadingSuperAdmins } = useQuery({
        queryKey: queryKeys.superAdmin.directory(),
        queryFn: () => superAdminService.getSuperAdmins(),
        enabled: hasToken,
    });

    // 2. Invites
    const { data: serverInvites, isLoading: isLoadingInvites } = useQuery({
        queryKey: queryKeys.superAdmin.invites(),
        queryFn: () => superAdminService.getInvites(),
        enabled: hasToken,
    });

    // 3. Plans
    const { data: serverPlansData, isLoading: isLoadingPlans } = useQuery({
        queryKey: queryKeys.settings.plans(),
        queryFn: () => superAdminService.getPlans(),
    });

    // 4. Platform Settings
    const { data: serverPlatformSettings, isLoading: isLoadingSettings } = useQuery({
        queryKey: queryKeys.settings.platform(),
        queryFn: () => superAdminService.getPlatformSettings(),
        enabled: hasToken,
    });

    // 5. API Keys
    const { data: serverApiKeys, isLoading: isLoadingApiKeys } = useQuery({
        queryKey: queryKeys.superAdmin.apiKeys(),
        queryFn: () => superAdminService.getApiKeys(),
        enabled: hasToken,
    });

    const superAdmins = serverSuperAdmins ?? SUPER_ADMINS;
    const invites = serverInvites ?? SUPER_ADMIN_INVITES;
    const plans = serverPlansData?.plans ?? PRICING_PLANS;
    const discountPercent = serverPlansData?.discountPercent ?? 0;
    const platformSettings = serverPlatformSettings ?? PLATFORM_SETTINGS;
    const apiKeys = serverApiKeys ?? API_KEYS;

    const value: SuperAdminSettingsValue = {
        superAdmins,
        invites,
        inviteSuperAdmin: async (invite, reauthToken) => {
            await superAdminService.createInvite(invite, reauthToken);
            await queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.invites() });
        },
        resendInvite: async (id) => {
            await superAdminService.resendInvite(id);
            await queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.invites() });
        },
        cancelInvite: async (id) => {
            await superAdminService.cancelInvite(id);
            await queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.invites() });
        },
        changeSuperAdminRole: async (id, role, reauthToken) => {
            await superAdminService.changeRole(id, role, reauthToken);
            await queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.directory() });
        },

        plans,
        discountPercent,
        updatePlan: async (id, changes) => {
            await superAdminService.updatePlan(id, changes);
            await queryClient.invalidateQueries({ queryKey: queryKeys.settings.plans() });
        },
        setDiscountPercent: async (percent) => {
            await superAdminService.updatePlanOffer(percent);
            queryClient.setQueryData(
                queryKeys.settings.plans(),
                (old: { plans: PricingPlan[]; discountPercent: number } | undefined) =>
                    old ? { ...old, discountPercent: percent } : { plans, discountPercent: percent },
            );
            await queryClient.invalidateQueries({ queryKey: queryKeys.settings.plans() });
        },

        platformSettings,
        updatePlatformSettings: async (changes, reauthToken) => {
            if ("paymentSchedule" in changes && reauthToken) {
                await superAdminService.updateJobPayments(
                    changes as Pick<PlatformSettings, "paymentSchedule" | "bonusPercent" | "rejectionChargePercent">,
                    reauthToken
                );
            } else {
                await superAdminService.updateJobRules(changes);
            }
            await queryClient.invalidateQueries({ queryKey: queryKeys.settings.platform() });
        },

        apiKeys,
        addApiKey: async (key, reauthToken) => {
            await superAdminService.addApiKey(key, reauthToken);
            await queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.apiKeys() });
        },
        setActiveApiKey: async (id, reauthToken) => {
            await superAdminService.activateApiKey(id, reauthToken);
            await queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.apiKeys() });
        },
        removeApiKey: async (id, reauthToken) => {
            await superAdminService.removeApiKey(id, reauthToken);
            await queryClient.invalidateQueries({ queryKey: queryKeys.superAdmin.apiKeys() });
        },
        isLoading:
            isLoadingSuperAdmins ||
            isLoadingInvites ||
            isLoadingPlans ||
            isLoadingSettings ||
            isLoadingApiKeys,
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
