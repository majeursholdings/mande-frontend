import { api } from "@/lib/api";
import { PRICING_PLANS, type PricingPlan } from "@/constant/sampleData";
import type { SuperAdminInviteRecord, SuperAdminRecord, TwoFactorMethod } from "@/constant/sampleDb";
import type { ApiKey, PlatformSettings, SuperAdminRole } from "@/constant/superAdmin";
import type { ApiKeyDraft } from "@/components/superAdminPlatform/form/apiKeyForm";
import type { PlanChanges } from "@/components/superAdminPlatform/settingsContext";

export interface BackendSuperAdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: { publicId?: string } | null;
  superAdminRole: SuperAdminRole;
  status: string;
  twoFactorOn: boolean;
  twoFactorMethod?: TwoFactorMethod | null;
  joinedAt: string;
}

export interface BackendInvite {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  superAdminRole: SuperAdminRole;
  invitedByName: string;
  createdAt: string;
}

export interface BackendPlanView {
  id: string;
  tierNumber: string;
  name: string;
  targetAudience: string;
  monthlyPriceKobo: number;
  annualPriceKobo: number;
  currentMonthlyPriceKobo: number;
  currentAnnualPriceKobo: number;
  maxConcurrentJobs: number | null;
  features: Array<{ label: string; value: string }>;
}

export interface BackendApiKey {
  id: string;
  provider: ApiKey["provider"];
  name: string;
  mode: ApiKey["mode"];
  publicKey: string | null;
  secretKeyLast4: string;
  hasEncryptionKey: boolean;
  hasWebhookSecret: boolean;
  isActive: boolean;
  addedByName: string;
  createdAt: string;
}

