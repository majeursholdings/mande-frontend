"use client";

import { useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    TRANSACTION_SORT_OPTIONS,
    getCurrentJobsWorth,
    getTransactionSummary,
    type Job,
} from "@/constant/manufacturer";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import { mapApiJobToManufacturerJob, type ApiJobPayload } from "@/lib/mappers/jobMappers";
import { useManufacturerWallet } from "../dashboardLayout/manufacturerWalletContext";
import { SortByDropdown } from "../jobsPage/sortByDropdown";
import EmptyState from "../dashboardPage/emptyState";
import PageHeader from "../pageHeader";
import BalanceCard from "./balanceCard";
import TransactionsList, { sortTransactions } from "./transactionsList";
import WalletActions from "./walletActions";
import WalletSummary, { getWalletFigures } from "./walletSummary";

export default function ManufacturerTransactionsPage() {
    const { wallet, isLoading: isWalletLoading, isError: isWalletError } = useManufacturerWallet();
    const [sortBy, setSortBy] = useState("");

    const { data: jobsData, isPending: isJobsPending } = useQuery({
        queryKey: queryKeys.jobs.lists(),
        queryFn: () => jobsService.getMyJobs(),
    });

    const activeJobs: Job[] = useMemo(() => {
        return (jobsData?.jobs ?? []).map((j: ApiJobPayload) => mapApiJobToManufacturerJob(j));
    }, [jobsData]);

    const transactions = useMemo(
        () => sortTransactions(wallet.transactions, sortBy),
        [wallet.transactions, sortBy],
    );
    const hasTransactions = transactions.length > 0;

    const summary = getTransactionSummary(wallet.transactions);
    const figures = getWalletFigures({
        earned: summary.earned,
        paymentCount: summary.counts.payment,
        subscriptions: summary.subscriptions,
        subscriptionCount: summary.counts.subscription,
        currentJobs: getCurrentJobsWorth(activeJobs),
    });

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Transactions" />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-x-6">
                <BalanceCard balance={wallet.balance} isLoading={isWalletLoading} className="lg:row-span-2" />
                <WalletSummary figures={figures} isLoading={isWalletLoading || isJobsPending} />
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

                {isWalletError ? (
                    <TransactionsList
                        tableId="transactions"
                        transactions={[]}
                        error="Couldn't load your transactions. Please refresh the page to try again."
                    />
                ) : isWalletLoading ? (
                    <TransactionsList tableId="transactions" transactions={[]} loading />
                ) : hasTransactions ? (
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
