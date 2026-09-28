import { api } from "@/lib/api";

export interface AddBankAccountPayload {
  accountNumber: string;
  bankCode: string;
  accountName: string;
}

export interface RequestWithdrawalPayload {
  amountKobo: number;
  bankAccountId: string;
}

export const walletService = {
  // ── Wallet & Transactions ───────────────────────────────────────────

  async getWallet() {
    const { data } = await api.get("/wallet");
    return data;
  },

  async getTransactions(params: { page?: number; limit?: number; type?: string; from?: string; to?: string } = {}) {
    const { data } = await api.get("/wallet/transactions", { params });
    return data;
  },

  // ── Bank Accounts ──────────────────────────────────────────────────

  async getBankAccounts() {
    const { data } = await api.get("/wallet/bank-accounts");
    return data;
  },

  async addBankAccount(payload: AddBankAccountPayload) {
    const { data } = await api.post("/wallet/bank-accounts", payload);
    return data;
  },

  async deleteBankAccount(bankAccountId: string) {
    const { data } = await api.delete(`/wallet/bank-accounts/${bankAccountId}`);
    return data;
  },

  // ── Withdrawals ────────────────────────────────────────────────────

  async requestWithdrawal(payload: RequestWithdrawalPayload) {
    const { data } = await api.post("/wallet/withdrawals", payload);
    return data;
  },

  async confirmWithdrawal(withdrawalId: string, code: string) {
    const { data } = await api.post(`/wallet/withdrawals/${withdrawalId}/confirm`, { code });
    return data;
  },
};

export const subscriptionService = {
  // ── Plans & Subscriptions ──────────────────────────────────────────

  async getPublicPlans() {
    const { data } = await api.get("/plans");
    return data;
  },

  async startCheckout(payload: { planId: string; billingCycle: "monthly" | "annual"; returnPath?: string }) {
    const { data } = await api.post<{ checkoutUrl: string; reference: string }>("/subscription/checkout", payload);
    return data;
  },

  async confirmPayment(reference: string) {
    const { data } = await api.post(`/subscription/payments/${reference}/confirm`);
    return data;
  },

  async upgradePlan(planId: string, billingCycle: "monthly" | "annual") {
    const { data } = await api.post("/subscription/upgrade", { planId, billingCycle });
    return data;
  },

  async cancelPlan(reason?: string) {
    const { data } = await api.post("/subscription/cancel", { reason });
    return data;
  },
};