export const superAdminService = {
  // ── Super Admins Directory ──────────────────────────────────────────

  async getSuperAdmins(): Promise<SuperAdminRecord[]> {
    const { data } = await api.get<{ superAdmins: BackendSuperAdminUser[] }>("/super-admins");
    return data.superAdmins.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`.trim() || user.email,
      email: user.email,
      phone: "",
      avatarUrl: user.avatar?.publicId ?? null,
      joinedAt: user.joinedAt,
      twoFactorMethod: user.twoFactorMethod || "email",
      role: user.superAdminRole,
    }));
  },

  async changeRole(userId: string, role: SuperAdminRole, reauthToken: string): Promise<void> {
    await api.patch(
      `/super-admins/${userId}/role`,
      { superAdminRole: role },
      { headers: { "X-Reauth-Token": reauthToken } }
    );
  },

  // ── Super Admin Invites ─────────────────────────────────────────────

  async getInvites(): Promise<SuperAdminInviteRecord[]> {
    const { data } = await api.get<{ invites: BackendInvite[] }>("/auth/invites");
    return data.invites.map((invite) => ({
      id: invite.id,
      firstName: invite.firstName,
      lastName: invite.lastName,
      email: invite.email,
      role: invite.superAdminRole,
      invitedBy: invite.invitedByName,
      invitedAt: invite.createdAt,
    }));
  },

  async createInvite(
    payload: { firstName: string; lastName: string; email: string; role: SuperAdminRole },
    reauthToken: string
  ): Promise<void> {
    await api.post(
      "/auth/invites",
      {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        superAdminRole: payload.role,
      },
      { headers: { "X-Reauth-Token": reauthToken } }
    );
  },

  async resendInvite(inviteId: string): Promise<void> {
    await api.post(`/auth/invites/${inviteId}/resend`);
  },

  async cancelInvite(inviteId: string): Promise<void> {
    await api.delete(`/auth/invites/${inviteId}`);
  },

  // ── Platform Settings ───────────────────────────────────────────────

  async getPlatformSettings(): Promise<PlatformSettings> {
    const { data } = await api.get<{ settings: PlatformSettings }>("/settings/platform");
    return data.settings;
  },

  async updateJobRules(changes: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const { data } = await api.patch<{ settings: PlatformSettings }>("/settings/platform/rules", changes);
    return data.settings;
  },

  async updateJobPayments(
    changes: Pick<PlatformSettings, "paymentSchedule" | "bonusPercent" | "rejectionChargePercent">,
    reauthToken: string
  ): Promise<PlatformSettings> {
    const { data } = await api.put<{ settings: PlatformSettings }>(
      "/settings/platform/payments",
      changes,
      { headers: { "X-Reauth-Token": reauthToken } }
    );
    return data.settings;
  },

  // ── Plans & Pricing ─────────────────────────────────────────────────

  async getPlans(): Promise<{ plans: PricingPlan[]; discountPercent: number }> {
    const { data } = await api.get<{ plans: BackendPlanView[]; discountPercent: number }>("/plans");
    const plans: PricingPlan[] = data.plans.map((p) => {
      const template = PRICING_PLANS.find((tpl) => tpl.id === p.id);
      return {
        id: p.id,
        tierNumber: p.tierNumber,
        name: p.name,
        targetAudience: p.targetAudience,
        monthlyPrice: Math.round(p.monthlyPriceKobo / 100),
        annualPrice: Math.round(p.annualPriceKobo / 100),
        maxConcurrentJobs: p.maxConcurrentJobs,
        features: p.features,
        buttonText: template?.buttonText ?? `Choose ${p.name}`,
        ctaUrl: template?.ctaUrl ?? `/sign-up?plan=${p.id}`,
        defaultStaffRange: template?.defaultStaffRange ?? "1",
      };
    });
    return { plans, discountPercent: data.discountPercent };
  },

  async updatePlan(planId: string, changes: PlanChanges): Promise<void> {
    await api.put(`/settings/plans/${planId}`, {
      targetAudience: changes.targetAudience,
      monthlyPriceKobo: Math.round(changes.monthlyPrice * 100),
      annualPriceKobo: Math.round(changes.annualPrice * 100),
      maxConcurrentJobs: changes.maxConcurrentJobs,
      features: changes.features,
    });
  },

  async updatePlanOffer(discountPercent: number): Promise<void> {
    await api.put("/settings/plan-offer", { discountPercent });
  },

  // ── API Keys ────────────────────────────────────────────────────────

  async getApiKeys(): Promise<ApiKey[]> {
    const { data } = await api.get<{ apiKeys: BackendApiKey[] }>("/settings/api-keys");
    return data.apiKeys.map((key) => ({
      id: key.id,
      provider: key.provider,
      name: key.name,
      mode: key.mode,
      publicKey: key.publicKey,
      secretKeyLast4: key.secretKeyLast4,
      hasEncryptionKey: key.hasEncryptionKey,
      hasWebhookSecret: key.hasWebhookSecret,
      isActive: key.isActive,
      addedBy: key.addedByName,
      addedAt: key.createdAt,
    }));
  },

  async addApiKey(draft: ApiKeyDraft, reauthToken: string): Promise<void> {
    await api.post(
      "/settings/api-keys",
      {
        provider: draft.provider,
        name: draft.name,
        mode: draft.mode,
        publicKey: draft.publicKey ?? undefined,
        secretKey: draft.secretKey,
        encryptionKey: draft.encryptionKey || undefined,
        webhookSecret: draft.webhookSecret || undefined,
        isActive: draft.isActive,
      },
      { headers: { "X-Reauth-Token": reauthToken } }
    );
  },

  async activateApiKey(keyId: string, reauthToken: string): Promise<void> {
    await api.post(
      `/settings/api-keys/${keyId}/activate`,
      {},
      { headers: { "X-Reauth-Token": reauthToken } }
    );
  },

  async removeApiKey(keyId: string, reauthToken: string): Promise<void> {
    await api.delete(`/settings/api-keys/${keyId}`, {
      headers: { "X-Reauth-Token": reauthToken },
    });
  },
};
