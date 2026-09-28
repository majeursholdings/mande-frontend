"use client";

import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import {
    MANUFACTURER_WALLET,
    type ManufacturerBankAccount,
    type ManufacturerTransaction,
    type ManufacturerWallet,
} from "@/constant/manufacturer";

// ─────────────────────────────────────────────────────────────────────────────
// ManufacturerWalletProvider — the manufacturer's balance, payout bank account
// and transactions, kept together so a withdrawal lowers the balance and
// shows in the transactions list at once. Derives from live server data with
// fallback to defaults.
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
    setBankAccount: (bankAccount: ManufacturerBankAccount | null) => void;
    /** Takes `amount` off the balance and records it as a withdrawal. */
    withdraw: (amount: number) => void;
    /** Takes `amount` off the balance to pay for a plan, recorded as `label`. */
    payFromBalance: (amount: number, label: string) => void;
    /** Adds a job payment to the balance — once per `id`, however often it's released again. */
    receivePayment: (payment: { id: string; amount: number; label: string; projectName: string }) => void;
};

const ManufacturerWalletContext = createContext<ManufacturerWalletContextValue | null>(null);

export function ManufacturerWalletProvider({ children }: { children: ReactNode }) {
    const [bankAccountOverride, setBankAccountOverride] = useState<ManufacturerBankAccount | null | undefined>(undefined);
    const [balanceDelta, setBalanceDelta] = useState(0);
    const [localTransactions, setLocalTransactions] = useState<ManufacturerTransaction[]>([]);

    const { data: serverWallet } = useQuery({
        queryKey: queryKeys.wallet.details(),
        queryFn: async () => {
            const { data } = await api.get<{ wallet: ApiWalletData }>("/wallet");
            return data.wallet;
        },
        retry: false,
    });

    const { data: serverTransactions } = useQuery({
        queryKey: queryKeys.wallet.transactions(),
        queryFn: async () => {
            const { data } = await api.get<{ transactions: ApiTransactionItem[] }>("/wallet/transactions");
            return data.transactions;
        },
        retry: false,
    });

    const wallet: ManufacturerWallet = useMemo(() => {
        const baseBalance = serverWallet ? (serverWallet.balanceKobo ?? 0) / 100 : MANUFACTURER_WALLET.balance;

        const baseBankAccount: ManufacturerBankAccount | null = serverWallet?.bankAccount
            ? {
                  bankCode: serverWallet.bankAccount.bankCode,
                  bankName: serverWallet.bankAccount.bankName,
                  accountNumber: `•••• ${serverWallet.bankAccount.accountNumberLast4}`,
                  accountName: serverWallet.bankAccount.accountName,
                  currency: (serverWallet.bankAccount.currency as "NGN") || "NGN",
              }
            : MANUFACTURER_WALLET.bankAccount;

        const baseTransactions: ManufacturerTransaction[] =
            serverTransactions && serverTransactions.length > 0
                ? serverTransactions.map((t) => ({
                      id: t.id,
                      type: (t.type === "withdrawal" || t.type === "subscription" ? t.type : "payment") as ManufacturerTransaction["type"],
                      label: t.description || t.type,
                      projectName: null,
                      date: t.createdAt ?? "",
                      amount: (t.amountKobo ?? 0) / 100,
                  }))
                : MANUFACTURER_WALLET.transactions;

        return {
            balance: Math.max(0, baseBalance + balanceDelta),
            bankAccount: bankAccountOverride !== undefined ? bankAccountOverride : baseBankAccount,
            transactions: [...localTransactions, ...baseTransactions],
        };
    }, [serverWallet, serverTransactions, balanceDelta, bankAccountOverride, localTransactions]);

    const setBankAccount = (bankAccount: ManufacturerBankAccount | null) => {
        setBankAccountOverride(bankAccount);
    };

    const debit = (amount: number, type: ManufacturerTransaction["type"], label: string) => {
        const transaction: ManufacturerTransaction = {
            id: `txn-${Date.now()}`,
            type,
            label,
            projectName: null,
            date: new Date().toISOString(),
            amount,
        };
        setBalanceDelta((delta) => delta - amount);
        setLocalTransactions((prev) => [transaction, ...prev]);
    };

    const receivePayment = ({ id, amount, label, projectName }: { id: string; amount: number; label: string; projectName: string }) => {
        setLocalTransactions((prev) => {
            if (prev.some((t) => t.id === id) || wallet.transactions.some((t) => t.id === id)) {
                return prev;
            }
            const transaction: ManufacturerTransaction = {
                id,
                type: "payment",
                label,
                projectName,
                date: new Date().toISOString(),
                amount,
            };
            return [transaction, ...prev];
        });
        setBalanceDelta((delta) => delta + amount);
    };

    const value: ManufacturerWalletContextValue = {
        wallet,
        setBankAccount,
        withdraw: (amount) => debit(amount, "withdrawal", "Withdrawal to bank account"),
        payFromBalance: (amount, label) => debit(amount, "subscription", label),
        receivePayment,
    };

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
