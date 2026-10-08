"use client";

import { useState } from "react";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";
import { staffService } from "@/lib/services/staffService";
import ReauthSteps from "../reauthSteps";
import type { LeadAccount } from "./leadAccount";

/** Letting a deactivated project lead back in, then confirming it's you. */
export default function ReactivateLeadDialog({
    lead,
    open,
    onClose,
    onReactivated,
}: {
    lead: LeadAccount;
    open: boolean;
    onClose: () => void;
    onReactivated: () => void | Promise<unknown>;
}) {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const close = () => {
        setIsConfirmed(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && close()}>
            <DialogContent className="max-w-110">
                <div className="flex flex-col gap-1">
                    <DialogTitle className="flex items-center gap-2">
                        <UserCheck className="size-5 text-mist-500" aria-hidden />
                        Reactivate {lead.name}?
                    </DialogTitle>
                    <DialogDescription>
                        They can log in again with their current password, and can be added to jobs again. Jobs that
                        moved to another lead when they were deactivated stay with that lead.
                    </DialogDescription>
                </div>
                {isConfirmed ? (
                    <ReauthSteps
                        confirmLabel="Reactivate"
                        onCancel={close}
                        onConfirmed={async (reauthToken) => {
                            try {
                                await staffService.reactivateProjectLead(lead.id, reauthToken);
                            } catch (err) {
                                throw new Error(getErrorMessage(err, "Couldn't reactivate the account. Please try again."));
                            }
                            toast.success(`${lead.name}'s account is active again.`);
                            close();
                            await onReactivated();
                        }}
                    />
                ) : (
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            onClick={close}
                            className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setIsConfirmed(true)}
                            className="h-11 px-5 bg-secondary-700 hover:bg-secondary-900 text-white font-medium font-text rounded-button cursor-pointer"
                        >
                            Continue
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
