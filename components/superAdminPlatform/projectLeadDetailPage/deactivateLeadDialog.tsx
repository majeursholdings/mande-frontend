"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectLeads } from "@/components/adminPlatform/dashboardLayout/useProjectLeads";
import { getErrorMessage } from "@/lib/api";
import { staffService } from "@/lib/services/staffService";
import DeactivateProjectLeadForm, { type DeactivateProjectLeadValues } from "../form/deactivateProjectLeadForm";
import ReauthSteps from "../reauthSteps";
import type { LeadAccount } from "./leadAccount";

type DeactivationWarnings = {
    activeJobsCount: number;
    soleLeadedJobs: { id: string; code: string; title: string; status: string }[];
    needsReplacement: boolean;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * Deactivating a project lead (super admins): first what happens to the jobs
 * they lead, choosing who takes over any they lead alone, and why; then
 * confirming it's you (the API asks for the same).
 */
export default function DeactivateLeadDialog({
    lead,
    open,
    onClose,
    onDeactivated,
}: {
    lead: LeadAccount;
    open: boolean;
    onClose: () => void;
    onDeactivated: () => void | Promise<unknown>;
}) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-120">
                {open && <DeactivateSteps lead={lead} onCancel={onClose} onDeactivated={onDeactivated} />}
            </DialogContent>
        </Dialog>
    );
}

function DeactivateSteps({
    lead,
    onCancel,
    onDeactivated,
}: {
    lead: LeadAccount;
    onCancel: () => void;
    onDeactivated: () => void | Promise<unknown>;
}) {
    const [pending, setPending] = useState<DeactivateProjectLeadValues | null>(null);
    const warningsQuery = useQuery({
        queryKey: ["staff", "lead", lead.id, "deactivation-warnings"],
        queryFn: () => staffService.getDeactivationWarnings(lead.id) as Promise<DeactivationWarnings>,
        staleTime: 0,
    });
    const warnings = warningsQuery.data;

    const header = (
        <div className="flex flex-col gap-1">
            <DialogTitle className="flex items-center gap-2">
                <UserX className="size-5 text-error-600" aria-hidden />
                Deactivate {lead.name}?
            </DialogTitle>
            <DialogDescription>
                They&apos;re signed out on every device straight away and can&apos;t log in until a super admin
                reactivates the account.
            </DialogDescription>
        </div>
    );

    if (pending) {
        return (
            <>
                {header}
                <ReauthSteps
                    confirmLabel="Deactivate"
                    onCancel={onCancel}
                    onConfirmed={async (reauthToken) => {
                        try {
                            await staffService.deactivateProjectLead(lead.id, pending, reauthToken);
                        } catch (err) {
                            // Shown in the dialog, which stays open to try again
                            throw new Error(getErrorMessage(err, "Couldn't deactivate the account. Please try again."));
                        }
                        toast.success(`${lead.name}'s account was deactivated.`);
                        onCancel();
                        await onDeactivated();
                    }}
                />
            </>
        );
    }

    if (!warnings) {
        return (
            <>
                {header}
                {warningsQuery.isError ? (
                    <p role="alert" className="text-sm font-text text-error-600">
                        {getErrorMessage(warningsQuery.error, "We couldn't check their jobs. Please try again.")}
                    </p>
                ) : (
                    <div className="flex flex-col gap-2 rounded-lg bg-mist-50 px-4 py-3.5" aria-busy>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                )}
                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={onCancel}
                        className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                    >
                        Cancel
                    </Button>
                </div>
            </>
        );
    }

    const coLedCount = warnings.activeJobsCount - warnings.soleLeadedJobs.length;

    return (
        <>
            {header}
            <ul className="flex flex-col gap-3 rounded-lg bg-warning-50 px-4 py-3.5 text-sm font-text leading-5 text-warning-900">
                {warnings.needsReplacement && (
                    <WarningItem>
                        <span className="font-medium">
                            They&apos;re the only lead on {plural(warnings.soleLeadedJobs.length, "active job")}.
                        </span>{" "}
                        {warnings.soleLeadedJobs.length === 1 ? "It moves" : "They move"} to the replacement lead you
                        choose below:
                        <ul className="mt-1.5 flex flex-col gap-1">
                            {warnings.soleLeadedJobs.map((job) => (
                                <li key={job.id} className="flex gap-2">
                                    <span className="font-mono text-xs font-bold leading-5">{job.code}</span>
                                    <span className="min-w-0 truncate">{job.title}</span>
                                </li>
                            ))}
                        </ul>
                    </WarningItem>
                )}
                {coLedCount > 0 && (
                    <WarningItem>
                        <span className="font-medium">They co-lead {plural(coLedCount, "active job")}.</span> They&apos;re
                        taken off {coLedCount === 1 ? "it" : "them"}, and the other leads carry on.
                    </WarningItem>
                )}
                {warnings.activeJobsCount === 0 && (
                    <WarningItem>They don&apos;t lead any active jobs, so no jobs change.</WarningItem>
                )}
            </ul>
            {warnings.needsReplacement ? (
                <ReplacementStep leadId={lead.id} onSubmit={setPending} onCancel={onCancel} />
            ) : (
                <DeactivateProjectLeadForm onSubmit={setPending} onCancel={onCancel} />
            )}
        </>
    );
}

/** The form with a choice of the other active project leads to take over their jobs. */
function ReplacementStep({
    leadId,
    onSubmit,
    onCancel,
}: {
    leadId: string;
    onSubmit: (values: DeactivateProjectLeadValues) => void;
    onCancel: () => void;
}) {
    const { leads, isPending, isError, error } = useProjectLeads();

    if (isPending) {
        return (
            <div className="flex flex-col gap-2" aria-busy>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-11 w-full rounded-lg" />
            </div>
        );
    }

    const options = leads.filter((record) => record.id !== leadId).map((record) => ({ label: record.name, value: record.id }));

    if (isError || options.length === 0) {
        return (
            <>
                <p role="alert" className="text-sm font-text text-error-600">
                    {isError
                        ? getErrorMessage(error, "We couldn't load the other project leads. Please try again.")
                        : "There's no other active project lead to take over their jobs. Add or reactivate one first."}
                </p>
                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={onCancel}
                        className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                    >
                        Cancel
                    </Button>
                </div>
            </>
        );
    }

    return <DeactivateProjectLeadForm replacementOptions={options} onSubmit={onSubmit} onCancel={onCancel} />;
}

function WarningItem({ children }: { children: ReactNode }) {
    return (
        <li className="flex gap-2.5">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning-600" strokeWidth={1.75} aria-hidden />
            <div className="min-w-0">{children}</div>
        </li>
    );
}
