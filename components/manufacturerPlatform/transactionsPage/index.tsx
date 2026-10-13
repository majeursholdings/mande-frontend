"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TRANSACTION_SORT_OPTIONS, getCurrentJobsWorth } from "@/constant/manufacturer";
import { getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { walletService } from "@/lib/services/walletService";
import { useManufacturerWallet } from "../dashboardLayout/manufacturerWalletContext";
import { SortByDropdown } from "../jobsPage/sortByDropdown";
import EmptyState from "../dashboardPage/emptyState";
import LoadError from "../loadError";
import PageHeader from "../pageHeader";
import BalanceCard from "./balanceCard";
import TransactionsList, { sortTransactions } from "./transactionsList";
import WalletActions from "./walletActions";
import WalletSummary, { getWalletFigures } from "./walletSummary";
import { useMyJobList } from "@/components/manufacturerPlatform/dashboardLayout/useManufacturerJobLists";

export default function ManufacturerTransactionsPage() {
    const {
        wallet,
        isLoading: isWalletLoading,
        isError: isWalletError,
        hasOlderTransactions,
        loadOlderTransactions,
        isLoadingOlder,
        isLoadOlderError,
    } = useManufacturerWallet();
    const [sortBy, setSortBy] = useState("");

    const { jobs: activeJobs, isPending: isJobsPending, isError: isJobsError } = useMyJobList();

    // The all-time totals come from the server: the history only loads a page at a time
    const summaryQuery = useQuery({
        queryKey: queryKeys.wallet.summary(),
        queryFn: () => walletService.getSummary(),
        retry: false,
    });

    const transactions = useMemo(
        () => sortTransactions(wallet.transactions, sortBy),
        [wallet.transactions, sortBy],
    );
    const hasTransactions = transactions.length > 0;

    const totals = summaryQuery.data;
    const figures = getWalletFigures({
        totals: totals
            ? {
                  earned: totals.earnedKobo / 100,
                  paymentCount: totals.counts.payment,
                  subscriptions: totals.subscriptionsKobo / 100,
                  subscriptionCount: totals.counts.subscription,
              }
            : null,
        currentJobs: isJobsError ? null : getCurrentJobsWorth(activeJobs),
    });

    const showOlder = async () => {
        try {
            await loadOlderTransactions();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't load older transactions. Please try again."));
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Transactions" />

            {/* The figures get their own row: the overview cards need the width */}
            <div className="flex flex-col gap-3">
                <WalletSummary figures={figures} isLoading={summaryQuery.isPending || isJobsPending} />
                {(summaryQuery.isError || isJobsError) && (
                    <LoadError>
                        {summaryQuery.isError && isJobsError
                            ? "Couldn't load your totals or current jobs. Please refresh the page to try again."
                            : summaryQuery.isError
                              ? "Couldn't load your totals. Please refresh the page to try again."
                              : "Couldn't load your current jobs. Please refresh the page to try again."}
                    </LoadError>
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-x-6">
                <BalanceCard
                    balance={wallet.balance}
                    owed={wallet.owed}
                    pendingWithdrawal={wallet.pendingWithdrawal?.amount ?? null}
                    isLoading={isWalletLoading}
                />
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
                    <>
                        <TransactionsList tableId="transactions" transactions={transactions} />
                        {isLoadOlderError && (
                            <LoadError>Couldn&apos;t load older transactions. Please try again.</LoadError>
                        )}
                        {hasOlderTransactions && (
                            <div className="flex justify-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={showOlder}
                                    disabled={isLoadingOlder}
                                >
                                    {isLoadingOlder ? "Loading older..." : "Show older"}
                                </Button>
                            </div>
                        )}
                    </>
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
