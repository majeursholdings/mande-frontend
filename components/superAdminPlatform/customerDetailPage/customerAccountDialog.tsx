"use client";

import { useState, type ReactNode } from "react";
import { CircleAlert, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";
import { customerService, type CustomerDetail } from "@/lib/services/customerService";
import ShopReasonForm from "../form/shopReasonForm";
import ReauthSteps from "../reauthSteps";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * Deactivating a customer, or reactivating a deactivated one (super admins):
 * what happens, why, then confirming it's you (the API asks for the same).
 * Deactivating deletes nothing and signs them out everywhere at once; what
 * they've already paid for carries on.
 */
export default function CustomerAccountDialog({
    customer,
    open,
    onClose,
    onDone,
}: {
    customer: CustomerDetail;
    open: boolean;
    onClose: () => void;
    onDone: () => void | Promise<unknown>;
}) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-120">
                {/* Rendered only while open, so each opening starts from the first step */}
                {open && <AccountSteps customer={customer} onCancel={onClose} onDone={onDone} />}
            </DialogContent>
        </Dialog>
    );
}

function AccountSteps({ customer, onCancel, onDone }: { customer: CustomerDetail; onCancel: () => void; onDone: () => void | Promise<unknown> }) {
    const [reason, setReason] = useState<string | null>(null);
    const reactivating = customer.status === "deactivated";
    const { openOrders, openReturns, unpaidCheckouts } = customer.inFlight;

    const header = (
        <div className="flex flex-col gap-1">
            <DialogTitle className="flex items-center gap-2">
                {reactivating ? <UserCheck className="size-5 text-mist-500" aria-hidden /> : <UserX className="size-5 text-error-600" aria-hidden />}
                {reactivating ? `Reactivate ${customer.name}?` : `Deactivate ${customer.name}?`}
            </DialogTitle>
            <DialogDescription>
                {reactivating
                    ? "They can sign in on the shop again with their current password. We email them to say so."
                    : "They're signed out on every device straight away and can't sign in until a super admin reactivates the account. Nothing is deleted."}
            </DialogDescription>
        </div>
    );

    if (reason !== null) {
        return (
            <>
                {header}
                <ReauthSteps
                    confirmLabel={reactivating ? "Reactivate" : "Deactivate"}
                    onCancel={onCancel}
                    onConfirmed={async (reauthToken) => {
                        try {
                            if (reactivating) await customerService.reactivate(customer.id, reason, reauthToken);
                            else await customerService.deactivate(customer.id, reason, reauthToken);
                        } catch (err) {
                            // Shown in the dialog, which stays open to try again
                            throw new Error(getErrorMessage(err, reactivating ? "Couldn't reactivate the account. Please try again." : "Couldn't deactivate the account. Please try again."));
                        }
                        toast.success(reactivating ? `${customer.name}'s account is active again.` : `${customer.name}'s account was deactivated.`);
                        onCancel();
                        await onDone();
                    }}
                />
            </>
        );
    }

    return (
        <>
            {header}
            {!reactivating && (
                <ul className="flex flex-col gap-3 rounded-lg bg-warning-50 px-4 py-3.5 text-sm font-text leading-5 text-warning-900">
                    {openOrders > 0 ? (
                        <WarningItem>
                            <span className="font-medium">{plural(openOrders, "paid order")} still on the way.</span> Sellers still fulfil{" "}
                            {openOrders === 1 ? "it" : "them"}, and any refund still goes back to the customer.
                        </WarningItem>
                    ) : (
                        <WarningItem>They have no paid orders on the way.</WarningItem>
                    )}
                    {openReturns > 0 && (
                        <WarningItem>
                            <span className="font-medium">{plural(openReturns, "open return")}.</span> {openReturns === 1 ? "It carries" : "They carry"} on as
                            usual, but they can&apos;t mark an item as sent back while they&apos;re signed out.
                        </WarningItem>
                    )}
                    {unpaidCheckouts > 0 && (
                        <WarningItem>
                            <span className="font-medium">{plural(unpaidCheckouts, "checkout")} not paid yet.</span> If the payment doesn&apos;t arrive,{" "}
                            {unpaidCheckouts === 1 ? "it expires" : "they expire"} on its own.
                        </WarningItem>
                    )}
                    {customer.creditKobo > 0 && <WarningItem>Their store credit stays on the account, ready for if it&apos;s reactivated.</WarningItem>}
                </ul>
            )}
            <ShopReasonForm
                label="Reason"
                placeholder={reactivating ? "e.g. The payment dispute was resolved" : "e.g. Repeated fraudulent orders"}
                description="Kept in the activity log for other super admins."
                submitLabel="Continue"
                onCancel={onCancel}
                onSubmit={async (value) => setReason(value)}
            />
        </>
    );
}

function WarningItem({ children }: { children: ReactNode }) {
    return (
        <li className="flex gap-2.5">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning-600" strokeWidth={1.75} aria-hidden />
            <div className="min-w-0">{children}</div>
        </li>
    );
}
