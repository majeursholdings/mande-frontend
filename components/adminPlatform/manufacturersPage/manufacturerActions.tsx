"use client";

import { Flag, FlagOff, OctagonPause, ShieldCheck, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import AccountActionForm from "@/components/adminPlatform/form/accountActionForm";
import ReasonForm from "@/components/adminPlatform/form/reasonForm";
import RequestDeletionForm from "@/components/adminPlatform/form/requestDeletionForm";
import type { AccountAppealRecord, ManufacturerAccountStatus, ManufacturerRecord } from "@/constant/sampleDb";
import { useAdminManufacturers } from "../dashboardLayout/adminManufacturersContext";

export type ManufacturerAction = "flag" | "suspend" | "lift-flag" | "lift-suspension" | "request-deletion";

export const MANUFACTURER_ACTIONS: {
    value: ManufacturerAction;
    label: string;
    icon: LucideIcon;
    tone?: "danger";
}[] = [
    { value: "lift-flag", label: "Lift flag", icon: FlagOff },
    { value: "lift-suspension", label: "Lift suspension", icon: ShieldCheck },
    { value: "flag", label: "Flag", icon: Flag },
    { value: "suspend", label: "Suspend", icon: OctagonPause },
    { value: "request-deletion", label: "Request deletion", icon: Trash2, tone: "danger" },
];

/** Lifting only shows for what the account is under — a flag, or a suspension. */
export function isActionHidden(
    manufacturer: Pick<ManufacturerRecord, "accountStatus">,
    action: ManufacturerAction,
): boolean {
    if (action === "lift-flag") return manufacturer.accountStatus !== "flagged";
    if (action === "lift-suspension") return manufacturer.accountStatus !== "suspended";
    return false;
}

/**
 * Why an action can't be taken on a manufacturer — null when it can. A
 * suspension outranks a flag, and a deletion is only asked for once.
 */
export function getActionBlocker(
    manufacturer: Pick<ManufacturerRecord, "accountStatus" | "deletionRequest">,
    action: ManufacturerAction,
): string | null {
    if (action === "flag" && manufacturer.accountStatus !== "active") {
        return manufacturer.accountStatus === "flagged" ? "Already flagged" : "Suspended";
    }
    if (action === "suspend" && manufacturer.accountStatus === "suspended") return "Already suspended";
    if (action === "request-deletion" && manufacturer.deletionRequest) return "Deletion already requested";
    return null;
}

const STATUS_TAGS: Record<Exclude<ManufacturerAccountStatus, "active">, { label: string; className: string }> = {
    flagged: { label: "Flagged", className: "bg-warning-50 text-warning-700" },
    suspended: { label: "Suspended", className: "bg-error-50 text-error-600" },
};

/**
 * "Flagged" / "Suspended" beside a manufacturer's name — with "Appeal waiting"
 * when they've asked for a suspension to be lifted. Nothing while they're
 * active.
 */
export function AccountStatusTag({
    status,
    hasPendingAppeal = false,
    className,
}: {
    status: ManufacturerAccountStatus;
    hasPendingAppeal?: boolean;
    className?: string;
}) {
    if (status === "active") return null;
    const tag = STATUS_TAGS[status];
    const tagClass = "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium font-text";
    return (
        <>
            <span className={cn(tagClass, tag.className, className)}>{tag.label}</span>
            {status === "suspended" && hasPendingAppeal && (
                <span className={cn(tagClass, "bg-indigo-50 text-indigo-600", className)}>Appeal waiting</span>
            )}
        </>
    );
}

const DIALOGS: Record<ManufacturerAction, { title: (name: string) => string; description: string }> = {
    "lift-flag": {
        title: (name) => `Lift the flag on ${name}?`,
        description: "They'll be able to take on as many jobs as their plan allows again.",
    },
    "lift-suspension": {
        title: (name) => `Lift the suspension on ${name}?`,
        description:
            "Their account works as normal again. An appeal still waiting is marked approved, with your note.",
    },
    flag: {
        title: (name) => `Flag ${name}?`,
        description:
            "They'll only be able to hold one job at a time — the jobs they already have carry on.",
    },
    suspend: {
        title: (name) => `Suspend ${name}?`,
        description:
            "Everything on their account is paused: they can't apply for, accept or work on jobs, or withdraw. All they can do is send an appeal.",
    },
    "request-deletion": {
        title: (name) => `Request deletion of ${name}'s account?`,
        description:
            "Admins can't delete accounts. A super admin will read your reason, and delete the account if they agree.",
    },
};

/** The dialog for one of MANUFACTURER_ACTIONS on a manufacturer — closed while `action` is null. */
export function ManufacturerActionDialog({
    manufacturer,
    action,
    onClose,
}: {
    manufacturer: ManufacturerRecord | undefined;
    action: ManufacturerAction | null;
    onClose: () => void;
}) {
    const { changeStatus, requestDeletion } = useAdminManufacturers();
    const dialog = action ? DIALOGS[action] : null;

    const run = (task: () => void, success: string, failure: string) => {
        try {
            task();
            toast.success(success);
        } catch {
            toast.error(failure);
        }
        onClose();
    };

    return (
        <Dialog open={!!manufacturer && !!action} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-110">
                {manufacturer && action && dialog && (
                    <>
                        <div className="flex flex-col gap-1">
                            <DialogTitle>{dialog.title(manufacturer.contactName)}</DialogTitle>
                            <DialogDescription>{dialog.description}</DialogDescription>
                        </div>
                        {action === "lift-flag" || action === "lift-suspension" ? (
                            <AccountActionForm
                                action={action}
                                fullName={manufacturer.contactName}
                                onCancel={onClose}
                                onConfirm={(note) =>
                                    run(
                                        () => changeStatus(manufacturer.id, "active", note),
                                        action === "lift-flag"
                                            ? `The flag on ${manufacturer.contactName} is lifted`
                                            : `The suspension on ${manufacturer.contactName} is lifted`,
                                        "Couldn't save that. Please try again.",
                                    )
                                }
                            />
                        ) : action === "request-deletion" ? (
                            <RequestDeletionForm
                                onCancel={onClose}
                                onRequest={(request) =>
                                    run(
                                        () => requestDeletion(manufacturer.id, request),
                                        "Deletion request sent to a super admin",
                                        "Couldn't send the deletion request. Please try again.",
                                    )
                                }
                            />
                        ) : (
                            <AccountActionForm
                                action={action}
                                fullName={manufacturer.contactName}
                                onCancel={onClose}
                                onConfirm={(reason) =>
                                    run(
                                        () =>
                                            changeStatus(
                                                manufacturer.id,
                                                action === "flag" ? "flagged" : "suspended",
                                                reason,
                                            ),
                                        action === "flag"
                                            ? `${manufacturer.contactName} has been flagged`
                                            : `${manufacturer.contactName} has been suspended`,
                                        `Couldn't ${action} the manufacturer. Please try again.`,
                                    )
                                }
                            />
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

/** Approving (an optional note) or turning down (a reason they'll see) a suspended manufacturer's appeal. */
export function AppealDecisionDialog({
    manufacturer,
    appeal,
    decision,
    onClose,
}: {
    manufacturer: ManufacturerRecord;
    appeal: AccountAppealRecord | undefined;
    decision: "approved" | "declined" | null;
    onClose: () => void;
}) {
    const { decideAppeal } = useAdminManufacturers();

    const decide = (response: string | null) => {
        if (!appeal || !decision) return;
        try {
            decideAppeal(manufacturer.id, appeal.id, decision, response);
            toast.success(
                decision === "approved"
                    ? `Appeal approved — the suspension on ${manufacturer.contactName} is lifted`
                    : "Appeal turned down — they have your reason",
            );
        } catch {
            toast.error("Couldn't save your decision. Please try again.");
        }
        onClose();
    };

    return (
        <Dialog open={!!appeal && !!decision} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-110">
                <div className="flex flex-col gap-1">
                    <DialogTitle>
                        {decision === "approved" ? "Approve the appeal?" : "Turn down the appeal?"}
                    </DialogTitle>
                    <DialogDescription>
                        {decision === "approved"
                            ? `This lifts the suspension, and ${manufacturer.contactName}'s account works as normal again.`
                            : `The suspension stays. ${manufacturer.contactName} sees your reason and can appeal again.`}
                    </DialogDescription>
                </div>
                {decision === "approved" ? (
                    <AccountActionForm
                        action="approve-appeal"
                        fullName={manufacturer.contactName}
                        onCancel={onClose}
                        onConfirm={decide}
                    />
                ) : (
                    <ReasonForm
                        label="Why it's turned down"
                        placeholder="What's missing, or what would change your mind?"
                        submitLabel="Turn down"
                        loadingLabel="Saving..."
                        errorMessage="Couldn't save your decision. Please try again."
                        onCancel={onClose}
                        onSubmit={decide}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
