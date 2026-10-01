"use client";

import { useMemo, useState } from "react";
import { ReceiptText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    JOBS,
    MANUFACTURER_CARD_PLAN_PAYMENTS,
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
    const { wallet, isLoading: isWalletLoading } = useManufacturerWallet();
    const [sortBy, setSortBy] = useState("");

    const { data: jobsData, isPending: isJobsPending } = useQuery({
        queryKey: queryKeys.jobs.lists(),
        queryFn: () => jobsService.getMyJobs(),
    });

    const activeJobs: Job[] = useMemo(() => {
        if (jobsData?.jobs && jobsData.jobs.length > 0) {
            return jobsData.jobs.map((j: ApiJobPayload) => mapApiJobToManufacturerJob(j));
        }
        return isJobsPending ? [] : JOBS;
    }, [jobsData, isJobsPending]);

    const transactions = useMemo(
        () => sortTransactions(wallet.transactions, sortBy),
        [wallet.transactions, sortBy],
    );
    const hasTransactions = transactions.length > 0;

    const summary = getTransactionSummary([...wallet.transactions, ...MANUFACTURER_CARD_PLAN_PAYMENTS]);
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

                {isWalletLoading ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5 animate-pulse">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <div className="flex flex-col gap-1.5">
                                    <div className="h-4 w-40 rounded bg-mist-200" />
                                    <div className="h-3 w-24 rounded bg-mist-100" />
                                </div>
                                <div className="h-5 w-20 rounded bg-mist-100" />
                            </div>
                        ))}
                    </div>
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
