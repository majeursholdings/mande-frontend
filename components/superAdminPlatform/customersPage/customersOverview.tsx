"use client";

import { useQuery } from "@tanstack/react-query";
import { UserCheck, UserX, UsersRound, Wallet } from "lucide-react";
import OverviewCard, { OverviewCardGrid } from "@/components/common/overviewCard";
import { ReportError } from "@/components/adminPlatform/dashboardPage/reportStates";
import { formatCompactPrice, formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { customerService } from "@/lib/services/customerService";

/** Above the customers: how many there are, how many can shop, how many are deactivated, and the store credit they hold. */
export default function CustomersOverview() {
    const query = useQuery({ queryKey: queryKeys.customers.summary(), queryFn: customerService.getSummary, staleTime: 60_000 });
    if (query.isError) return <ReportError message="Couldn't load the customer numbers. Please refresh to try again." />;
    const summary = query.data;
    const loading = query.isPending;

    return (
        <OverviewCardGrid>
            <OverviewCard
                icon={UsersRound}
                label="Customers"
                value={(summary?.total ?? 0).toLocaleString()}
                detail={{ label: "Joined in 30 days", value: (summary?.joinedLast30Days ?? 0).toLocaleString(), tone: "blue" }}
                loading={loading}
            />
            <OverviewCard
                icon={UserCheck}
                label="Active"
                value={(summary?.active ?? 0).toLocaleString()}
                detail={{ label: "Unverified", value: (summary?.unverified ?? 0).toLocaleString(), tone: "amber" }}
                loading={loading}
            />
            <OverviewCard
                icon={UserX}
                label="Deactivated"
                value={(summary?.deactivated ?? 0).toLocaleString()}
                detail={{ label: "Of all customers", value: summary?.total ? `${Math.round((summary.deactivated / summary.total) * 100)}%` : "0%", tone: "red" }}
                loading={loading}
            />
            <OverviewCard
                icon={Wallet}
                label="Store credit held"
                value={formatCompactPrice(fromKobo(summary?.creditHeldKobo ?? 0))}
                fullValue={formatPrice(fromKobo(summary?.creditHeldKobo ?? 0))}
                detail={{ label: "Customers with credit", value: (summary?.creditHolders ?? 0).toLocaleString(), tone: "green" }}
                loading={loading}
            />
        </OverviewCardGrid>
    );
}
