"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { walletService, type ApiWalletTransaction } from "@/lib/services/walletService";
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
// Transactions load a page at a time (newest first); older ones on request.
// ─────────────────────────────────────────────────────────────────────────────

/** How many transactions each page of the history loads. */
const TRANSACTIONS_PAGE_SIZE = 50;

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
    pendingWithdrawal?: { amountKobo: number; reference: string; createdAt: string } | null;
    withdrawalFee?: WithdrawalFee;
}

/**
 * The transfer fee on a withdrawal (SHOP_IMPLEMENTATION.md 3.5): the fee of
 * the first tier the amount fits ("up to" inclusive, null for no limit), from
 * `startsAt` (null: not charged). Kobo. Mirrors withdrawalFeeFor in
 * mande-backend's constants/payments.ts.
 */
export type WithdrawalFee = { startsAt: string | null; tiers: { upToKobo: number | null; feeKobo: number }[] };

/** The fee on withdrawing `amountKobo` now. */
export function withdrawalFeeFor(amountKobo: number, fee: WithdrawalFee | null | undefined, now = new Date()): number {
    if (!fee?.startsAt || new Date(fee.startsAt) > now) return 0;
    return fee.tiers.find((tier) => tier.upToKobo === null || amountKobo <= tier.upToKobo)?.feeKobo ?? 0;
}

/** A wallet transaction, with which way the money went and how a withdrawal stands. */
export type WalletTransaction = ManufacturerTransaction & {
    direction: "credit" | "debit";
    status: "pending" | "completed" | "failed";
    /** Why a withdrawal failed, in words the manufacturer can read. */
    failureReason: string | null;
};

/** A withdrawal still on its way to the bank. Amount in naira. */
export type PendingWithdrawal = { amount: number; reference: string; createdAt: string };

export type ManufacturerWalletWithLedger = ManufacturerWallet & {
    transactions: WalletTransaction[];
    /** Money owed (rejection charges the balance didn't cover), in naira. */
    owed: number;
    pendingWithdrawal: PendingWithdrawal | null;
    withdrawalFee: WithdrawalFee | null;
};

/** The ledger's types, as the app's transaction types. A reversal puts money back, like a payment. */
function toTransactionType(type: string): ManufacturerTransaction["type"] {
    if (type === "withdrawal" || type === "subscription") return type;
    if (type === "rejection_charge" || type === "shop_refund" || type === "withdrawal_fee") return "charge";
    return "payment";
}

function toWalletTransaction(t: ApiWalletTransaction): WalletTransaction {
    const type = toTransactionType(t.type);
    const status = t.status === "pending" || t.status === "failed" ? t.status : "completed";
    return {
        id: t.id,
        type,
        direction: t.direction ?? (type === "payment" ? "credit" : "debit"),
        status,
        failureReason: t.failureReason ?? null,
        label: t.description || t.type,
        projectName: t.jobTitle ?? null,
        date: t.createdAt ?? "",
        amount: (t.amountKobo ?? 0) / 100,
        ...(t.paidByCard && { paidByCard: true }),
    };
}

type ManufacturerWalletContextValue = {
    wallet: ManufacturerWalletWithLedger;
    isLoading?: boolean;
    /** True when the wallet or its transactions couldn't load. */
    isError?: boolean;
    /** Whether there are older transactions than the ones loaded. */
    hasOlderTransactions: boolean;
    /** Loads the next page of older transactions. */
    loadOlderTransactions: () => Promise<void>;
    isLoadingOlder: boolean;
    /** The last "show older" failed (the loaded ones stay). */
    isLoadOlderError: boolean;
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

    const transactionsQuery = useInfiniteQuery({
        queryKey: queryKeys.wallet.transactions({ limit: TRANSACTIONS_PAGE_SIZE }),
        queryFn: ({ pageParam }) =>
            walletService.getTransactions({
                limit: TRANSACTIONS_PAGE_SIZE,
                ...(pageParam && { before: pageParam }),
            }),
        initialPageParam: "" as string,
        getNextPageParam: (lastPage) => lastPage.nextBefore ?? undefined,
        retry: false,
    });
    const {
        data: serverTransactions,
        isPending: isTxPending,
        isError: isTxError,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        isFetchNextPageError,
    } = transactionsQuery;

    const wallet: ManufacturerWalletWithLedger = useMemo(() => {
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

        const transactions = (serverTransactions?.pages ?? []).flatMap((page) =>
            page.transactions.map(toWalletTransaction),
        );

        const pending = serverWallet?.pendingWithdrawal;
        return {
            balance,
            bankAccount,
            transactions,
            owed: (serverWallet?.owedKobo ?? 0) / 100,
            pendingWithdrawal: pending
                ? { amount: pending.amountKobo / 100, reference: pending.reference, createdAt: pending.createdAt }
                : null,
            withdrawalFee: serverWallet?.withdrawalFee ?? null,
        };
    }, [serverWallet, serverTransactions]);

    const loadOlderTransactions = useCallback(async () => {
        await fetchNextPage();
    }, [fetchNextPage]);

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
        () => ({
            wallet,
            isLoading,
            isError,
            hasOlderTransactions: hasNextPage,
            loadOlderTransactions,
            isLoadingOlder: isFetchingNextPage,
            isLoadOlderError: isFetchNextPageError,
            setBankAccount,
            withdraw,
        }),
        [wallet, isLoading, isError, hasNextPage, loadOlderTransactions, isFetchingNextPage, isFetchNextPageError, setBankAccount, withdraw],
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
