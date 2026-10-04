"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService, type AccountStanding } from "@/lib/services/manufacturerService";
import { getAccountHold, type AccountAppealRecord, type AccountStatusEventRecord, type ManufacturerAccountStatus } from "@/constant/platformRecords";

// ─────────────────────────────────────────────────────────────────────────────
// ManufacturerAccountProvider — whether an admin has flagged or suspended
// the account, from the API. Flagged: they can hold one job at a time.
// Suspended: the whole account is paused (see AccountGate) — all they can do
// is send an appeal and see what came of it, one appeal at a time. While the
// standing loads, isLoading is true (AccountGate waits); if it can't load,
// the account reads as active with no history, and the API still enforces it.
// ─────────────────────────────────────────────────────────────────────────────

type ManufacturerAccount = {
    accountStatus: ManufacturerAccountStatus;
    statusHistory: AccountStatusEventRecord[];
    appeals: AccountAppealRecord[];
};

const NO_STANDING: ManufacturerAccount = { accountStatus: "active", statusHistory: [], appeals: [] };

type ManufacturerAccountContextValue = ManufacturerAccount & {
    /** True until the standing has loaded from the API. */
    isLoading: boolean;
    isSuspended: boolean;
    isFlagged: boolean;
    /** The flag or suspension on the account now. Null while it's active. */
    hold: AccountStatusEventRecord | null;
    /** Their appeal still waiting for an admin, if any. */
    pendingAppeal: AccountAppealRecord | undefined;
    /** Sends an appeal to the API; it refuses unless suspended with no appeal waiting. */
    sendAppeal: (appeal: Pick<AccountAppealRecord, "message" | "attachments">) => Promise<void>;
};

const ManufacturerAccountContext = createContext<ManufacturerAccountContextValue | null>(null);

/** The API's standing, in the shape the account screens use. */
function toAccount(standing: AccountStanding): ManufacturerAccount {
    return {
        accountStatus: standing.accountStatus,
        statusHistory: standing.statusHistory.map((event) => ({
            status: event.status,
            reason: event.reason,
            by: event.byName,
            at: event.at,
        })),
        appeals: standing.appeals.map((appeal) => ({
            id: appeal.id,
            message: appeal.message,
            attachments: appeal.attachments.flatMap((file) =>
                file ? [{ name: file.name ?? "Attachment", url: file.url ?? "", kind: file.kind, publicId: file.publicId }] : [],
            ),
            sentAt: appeal.sentAt,
            status: appeal.status,
            response: appeal.response,
            decidedBy: appeal.decidedByName,
            decidedAt: appeal.decidedAt,
        })),
    };
}

export function ManufacturerAccountProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { data, isPending } = useQuery({
        queryKey: queryKeys.account.standing(),
        queryFn: async () => (await manufacturerService.getAccountStatus()).account,
        retry: false,
    });
    const account = useMemo(() => (data ? toAccount(data) : NO_STANDING), [data]);

    const sendAppeal = useCallback(
        async (appeal: Pick<AccountAppealRecord, "message" | "attachments">) => {
            const attachments = appeal.attachments
                .filter((file) => !!file.publicId)
                .map((file) => ({ publicId: file.publicId!, name: file.name }));
            const { account: standing } = await manufacturerService.submitAppeal({
                message: appeal.message,
                ...(attachments.length > 0 && { attachments }),
            });
            queryClient.setQueryData(queryKeys.account.standing(), standing);
        },
        [queryClient],
    );

    const value: ManufacturerAccountContextValue = useMemo(
        () => ({
            ...account,
            isLoading: isPending,
            isSuspended: account.accountStatus === "suspended",
            isFlagged: account.accountStatus === "flagged",
            hold: getAccountHold(account),
            pendingAppeal: account.appeals.find((appeal) => appeal.status === "pending"),
            sendAppeal,
        }),
        [account, isPending, sendAppeal],
    );

    return <ManufacturerAccountContext.Provider value={value}>{children}</ManufacturerAccountContext.Provider>;
}

export function useManufacturerAccount() {
    const context = useContext(ManufacturerAccountContext);
    if (!context) {
        throw new Error("useManufacturerAccount must be used within a ManufacturerAccountProvider");
    }
    return context;
}
