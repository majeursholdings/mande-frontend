"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LockKeyhole } from "lucide-react";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import ReauthSteps from "@/components/superAdminPlatform/reauthSteps";
import { getErrorMessage } from "@/lib/api";
import { formatOrdinalDate } from "@/lib/date";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { FormSubmitButton } from "../form/formButtons";

export type AccountClosure = { at: string; byName: string | null; reason: string | null };

// ─────────────────────────────────────────────────────────────────────────────
// A closed account: when, by whom and why, and (for a super admin) reopening
// it. Reopening takes a reason for the record, then the password and a code.
// Their sign-in works again; jobs they lost when it closed stay with others.
// ─────────────────────────────────────────────────────────────────────────────

export default function ClosedAccountNotice({
    manufacturerId,
    name,
    closure,
    canReopen,
}: {
    manufacturerId: string;
    name: string;
    closure: AccountClosure;
    canReopen: boolean;
}) {
    const [isReopening, setIsReopening] = useState(false);

    return (
        <section className="flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50/60 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
                <LockKeyhole className="mt-0.5 size-5 shrink-0 text-error-700" strokeWidth={1.75} aria-hidden />
                <div className="flex flex-col gap-1 text-sm font-text">
                    <p className="font-medium text-mist-950">
                        This account is closed. {name} can&apos;t log in, and can&apos;t be given jobs.
                    </p>
                    <p className="text-mist-700">
                        Closed on {formatOrdinalDate(new Date(closure.at))}
                        {closure.byName ? ` by ${closure.byName}` : ""}.
                        {closure.reason ? ` Reason: ${closure.reason}` : ""}
                    </p>
                </div>
            </div>
            {canReopen && (
                <Button type="button" variant="outline" className="shrink-0" onClick={() => setIsReopening(true)}>
                    Reopen account
                </Button>
            )}
            <ReopenDialog manufacturerId={manufacturerId} name={name} open={isReopening} onClose={() => setIsReopening(false)} />
        </section>
    );
}

type ReopenValues = { reason: string };

const FIELDS: FormFieldConfig[] = [
    {
        name: "reason",
        type: "textarea",
        label: "Why it's being reopened",
        placeholder: "For the record, e.g. they cleared up the issue with support",
        height: 100,
        validation: {
            required: "Give a reason",
            validate: (value: string) => value.trim().length >= 5 || "Write at least 5 characters",
            maxLength: { value: 1000, message: "Keep it under 1000 characters" },
        },
    },
];

function ReopenDialog({ manufacturerId, name, open, onClose }: { manufacturerId: string; name: string; open: boolean; onClose: () => void }) {
    const queryClient = useQueryClient();
    const [reason, setReason] = useState<string | null>(null);
    const methods = useForm<ReopenValues>({ mode: "onTouched", defaultValues: { reason: "" } });

    const close = () => {
        setReason(null);
        methods.reset({ reason: "" });
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && close()}>
            <DialogContent className="max-w-110">
                <div className="flex flex-col gap-1">
                    <DialogTitle>Reopen {name}&apos;s account?</DialogTitle>
                    <DialogDescription>
                        They can log in and be given jobs again. Jobs that moved to others when it closed stay where they are.
                    </DialogDescription>
                </div>
                {reason === null ? (
                    <MainForm<ReopenValues>
                        methods={methods}
                        fields={FIELDS}
                        onSubmit={({ reason: typed }) => setReason(typed.trim())}
                        hideRequiredMarks
                        renderFooter={({ canSubmit }) => (
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={close}>
                                    Cancel
                                </Button>
                                <FormSubmitButton label="Continue" isLoading={false} disabled={!canSubmit} className="w-auto px-6" />
                            </div>
                        )}
                    />
                ) : (
                    <ReauthSteps
                        confirmLabel="Reopen account"
                        onCancel={close}
                        onConfirmed={async (reauthToken) => {
                            try {
                                await manufacturerService.reactivateManufacturer(manufacturerId, reason, reauthToken);
                            } catch (err) {
                                // Shown in the dialog, which stays open
                                throw new Error(getErrorMessage(err, "Couldn't reopen the account. Please try again."));
                            }
                            await Promise.all([
                                queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.all }),
                                queryClient.invalidateQueries({ queryKey: queryKeys.reports.all }),
                            ]);
                            toast.success(`${name}'s account is open again`);
                            close();
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
