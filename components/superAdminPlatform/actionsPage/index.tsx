"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { contactService } from "@/lib/services/contactService";
import { MandeApiError } from "@/lib/types/api";
import { useIsClient } from "@/hooks/useIsClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import AdminPageHeader from "@/components/adminPlatform/pageHeader";
import EmptyState from "@/components/adminPlatform/emptyState";
import RejectJobForm from "@/components/adminPlatform/form/rejectJobForm";
import { ManufacturerActionDialog } from "@/components/adminPlatform/manufacturersPage/manufacturerActions";
import { useAdminJobs } from "@/components/adminPlatform/dashboardLayout/adminJobsContext";
import { useAdminManufacturers } from "@/components/adminPlatform/dashboardLayout/adminManufacturersContext";
import { MAX_ADMIN_JOB_REJECTIONS, getAdminManufacturer, getProjectLead } from "@/constant/admin";
import { REJECTION_CHARGE_PERCENT, getRejectionCharge } from "@/constant/jobWorkflow";
import FollowUpForm from "../form/followUpForm";
import { ACTION_KINDS, useSuperAdminActions, type SuperAdminActionKind } from "../actions/pendingActions";
import ActionCard from "./actionCard";

type OpenDialog =
    | { kind: "delete" | "turn-down"; manufacturerId: string }
    | { kind: "sign-off" | "reject"; jobId: string }
    | { kind: "follow-up"; jobId: string; manufacturerId: string }
    | null;

const DIALOG_BUTTON = "h-11 px-5 font-medium font-text rounded-button cursor-pointer transition-colors duration-300";

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminActionsPage — everything waiting for a super admin, in one queue
// (see useSuperAdminActions): delete an account an admin asked to, or turn
// the request down; sign off or reject finished work a lead rated too low;
// follow up a manufacturer's low rating of their lead; reply to a message
// from the website's contact form; and fix anything stopping payments. Each
// leaves the queue as soon as it's dealt with.
// ─────────────────────────────────────────────────────────────────────────────

