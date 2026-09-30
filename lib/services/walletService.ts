import { api } from "@/lib/api";

export interface SetBankAccountPayload {
  bankCode: string;
  accountNumber: string;
}

export const walletService = {
  // ── Wallet & Transactions ───────────────────────────────────────────

  async getWallet() {
    const { data } = await api.get("/wallet");
    return data;
  },

  async getTransactions(params: { limit?: number; before?: string } = {}) {
    const { data } = await api.get("/wallet/transactions", { params });
    return data;
  },

  async listBanks() {
    const { data } = await api.get("/wallet/banks");
    return data;
  },

  // ── Bank Account ───────────────────────────────────────────────────

  async lookupBankAccount(bankCode: string, accountNumber: string) {
    const { data } = await api.post("/wallet/bank-account/lookup", { bankCode, accountNumber });
    return data;
  },

  async setBankAccount(payload: SetBankAccountPayload) {
    const { data } = await api.put("/wallet/bank-account", payload);
    return data;
  },

  async removeBankAccount() {
    const { data } = await api.delete("/wallet/bank-account");
    return data;
  },

  // ── Withdrawals ────────────────────────────────────────────────────

  async requestWithdrawal(amountKobo: number, reauthToken?: string) {
    const { data } = await api.post(
      "/wallet/withdrawals",
      { amountKobo },
      {
        headers: reauthToken ? { "X-Reauth-Token": reauthToken } : undefined,
      }
    );
    return data;
  },
};
