"use client";

import { useState } from "react";
import { UserPen } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api";
import { staffService } from "@/lib/services/staffService";
import ProjectLeadEditForm, { type ProjectLeadChanges } from "../form/projectLeadEditForm";
import ReauthSteps from "../reauthSteps";
import type { LeadAccount } from "./leadAccount";

/** Changing a project lead's name, phone or position, then confirming it's you: saved once both are done. */
export default function EditLeadDialog({
    lead,
    open,
    onClose,
    onSaved,
}: {
    lead: LeadAccount;
    open: boolean;
    onClose: () => void;
    onSaved: () => void | Promise<unknown>;
}) {
    const [changes, setChanges] = useState<ProjectLeadChanges | null>(null);
    const close = () => {
        setChanges(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && close()}>
            <DialogContent className="max-w-120">
                <div className="flex flex-col gap-1">
                    <DialogTitle className="flex items-center gap-2">
                        <UserPen className="size-5 text-mist-500" aria-hidden />
                        Edit {lead.name}&apos;s details
                    </DialogTitle>
                    <DialogDescription>
                        {changes
                            ? "Confirm it's you to save the changes. They show on their profile straight away."
                            : "Their email can't be changed here."}
                    </DialogDescription>
                </div>
                {changes ? (
                    <ReauthSteps
                        confirmLabel="Save changes"
                        onCancel={close}
                        onConfirmed={async (reauthToken) => {
                            try {
                                await staffService.updateProjectLead(lead.id, changes, reauthToken);
                            } catch (err) {
                                // Shown in the dialog, which stays open to try again
                                throw new Error(getErrorMessage(err, "Couldn't save the changes. Please try again."));
                            }
                            toast.success("The project lead's details were saved.");
                            close();
                            await onSaved();
                        }}
                    />
                ) : (
                    open && (
                        <ProjectLeadEditForm
                            current={{
                                firstName: lead.firstName,
                                lastName: lead.lastName,
                                phone: lead.phone ?? "",
                                position: lead.position ?? "",
                            }}
                            onSubmit={setChanges}
                            onCancel={close}
                        />
                    )
                )}
            </DialogContent>
        </Dialog>
    );
}
