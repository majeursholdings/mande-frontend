"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
    MANUFACTURER_WALLET,
    type ManufacturerBankAccount,
    type ManufacturerTransaction,
    type ManufacturerWallet,
} from "@/constant/manufacturer";

// ─────────────────────────────────────────────────────────────────────────────
// ManufacturerWalletProvider — the manufacturer's balance, payout bank account
// and transactions, kept together so a withdrawal lowers the balance and
// shows in the transactions list at once. Seeded from sample data and updated
// locally for now; once the backend is connected, start from
// EMPTY_MANUFACTURER_WALLET, load the wallet from the API, and let the API
// perform these actions (update local state from its responses).
// ─────────────────────────────────────────────────────────────────────────────

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
    const [wallet, setWallet] = useState(MANUFACTURER_WALLET);

    const setBankAccount = (bankAccount: ManufacturerBankAccount | null) =>
        setWallet((current) => ({ ...current, bankAccount }));

    const debit = (amount: number, type: ManufacturerTransaction["type"], label: string) => {
        const transaction: ManufacturerTransaction = {
            id: `txn-${Date.now()}`,
            type,
            label,
            projectName: null,
            date: new Date().toISOString(),
            amount,
        };
        setWallet((current) => ({
            ...current,
            balance: current.balance - amount,
            transactions: [transaction, ...current.transactions],
        }));
    };

    const receivePayment = ({ id, amount, label, projectName }: { id: string; amount: number; label: string; projectName: string }) =>
        setWallet((current) =>
            current.transactions.some((transaction) => transaction.id === id)
                ? current
                : {
                      ...current,
                      balance: current.balance + amount,
                      transactions: [
                          { id, type: "payment", label, projectName, date: new Date().toISOString(), amount },
                          ...current.transactions,
                      ],
                  },
        );

    const withdraw = (amount: number) => debit(amount, "withdrawal", "Withdrawal");
    const payFromBalance = (amount: number, label: string) =>
        debit(amount, "subscription", label);

    return (
        <ManufacturerWalletContext.Provider
            value={{ wallet, setBankAccount, withdraw, payFromBalance, receivePayment }}
        >
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
