"use client";

import { useQuery } from "@tanstack/react-query";
import ActionsList, { type ActionGroupOption } from "@/components/common/actions/actionsList";
import { queryKeys } from "@/lib/queryKeys";
import { actionsService } from "@/lib/services/actionsService";
import PageHeader from "../pageHeader";

const GROUPS: ActionGroupOption[] = [
    { value: "jobs", label: "Jobs" },
    { value: "shop", label: "Shop" },
    { value: "account", label: "Account" },
];

/** What's waiting on the signed-in manufacturer: the Actions page, and the count in the menu and top bar. */
export function useMyActions() {
    return useQuery({ queryKey: queryKeys.actions.mine(), queryFn: () => actionsService.mine(), refetchInterval: 2 * 60 * 1000, staleTime: 30_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// ManufacturerActionsPage: everything waiting on the manufacturer, most
// urgent first: offers to answer, proof to send or redo, finished or rejected
// work, jobs past due; orders to fulfil and products off the shop; and their
// identity, plan and money owed. Each links to where it's done, and leaves
// the list once it is.
// ─────────────────────────────────────────────────────────────────────────────

export default function ManufacturerActionsPage() {
    const query = useMyActions();
    return (
        <div className="flex flex-col gap-6">
            <PageHeader title="Actions" description="What's waiting on you, across your jobs, your shop and your account. The most urgent is first." />
            <ActionsList
                data={query.data}
                isPending={query.isPending}
                isError={query.isError}
                groups={GROUPS}
                emptyDescription="Offers, proof to send, shop orders and anything your account needs will show up here."
            />
        </div>
    );
}
