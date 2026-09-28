"use client";

import { useState, type ReactNode } from "react";
import { CircleAlert, Flag, FlagOff, OctagonPause, ShieldCheck, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import AccountActionForm from "@/components/adminPlatform/form/accountActionForm";
import ReasonForm from "@/components/adminPlatform/form/reasonForm";
import RequestDeletionForm from "@/components/adminPlatform/form/requestDeletionForm";
import TypeToConfirmForm from "@/components/adminPlatform/form/typeToConfirmForm";
import type { AccountAppealRecord, ManufacturerAccountStatus, ManufacturerRecord } from "@/constant/sampleDb";
import { hasDeleteWarnings, useAdminManufacturers } from "../dashboardLayout/adminManufacturersContext";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";

export type ManufacturerAction = "flag" | "suspend" | "lift-flag" | "lift-suspension" | "request-deletion" | "delete";

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
    { value: "delete", label: "Delete account", icon: Trash2, tone: "danger" },
];

/**
 * The actions the signed-in person can take on a manufacturer — an admin
 * asks for a deletion, a super admin deletes (never blocked: anything still
 * going on is a warning in the dialog) — and why one can't be taken now
 * (null when it can).
 */
export function useManufacturerActions() {
    const { permissions } = useStaffPlatform();
    return {
        actions: MANUFACTURER_ACTIONS.filter(({ value }) =>
            permissions.deletes ? value !== "request-deletion" : value !== "delete",
        ),
        getBlocker: (
            manufacturer: Pick<ManufacturerRecord, "id" | "accountStatus" | "deletionRequest">,
            action: ManufacturerAction,
        ) => (action === "delete" ? null : getActionBlocker(manufacturer, action)),
    };
}

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

/** Beside a manufacturer's name while an admin's request to delete the account waits for a super admin. */
export function DeletionRequestedTag() {
    return (
        <span className="inline-flex shrink-0 items-center rounded-full bg-mist-100 px-2 py-0.5 text-[11px] font-medium font-text text-mist-700">
            Deletion requested
        </span>
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
        description: "They'll only be able to hold one job at a time. The jobs they already have carry on.",
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
    delete: {
        title: (name) => `Delete ${name}'s account?`,
        description:
            "They won't be able to log in again, and their profile, documents and bank details are removed. Jobs they finished stay in the records. This can't be undone.",
    },
};

/**
 * The dialog for one of MANUFACTURER_ACTIONS on a manufacturer — closed while
 * `action` is null. `onDeleted` runs once the account's gone, e.g. to leave
 * its page.
 */
export function ManufacturerActionDialog({
    manufacturer,
    action,
    onClose,
    onDeleted,
}: {
    manufacturer: ManufacturerRecord | undefined;
    action: ManufacturerAction | null;
    onClose: () => void;
    onDeleted?: () => void;
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
                {manufacturer && action === "delete" ? (
                    // Its own steps: a warning when the account's still busy, then typing their name
                    <DeleteAccountSteps
                        key={manufacturer.id}
                        manufacturer={manufacturer}
                        onCancel={onClose}
                        onDeleted={() => {
                            onClose();
                            onDeleted?.();
                        }}
                    />
                ) : manufacturer && action && action !== "delete" && dialog && (
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

const listOf = (titles: string[]) =>
    titles.length <= 2 ? titles.join(" and ") : `${titles.slice(0, 2).join(", ")} and ${titles.length - 2} more`;

/**
 * Deleting an account (super admins): first what's still going on on it —
 * jobs underway, money in the wallet, applications, an appeal — and what
 * deleting does to each, with the choice to go ahead anyway; then typing
 * their full name to delete it.
 */
function DeleteAccountSteps({
    manufacturer,
    onCancel,
    onDeleted,
}: {
    manufacturer: ManufacturerRecord;
    onCancel: () => void;
    onDeleted: () => void;
}) {
    const { getDeleteWarnings, deleteManufacturer } = useAdminManufacturers();
    const warnings = getDeleteWarnings(manufacturer.id);
    const [isGoingAhead, setIsGoingAhead] = useState(!hasDeleteWarnings(warnings));
    const name = manufacturer.contactName;
    const toPending = warnings.jobsUnderway.filter((entry) => entry.goesBackToPending).map((entry) => entry.job.title);
    const carryOn = warnings.jobsUnderway.filter((entry) => !entry.goesBackToPending).map((entry) => entry.job.title);

    if (!isGoingAhead) {
        return (
            <>
                <div className="flex flex-col gap-1">
                    <DialogTitle>{name}&apos;s account is still active</DialogTitle>
                    <DialogDescription>Deleting it now affects what&apos;s still going on:</DialogDescription>
                </div>
                <ul className="flex flex-col gap-3 rounded-lg bg-warning-50 px-4 py-3.5 text-sm font-text leading-5 text-warning-900">
                    {warnings.jobsUnderway.length > 0 && (
                        <WarningItem>
                            <span className="font-medium">
                                {warnings.jobsUnderway.length} job{warnings.jobsUnderway.length === 1 ? "" : "s"} underway.
                            </span>{" "}
                            {toPending.length > 0 &&
                                `${listOf(toPending)} ${toPending.length === 1 ? "goes" : "go"} back to pending, with the progress cleared, for the lead to offer to someone else.`}
                            {toPending.length > 0 && carryOn.length > 0 && " "}
                            {carryOn.length > 0 &&
                                `${listOf(carryOn)} ${carryOn.length === 1 ? "carries" : "carry"} on with the other manufacturer.`}
                        </WarningItem>
                    )}
                    {warnings.walletBalance > 0 && (
                        <WarningItem>
                            <span className="font-medium">{formatPrice(warnings.walletBalance)} in their wallet.</span> Pay
                            it out to them first. It can&apos;t be withdrawn once the account is gone.
                        </WarningItem>
                    )}
                    {warnings.applications.length > 0 && (
                        <WarningItem>
                            <span className="font-medium">
                                {warnings.applications.length} job application{warnings.applications.length === 1 ? "" : "s"}
                            </span>
                            , which {warnings.applications.length === 1 ? "is" : "are"} withdrawn.
                        </WarningItem>
                    )}
                    {warnings.hasPendingAppeal && (
                        <WarningItem>
                            <span className="font-medium">An appeal waiting for an answer</span>, which is dropped.
                        </WarningItem>
                    )}
                </ul>
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        onClick={onCancel}
                        className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer transition-colors duration-300"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => setIsGoingAhead(true)}
                        className="h-11 px-5 bg-error-600 hover:bg-error-700 text-white font-medium font-text rounded-button cursor-pointer transition-colors duration-300"
                    >
                        Continue anyway
                    </Button>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-1">
                <DialogTitle>{DIALOGS.delete.title(name)}</DialogTitle>
                <DialogDescription>{DIALOGS.delete.description}</DialogDescription>
            </div>
            <TypeToConfirmForm
                confirmText={name}
                submitLabel="Delete account"
                loadingLabel="Deleting..."
                errorMessage="Couldn't delete the account. Please try again."
                onCancel={onCancel}
                onConfirm={() => {
                    deleteManufacturer(manufacturer.id);
                    toast.success(`${name}'s account was deleted`);
                    onDeleted();
                }}
            />
        </>
    );
}

function WarningItem({ children }: { children: ReactNode }) {
    return (
        <li className="flex gap-2.5">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning-600" strokeWidth={1.75} aria-hidden />
            <span>{children}</span>
        </li>
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
                    ? `Appeal approved. The suspension on ${manufacturer.contactName} is lifted`
                    : "Appeal turned down. They have your reason",
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
