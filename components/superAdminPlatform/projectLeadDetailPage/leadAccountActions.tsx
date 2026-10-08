"use client";

import { useState } from "react";
import { UserCheck, UserPen, UserX } from "lucide-react";
import DeactivateLeadDialog from "./deactivateLeadDialog";
import EditLeadDialog from "./editLeadDialog";
import ReactivateLeadDialog from "./reactivateLeadDialog";
import { useRefreshLead, type LeadAccount } from "./leadAccount";

type AccountDialog = "edit" | "deactivate" | "reactivate";

const BUTTON_CLASS =
    "flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium font-text transition-colors cursor-pointer";

/**
 * The page header's account controls, for super admins: edit a lead's details
 * or deactivate their account while it's active, reactivate it once it isn't.
 * `pageLeadId` is the id in the URL, which the page's data is kept under.
 */
export default function LeadAccountActions({ lead, pageLeadId }: { lead: LeadAccount; pageLeadId: string }) {
    const [dialog, setDialog] = useState<AccountDialog | null>(null);
    const refreshLead = useRefreshLead(pageLeadId);
    const close = () => setDialog(null);
    const isDeactivated = lead.status === "deactivated";

    return (
        <>
            {isDeactivated ? (
                <button
                    type="button"
                    onClick={() => setDialog("reactivate")}
                    className={`${BUTTON_CLASS} bg-secondary-700 text-white hover:bg-secondary-900`}
                >
                    <UserCheck className="size-4" aria-hidden />
                    Reactivate
                </button>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => setDialog("edit")}
                        className={`${BUTTON_CLASS} border border-border bg-white text-mist-900 hover:bg-mist-50`}
                    >
                        <UserPen className="size-4 text-mist-500" aria-hidden />
                        Edit details
                    </button>
                    <button
                        type="button"
                        onClick={() => setDialog("deactivate")}
                        className={`${BUTTON_CLASS} border border-border bg-white text-error-600 hover:bg-error-50`}
                    >
                        <UserX className="size-4" aria-hidden />
                        Deactivate
                    </button>
                </>
            )}

            {isDeactivated ? (
                <ReactivateLeadDialog
                    lead={lead}
                    open={dialog === "reactivate"}
                    onClose={close}
                    onReactivated={refreshLead}
                />
            ) : (
                <>
                    <EditLeadDialog lead={lead} open={dialog === "edit"} onClose={close} onSaved={refreshLead} />
                    <DeactivateLeadDialog
                        lead={lead}
                        open={dialog === "deactivate"}
                        onClose={close}
                        onDeactivated={refreshLead}
                    />
                </>
            )}
        </>
    );
}
