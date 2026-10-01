"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService, type AccountStanding } from "@/lib/services/manufacturerService";
import { MANUFACTURER_ACCOUNT } from "@/constant/manufacturer";
import { getAccountHold, type AccountAppealRecord, type AccountStatusEventRecord } from "@/constant/sampleDb";

// ─────────────────────────────────────────────────────────────────────────────
// ManufacturerAccountProvider — whether an admin has flagged or suspended
// the account, from the API. Flagged: they can hold one job at a time.
// Suspended: the whole account is paused (see AccountGate) — all they can do
// is send an appeal and see what came of it, one appeal at a time. Until the
// standing has loaded (or if it can't), the sample account stands in, as the
// wallet and plan do.
// ─────────────────────────────────────────────────────────────────────────────

type ManufacturerAccountContextValue = typeof MANUFACTURER_ACCOUNT & {
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
function toAccount(standing: AccountStanding): typeof MANUFACTURER_ACCOUNT {
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
    const { data } = useQuery({
        queryKey: queryKeys.account.standing(),
        queryFn: async () => (await manufacturerService.getAccountStatus()).account,
        retry: false,
    });
    const account = data ? toAccount(data) : MANUFACTURER_ACCOUNT;

    const value: ManufacturerAccountContextValue = {
        ...account,
        isSuspended: account.accountStatus === "suspended",
        isFlagged: account.accountStatus === "flagged",
        hold: getAccountHold(account),
        pendingAppeal: account.appeals.find((appeal) => appeal.status === "pending"),
        sendAppeal: async (appeal) => {
            const attachments = appeal.attachments
                .filter((file) => !!file.publicId)
                .map((file) => ({ publicId: file.publicId!, name: file.name }));
            const { account: standing } = await manufacturerService.submitAppeal({
                message: appeal.message,
                ...(attachments.length > 0 && { attachments }),
            });
            queryClient.setQueryData(queryKeys.account.standing(), standing);
        },
    };

    return <ManufacturerAccountContext.Provider value={value}>{children}</ManufacturerAccountContext.Provider>;
}

export function useManufacturerAccount() {
    const context = useContext(ManufacturerAccountContext);
    if (!context) {
        throw new Error("useManufacturerAccount must be used within a ManufacturerAccountProvider");
    }
    return context;
}