export default function SuperAdminActionsPage() {
    const actions = useSuperAdminActions();
    const { getJob, signOffHeldJob, rejectJob, followUpLeadReview } = useAdminJobs();
    const { getManufacturer, declineDeletionRequest } = useAdminManufacturers();
    const [kind, setKind] = useState<SuperAdminActionKind | "all">("all");
    const [dialog, setDialog] = useState<OpenDialog>(null);
    const isClient = useIsClient();
    const queryClient = useQueryClient();
    const close = () => setDialog(null);

    // Marking a contact message as dealt with: it leaves the queue (and the menu's count) at once
    const resolveMessage = useMutation({
        mutationFn: (messageId: string) => contactService.resolveMessage(messageId),
        onSuccess: (message) => toast.success(`${message.name}'s message is marked as dealt with`),
        onError: (error) =>
            toast.error(
                error instanceof MandeApiError && error.code === "ALREADY_RESOLVED"
                    ? "Someone else already marked it as dealt with."
                    : "Couldn't mark the message as dealt with. Please try again.",
            ),
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.contactMessages.all }),
    });
    const now = new Date();

    const shown = actions.filter((action) => kind === "all" || action.kind === kind);
    const counts = Object.fromEntries(
        ACTION_KINDS.map(({ value }) => [value, actions.filter((action) => action.kind === value).length]),
    ) as Record<SuperAdminActionKind, number>;

    const dialogJob = dialog && "jobId" in dialog ? getJob(dialog.jobId) : undefined;
    const dialogManufacturer = dialog && "manufacturerId" in dialog ? getManufacturer(dialog.manufacturerId) : undefined;
    const jobMakers = dialogJob
        ? dialogJob.manufacturerIds.map((id) => getAdminManufacturer(id)?.companyName).filter(Boolean).join(" & ") ||
          "the manufacturer"
        : "";

    const run = (task: () => void, success: string, failure: string) => {
        try {
            task();
            toast.success(success);
        } catch {
            toast.error(failure);
        }
        close();
    };

    return (
        <div className="flex flex-col gap-6">
            <AdminPageHeader
                title="Actions"
                description="What's waiting for a super admin: accounts admins asked to close, low ratings to review, messages from the website, and anything stopping payments."
            />

            <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
                {[{ value: "all" as const, label: "All" }, ...ACTION_KINDS].map((option) => {
                    const count = option.value === "all" ? actions.length : counts[option.value];
                    if (option.value !== "all" && count === 0) return null;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={kind === option.value}
                            onClick={() => setKind(option.value)}
                            className={cn(
                                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium font-text transition-colors cursor-pointer",
                                kind === option.value
                                    ? "border-secondary-700 bg-secondary-700 text-white"
                                    : "border-border bg-white text-mist-700 hover:bg-mist-50",
                            )}
                        >
                            {option.label}
                            <span
                                className={cn(
                                    "rounded-full px-1.5 text-xs tabular-nums",
                                    kind === option.value ? "bg-white/20" : "bg-mist-100 text-mist-600",
                                )}
                            >
                                {isClient ? count : "…"}
                            </span>
                        </button>
                    );
                })}
            </div>

            {!isClient ? (
                <ul aria-hidden className="flex flex-col gap-4">
                    {Array.from({ length: 3 }, (_, index) => (
                        <li key={index} className="flex gap-5 rounded-xl border border-border bg-white p-5">
                            <Skeleton className="size-10 shrink-0 rounded-full" />
                            <div className="flex flex-1 flex-col gap-3">
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-14 w-full" />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : shown.length === 0 ? (
                <div className="rounded-xl border border-border bg-white">
                    <EmptyState
                        icon={CheckCheck}
                        title="You're all caught up"
                        description="Accounts to close, low ratings, website messages and payment problems will show up here"
                    />
                </div>
            ) : (
                <ul className="flex flex-col gap-4">
                    {shown.map((action) => (
                        <ActionCard
                            key={action.id}
                            action={action}
                            now={now}
                            handlers={{
                                onDeleteAccount: (manufacturerId) => setDialog({ kind: "delete", manufacturerId }),
                                onTurnDownDeletion: (manufacturerId) => setDialog({ kind: "turn-down", manufacturerId }),
                                onSignOff: (jobId) => setDialog({ kind: "sign-off", jobId }),
                                onReject: (jobId) => setDialog({ kind: "reject", jobId }),
                                onFollowUp: (jobId, manufacturerId) => setDialog({ kind: "follow-up", jobId, manufacturerId }),
                                onResolveContactMessage: (messageId) => resolveMessage.mutate(messageId),
                                isResolvingContactMessage: (messageId) =>
                                    resolveMessage.isPending && resolveMessage.variables === messageId,
                            }}
                        />
                    ))}
                </ul>
            )}

            {/* Deleting: the account's usual steps, a warning if it's still busy, then typing their name */}
            <ManufacturerActionDialog
                manufacturer={dialog?.kind === "delete" ? dialogManufacturer : undefined}
                action={dialog?.kind === "delete" ? "delete" : null}
                onClose={close}
            />

            <Dialog open={dialog?.kind === "turn-down" && !!dialogManufacturer} onOpenChange={(open) => !open && close()}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    {dialogManufacturer?.deletionRequest && (
                        <>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>Keep the {dialogManufacturer.companyName} account?</DialogTitle>
                                <DialogDescription>
                                    The request from {dialogManufacturer.deletionRequest.requestedBy} is turned down and the
                                    account carries on. An admin can ask again.
                                </DialogDescription>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button type="button" onClick={close} className={`${DIALOG_BUTTON} bg-mist-100 hover:bg-mist-200 text-mist-950`}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() =>
                                        run(
                                            () => declineDeletionRequest(dialogManufacturer.id),
                                            `Deletion request turned down. ${dialogManufacturer.companyName} stays`,
                                            "Couldn't turn the request down. Please try again.",
                                        )
                                    }
                                    className={`${DIALOG_BUTTON} bg-secondary-700 hover:bg-secondary-900 text-white`}
                                >
                                    Turn down
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={dialog?.kind === "sign-off" && !!dialogJob} onOpenChange={(open) => !open && close()}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    {dialogJob?.furtherReview && (
                        <>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>Sign off {dialogJob.title}?</DialogTitle>
                                <DialogDescription>
                                    It&apos;s marked as completed with {dialogJob.furtherReview.authorName}&apos;s rating, and{" "}
                                    {jobMakers} is paid the final part of the job.
                                </DialogDescription>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button type="button" onClick={close} className={`${DIALOG_BUTTON} bg-mist-100 hover:bg-mist-200 text-mist-950`}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() =>
                                        run(
                                            () => signOffHeldJob(dialogJob.id),
                                            `${dialogJob.title} is signed off`,
                                            "Couldn't sign the job off. Please try again.",
                                        )
                                    }
                                    className={`${DIALOG_BUTTON} bg-secondary-700 hover:bg-secondary-900 text-white`}
                                >
                                    Sign off
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={dialog?.kind === "reject" && !!dialogJob} onOpenChange={(open) => !open && close()}>
                <DialogContent className="max-w-110">
                    {dialogJob && (
                        <>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>Reject {dialogJob.title}?</DialogTitle>
                                <DialogDescription>
                                    Rejection {dialogJob.rejections.length + 1} of {MAX_ADMIN_JOB_REJECTIONS}. {jobMakers} will
                                    get your review
                                    {dialogJob.rejections.length + 1 < MAX_ADMIN_JOB_REJECTIONS
                                        ? " and can fix the work and resubmit it"
                                        : ", and can't resubmit it after this"}
                                    , and are charged {formatPrice(getRejectionCharge(dialogJob.amount))} (
                                    {REJECTION_CHARGE_PERCENT}% of the job) from their wallet.
                                </DialogDescription>
                            </div>
                            <RejectJobForm
                                onCancel={close}
                                onReject={(review) =>
                                    run(
                                        () => rejectJob(dialogJob.id, review),
                                        `${dialogJob.title} was rejected. ${jobMakers} has your review`,
                                        "Couldn't reject the job. Please try again.",
                                    )
                                }
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={dialog?.kind === "follow-up" && !!dialogJob} onOpenChange={(open) => !open && close()}>
                <DialogContent className="max-w-110">
                    {dialog?.kind === "follow-up" && dialogJob && (
                        <FollowUpDialogBody
                            leadName={
                                getProjectLead(
                                    dialogJob.leadReviews.find((review) => review.manufacturerId === dialog.manufacturerId)
                                        ?.leadId ?? "",
                                )?.name ?? "the lead"
                            }
                            jobTitle={dialogJob.title}
                            onCancel={close}
                            onSave={(note) =>
                                run(
                                    () => followUpLeadReview(dialogJob.id, dialog.manufacturerId, note),
                                    "Followed up. It's noted with the rating",
                                    "Couldn't save the follow-up. Please try again.",
                                )
                            }
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function FollowUpDialogBody({
    leadName,
    jobTitle,
    onSave,
    onCancel,
}: {
    leadName: string;
    jobTitle: string;
    onSave: (note: string) => void;
    onCancel: () => void;
}) {
    return (
        <>
            <div className="flex flex-col gap-1">
                <DialogTitle>Follow up {leadName}&apos;s rating</DialogTitle>
                <DialogDescription>
                    Note what you did about the low rating on {jobTitle}. It&apos;s kept with the rating, for the record.
                </DialogDescription>
            </div>
            <FollowUpForm leadName={leadName.split(" ")[0]} onSave={onSave} onCancel={onCancel} />
        </>
    );
}
