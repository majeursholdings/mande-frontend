"use client";

import { useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import {
    JOBS,
    MANUFACTURER_CARD_PLAN_PAYMENTS,
    TRANSACTION_SORT_OPTIONS,
    getCurrentJobsWorth,
    getTransactionSummary,
} from "@/constant/manufacturer";
import { useManufacturerWallet } from "../dashboardLayout/manufacturerWalletContext";
import { SortByDropdown } from "../jobsPage/sortByDropdown";
import EmptyState from "../dashboardPage/emptyState";
import PageHeader from "../pageHeader";
import BalanceCard from "./balanceCard";
import TransactionsList, { sortTransactions } from "./transactionsList";
import WalletActions from "./walletActions";
import WalletSummary, { getWalletFigures } from "./walletSummary";

export default function ManufacturerTransactionsPage() {
    const { wallet } = useManufacturerWallet();
    const [sortBy, setSortBy] = useState("");
    const transactions = useMemo(
        () => sortTransactions(wallet.transactions, sortBy),
        [wallet.transactions, sortBy],
    );
    const hasTransactions = transactions.length > 0;
    // Plans paid by card aren't wallet transactions, but they're money spent on subscriptions too
    const summary = getTransactionSummary([...wallet.transactions, ...MANUFACTURER_CARD_PLAN_PAYMENTS]);
    const figures = getWalletFigures({
        earned: summary.earned,
        paymentCount: summary.counts.payment,
        subscriptions: summary.subscriptions,
        subscriptionCount: summary.counts.subscription,
        currentJobs: getCurrentJobsWorth(JOBS),
    });

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Transactions" />

            {/* The balance first and largest; beside it the other totals, then the
                bank account and withdraw cards (WalletActions renders those two as
                one grid cell, plus its dialogs) */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-x-6">
                <BalanceCard balance={wallet.balance} className="lg:row-span-2" />
                <WalletSummary figures={figures} />
                <WalletActions />
            </div>

            <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-base font-semibold font-text text-mist-950">
                        Transaction history
                    </h2>
                    {hasTransactions && (
                        <SortByDropdown
                            items={TRANSACTION_SORT_OPTIONS}
                            value={sortBy}
                            onChange={setSortBy}
                        />
                    )}
                </div>

                {hasTransactions ? (
                    <TransactionsList tableId="transactions" transactions={transactions} />
                ) : (
                    <EmptyState
                        icon={ReceiptText}
                        title="No Transactions"
                        description="There are no transactions to display"
                    />
                )}
            </section>
        </div>
    );
}
