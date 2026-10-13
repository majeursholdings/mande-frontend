import { api } from "@/lib/api";

export interface SetBankAccountPayload {
  bankCode: string;
  accountNumber: string;
}

/** A wallet entry as GET /wallet/transactions sends it (plans paid by card are merged in, with `paidByCard`). */
export interface ApiWalletTransaction {
  id: string;
  type: "job_payment" | "bonus" | "withdrawal" | "subscription" | "rejection_charge" | "reversal" | string;
  direction?: "credit" | "debit";
  amountKobo?: number;
  balanceAfterKobo?: number | null;
  status?: "pending" | "completed" | "failed" | string;
  description?: string;
  jobId?: string | null;
  jobTitle?: string | null;
  reference?: string;
  failureReason?: string | null;
  paidByCard?: boolean;
  createdAt?: string;
}

export interface WalletTransactionsPage {
  transactions: ApiWalletTransaction[];
  /** Where the next, older page starts; null on the last page. */
  nextBefore: string | null;
}

/** All-time wallet totals from GET /wallet/summary (not a sum of loaded rows). Kobo. */
export interface WalletSummaryTotals {
  earnedKobo: number;
  withdrawnKobo: number;
  /** Plans paid from the wallet and by card. */
  subscriptionsKobo: number;
  chargesKobo: number;
  counts: { payment: number; withdrawal: number; subscription: number; charge: number };
}

export const walletService = {
  // ── Wallet & Transactions ───────────────────────────────────────────

  async getWallet() {
    const { data } = await api.get("/wallet");
    return data;
  },

  async getTransactions(params: { limit?: number; before?: string } = {}): Promise<WalletTransactionsPage> {
    const { data } = await api.get<WalletTransactionsPage>("/wallet/transactions", { params });
    return data;
  },

  async getSummary(): Promise<WalletSummaryTotals> {
    const { data } = await api.get<{ summary: WalletSummaryTotals }>("/wallet/summary");
    return data.summary;
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
