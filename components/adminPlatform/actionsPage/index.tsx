"use client";

import { useQuery } from "@tanstack/react-query";
import ActionsList, { type ActionGroupOption } from "@/components/common/actions/actionsList";
import AdminPageHeader from "@/components/adminPlatform/pageHeader";
import { queryKeys } from "@/lib/queryKeys";
import { actionsService } from "@/lib/services/actionsService";

const GROUPS: ActionGroupOption[] = [
    { value: "reviews", label: "Reviews due" },
    { value: "requests", label: "Requests" },
    { value: "risk", label: "Jobs at risk" },
    { value: "mande-stock", label: "MANDE stock" },
];

/** What's waiting on the signed-in project lead. `enabled` is off on the super admin platform, which has its own queue. */
export function useLeadActions(enabled = true) {
    return useQuery({ queryKey: queryKeys.actions.lead(), queryFn: () => actionsService.lead(), enabled, refetchInterval: 2 * 60 * 1000, staleTime: 30_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminActionsPage: everything waiting on a project lead, most urgent first:
// proof and finished work to review on their jobs (with the deadline),
// applications, requests for more time and fault reports, jobs past due or
// with nobody on them close to the start, and MANDE stock's orders.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminActionsPage() {
    const query = useLeadActions();
    return (
        <div className="flex flex-col gap-6">
            <AdminPageHeader title="Actions" description="What's waiting on you, on the jobs you lead and MANDE's shop orders. The most urgent is first." />
            <ActionsList
                data={query.data}
                isPending={query.isPending}
                isError={query.isError}
                groups={GROUPS}
                emptyDescription="Proof to review, applications, requests for more time, jobs at risk and MANDE's orders will show up here."
            />
        </div>
    );
}
