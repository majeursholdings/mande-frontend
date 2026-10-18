import { api } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// What's waiting on the signed-in person: the manufacturer's and the project
// lead's Actions pages (the super admin's queue is reportsService's). The API
// works each list out fresh, most urgent first, and every item links to where
// it's done.
// ─────────────────────────────────────────────────────────────────────────────

export type ActionGroup = "jobs" | "shop" | "account" | "reviews" | "requests" | "risk" | "mande-stock";

export type ActionItem = {
    id: string;
    group: ActionGroup;
    kind: string;
    title: string;
    detail: string;
    /** The deadline, when there is one. */
    dueAt: string | null;
    /** Since when it's been waiting. */
    since: string | null;
    urgent: boolean;
    link: { label: string; href: string };
};

export type ActionsResponse = { actions: ActionItem[]; counts: { total: number; byGroup: Partial<Record<ActionGroup, number>> } };

export const actionsService = {
    /** A manufacturer's: jobs, shop and account. */
    async mine(): Promise<ActionsResponse> {
        const { data } = await api.get<ActionsResponse>("/actions/mine");
        return data;
    },

    /** A project lead's: reviews due, requests, jobs at risk and MANDE stock's orders. */
    async lead(): Promise<ActionsResponse> {
        const { data } = await api.get<ActionsResponse>("/actions/lead");
        return data;
    },
};
