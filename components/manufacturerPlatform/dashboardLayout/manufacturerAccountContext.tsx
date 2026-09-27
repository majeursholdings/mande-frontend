"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { MANUFACTURER_ACCOUNT } from "@/constant/manufacturer";
import { getAccountHold, type AccountAppealRecord, type AccountStatusEventRecord } from "@/constant/sampleDb";

// ─────────────────────────────────────────────────────────────────────────────
// ManufacturerAccountProvider — whether an admin has flagged or suspended
// the account. Flagged: they can hold one job at a time. Suspended: the
// whole account is paused (see AccountGate) — all they can do is send an
// appeal and see what came of it, one appeal at a time. Seeded from the
// sample database; once the backend is connected, load it from the API and
// send appeals there.
// ─────────────────────────────────────────────────────────────────────────────

type ManufacturerAccountContextValue = typeof MANUFACTURER_ACCOUNT & {
    isSuspended: boolean;
    isFlagged: boolean;
    /** The flag or suspension on the account now. Null while it's active. */
    hold: AccountStatusEventRecord | null;
    /** Their appeal still waiting for an admin, if any. */
    pendingAppeal: AccountAppealRecord | undefined;
    /** Does nothing unless suspended with no appeal waiting. */
    sendAppeal: (appeal: Pick<AccountAppealRecord, "message" | "attachments">) => void;
};

const ManufacturerAccountContext = createContext<ManufacturerAccountContextValue | null>(null);

export function ManufacturerAccountProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState(MANUFACTURER_ACCOUNT);

    const value: ManufacturerAccountContextValue = {
        ...account,
        isSuspended: account.accountStatus === "suspended",
        isFlagged: account.accountStatus === "flagged",
        hold: getAccountHold(account),
        pendingAppeal: account.appeals.find((appeal) => appeal.status === "pending"),
        sendAppeal: (appeal) =>
            setAccount((current) =>
                current.accountStatus !== "suspended" || current.appeals.some((sent) => sent.status === "pending")
                    ? current
                    : {
                          ...current,
                          appeals: [
                              {
                                  ...appeal,
                                  id: `appeal-${Date.now()}`,
                                  sentAt: new Date().toISOString(),
                                  status: "pending",
                                  response: null,
                                  decidedBy: null,
                                  decidedAt: null,
                              },
                              ...current.appeals,
                          ],
                      },
            ),
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
