"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { walletService } from "@/lib/services/walletService";
import {
    EMPTY_MANUFACTURER_WALLET,
    type ManufacturerBankAccount,
    type ManufacturerTransaction,
    type ManufacturerWallet,
} from "@/constant/manufacturer";

// ─────────────────────────────────────────────────────────────────────────────
// ManufacturerWalletProvider — the manufacturer's balance, payout bank account
// and transactions, straight from the server. Nothing is changed locally ahead
// of the server: money only moves once the API says it has, and each change
// refetches the wallet. Until it loads (or if it can't), the wallet is empty.
// ─────────────────────────────────────────────────────────────────────────────

interface ApiWalletData {
    balanceKobo?: number;
    owedKobo?: number;
    currency?: string;
    bankAccount?: {
        bankCode: string;
        bankName: string;
        accountNumberLast4: string;
        accountName: string;
        currency: string;
    } | null;
}

interface ApiTransactionItem {
    id: string;
    type: string;
    direction?: "credit" | "debit";
    amountKobo?: number;
    balanceAfterKobo?: number;
    status?: string;
    description?: string;
    jobId?: string | null;
    reference?: string;
    createdAt?: string;
}

type ManufacturerWalletContextValue = {
    wallet: ManufacturerWallet;
    isLoading?: boolean;
    /** True when the wallet or its transactions couldn't load. */
    isError?: boolean;
    /** Saves (or, with null, removes) the payout account. Rejects if the server doesn't. */
    setBankAccount: (bankAccount: ManufacturerBankAccount | null) => Promise<void>;
    /** Asks the server to send `amount` (naira) to the bank. Rejects if it doesn't. */
    withdraw: (amount: number, reauthToken: string) => Promise<void>;
};

const ManufacturerWalletContext = createContext<ManufacturerWalletContextValue | null>(null);

export function ManufacturerWalletProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    const { data: serverWallet, isPending: isWalletPending, isError: isWalletError } = useQuery({
        queryKey: queryKeys.wallet.details(),
        queryFn: async () => {
            const { data } = await api.get<{ wallet: ApiWalletData }>("/wallet");
            return data.wallet;
        },
        retry: false,
    });

    const { data: serverTransactions, isPending: isTxPending, isError: isTxError } = useQuery({
        queryKey: queryKeys.wallet.transactions(),
        queryFn: async () => {
            const { data } = await api.get<{ transactions: ApiTransactionItem[] }>("/wallet/transactions");
            return data.transactions;
        },
        retry: false,
    });

    const wallet: ManufacturerWallet = useMemo(() => {
        const balance = serverWallet ? (serverWallet.balanceKobo ?? 0) / 100 : EMPTY_MANUFACTURER_WALLET.balance;

        const bankAccount: ManufacturerBankAccount | null = serverWallet?.bankAccount
            ? {
                  bankCode: serverWallet.bankAccount.bankCode,
                  bankName: serverWallet.bankAccount.bankName,
                  accountNumber: `•••• ${serverWallet.bankAccount.accountNumberLast4}`,
                  accountName: serverWallet.bankAccount.accountName,
                  currency: (serverWallet.bankAccount.currency as "NGN") || "NGN",
              }
            : null;

        const transactions: ManufacturerTransaction[] = serverTransactions
                ? serverTransactions.map((t) => ({
                      id: t.id,
                      type: (t.type === "withdrawal" || t.type === "subscription" ? t.type : "payment") as ManufacturerTransaction["type"],
                      label: t.description || t.type,
                      projectName: null,
                      date: t.createdAt ?? "",
                      amount: (t.amountKobo ?? 0) / 100,
                  }))
                : [];

        return { balance, bankAccount, transactions };
    }, [serverWallet, serverTransactions]);

    const setBankAccount = useCallback(
        async (bankAccount: ManufacturerBankAccount | null) => {
            if (bankAccount) {
                await walletService.setBankAccount({
                    bankCode: bankAccount.bankCode,
                    accountNumber: bankAccount.accountNumber.replace(/\D/g, ""),
                });
            } else {
                await walletService.removeBankAccount();
            }
            await queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
        },
        [queryClient],
    );

    const withdraw = useCallback(
        async (amount: number, reauthToken: string) => {
            await walletService.requestWithdrawal(Math.round(amount * 100), reauthToken);
            await queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
        },
        [queryClient],
    );

    const isLoading = isWalletPending || isTxPending;
    const isError = isWalletError || isTxError;

    const value: ManufacturerWalletContextValue = useMemo(
        () => ({ wallet, isLoading, isError, setBankAccount, withdraw }),
        [wallet, isLoading, isError, setBankAccount, withdraw],
    );

    return (
        <ManufacturerWalletContext.Provider value={value}>
            {children}
        </ManufacturerWalletContext.Provider>
    );
}

export function useManufacturerWallet() {
    const context = useContext(ManufacturerWalletContext);
    if (!context) {
        throw new Error("useManufacturerWallet must be used within a ManufacturerWalletProvider");
    }
    return context;
}
