"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { StatusTone } from "@/components/customTable";
import { queryKeys } from "@/lib/queryKeys";

/** What the account dialogs need of the project lead the page shows. */
export type LeadAccount = {
    /** The database id the API calls take. */
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    position: string | null;
    status: string;
};

const STATUS_LABELS: Record<string, { label: string; tone: StatusTone }> = {
    active: { label: "Active", tone: "green" },
    deactivated: { label: "Deactivated", tone: "red" },
    pending_verification: { label: "Email not verified", tone: "amber" },
};

/** The account status as a label and a badge tone. */
export function getLeadStatus(status: string | null | undefined) {
    return STATUS_LABELS[status ?? "active"] ?? { label: status ?? "Unknown", tone: "gray" as StatusTone };
}

/**
 * Reloads the lead on this page (keyed by `pageLeadId`, the id in the URL) and
 * every project leads list (and the jobs, which deactivating reassigns), after their account changes.
 */
export function useRefreshLead(pageLeadId: string) {
    const queryClient = useQueryClient();
    return useCallback(
        () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ["staff", "lead", pageLeadId] }),
                queryClient.invalidateQueries({ queryKey: [...queryKeys.staff.all, "project-leads"] }),
                // Deactivating moves their jobs to the replacement lead
                queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all }),
            ]),
        [queryClient, pageLeadId],
    );
}
