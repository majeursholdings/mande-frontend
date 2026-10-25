"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import MainForm from "@/components/form";
import type { FormFieldConfig } from "@/components/form/types";
import { FormSubmitButton } from "@/components/adminPlatform/form/formButtons";
import { DataTable, StatusBadge, type ColumnDef } from "@/components/customTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api";
import { formatBalance, formatPrice, fromKobo } from "@/lib/currency";
import { queryKeys } from "@/lib/queryKeys";
import { customerService, type CustomerRewards as Rewards, type CustomerRewardsEntry } from "@/lib/services/customerService";
import { cn } from "@/lib/utils";
import ShopReasonForm from "../form/shopReasonForm";
import ReauthSteps from "../reauthSteps";

// ─────────────────────────────────────────────────────────────────────────────
// A customer's reward points (SHOP_IMPLEMENTATION.md 5.7), for super admins:
// their balance (spendable and on the way), their referral link, how many
// orders they've referred, and their statement. Suspending stops their link
// and coupons working and stops them earning; adjusting adds or takes off
// points with a note (it's money MANDE owes, so it asks to confirm it's you).
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const KIND_LABELS: Record<CustomerRewardsEntry["kind"], string> = {
    earn: "Earned",
    reverse: "Taken back",
    expire: "Expired",
    spent: "Spent",
    refund: "Given back",
    released: "Given back",
    adjustment: "Adjusted",
};

const COLUMNS: ColumnDef<CustomerRewardsEntry>[] = [
    { key: "at", header: "Date", cell: (entry) => <span className="whitespace-nowrap">{dayjs(entry.at).format("D MMM YYYY, h:mm a")}</span> },
    {
        key: "kind",
        header: "Type",
        cell: (entry) => (
            <span className="flex flex-col">
                <span>{KIND_LABELS[entry.kind]}</span>
                {entry.status !== "available" && <span className="text-xs text-mist-500">{entry.status === "pending" ? "On the way" : "Cancelled"}</span>}
            </span>
        ),
    },
    {
        key: "summary",
        header: "What for",
        cell: (entry) => (
            <span className="flex flex-col">
                <span className="max-w-72 text-mist-950">{entry.summary}</span>
                {entry.note && <span className="max-w-72 text-xs text-mist-500">Note: {entry.note}</span>}
                {entry.orderCode && <span className="font-mono text-xs text-mist-500">{entry.orderCode}</span>}
            </span>
        ),
    },
    {
        key: "amount",
        header: "Amount",
        cell: (entry) => (
            <span className={cn("whitespace-nowrap font-medium tabular-nums", entry.status === "void" ? "text-mist-400 line-through" : entry.amountKobo > 0 ? "text-primary-700" : "text-mist-950")}>
                {entry.amountKobo > 0 ? "+" : "-"}
                {formatPrice(fromKobo(Math.abs(entry.amountKobo)))}
            </span>
        ),
    },
    { key: "expires", header: "Expires", cell: (entry) => <span className="whitespace-nowrap text-mist-600">{entry.expiresAt ? dayjs(entry.expiresAt).format("D MMM YYYY") : "-"}</span> },
];

export default function CustomerRewards({ customerId, customerName }: { customerId: string; customerName: string }) {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [dialog, setDialog] = useState<"status" | "adjust" | null>(null);
    const query = useQuery({
        queryKey: queryKeys.customers.rewards(customerId, page),
        queryFn: () => customerService.getRewards(customerId, { page, limit: PAGE_SIZE }),
        staleTime: 30_000,
        placeholderData: (previous) => previous,
    });
    const rewards = query.data;
    const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.rewards(customerId, page).slice(0, -1) });
    const suspended = rewards?.status === "suspended";

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 text-xs font-text text-mist-500">
                        Reward points to spend
                        {rewards && <StatusBadge label={suspended ? "Suspended" : "Active"} tone={suspended ? "red" : "green"} variant="pill" />}
                    </span>
                    {rewards ? (
                        <span className="text-2xl font-semibold font-text tabular-nums text-mist-950">{formatBalance(fromKobo(rewards.balance.availableKobo))}</span>
                    ) : query.isError ? (
                        <span className="text-sm font-text text-error-600">Couldn&apos;t load their rewards.</span>
                    ) : (
                        <Skeleton className="h-8 w-32" />
                    )}
                    {rewards && (
                        <span className="text-xs font-text text-mist-500">
                            {formatPrice(fromKobo(rewards.balance.pendingKobo))} on the way. {rewards.referredOrders} referred {rewards.referredOrders === 1 ? "order" : "orders"}.
                            {rewards.linkCode ? ` Link code ${rewards.linkCode}.` : " No referral link yet."}
                        </span>
                    )}
                    {suspended && rewards?.suspendedReason && <span className="text-xs font-text text-error-700">Suspended: {rewards.suspendedReason}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        disabled={!rewards}
                        onClick={() => setDialog("adjust")}
                        className="h-10 cursor-pointer rounded-button bg-mist-100 px-4 text-sm font-medium font-text text-mist-950 hover:bg-mist-200"
                    >
                        Adjust points
                    </Button>
                    <Button
                        type="button"
                        disabled={!rewards}
                        onClick={() => setDialog("status")}
                        className={cn(
                            "h-10 cursor-pointer rounded-button px-4 text-sm font-medium font-text text-white",
                            suspended ? "bg-secondary-700 hover:bg-secondary-900" : "bg-error-600 hover:bg-error-700",
                        )}
                    >
                        {suspended ? "Restore rewards" : "Suspend rewards"}
                    </Button>
                </div>
            </div>
            <DataTable
                tableId="customer-rewards"
                columns={COLUMNS}
                rows={rewards?.entries ?? []}
                page={page}
                onPageChange={setPage}
                pagination={{ total: rewards?.total ?? 0, totalPages: rewards?.totalPages || 1, rowsPerPage: PAGE_SIZE }}
                loading={query.isPending}
                error={query.isError ? "We couldn't load their reward points. Please refresh the page." : undefined}
                emptyMessage="No reward points have moved on this account yet."
            />

            <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
                <DialogContent className="max-w-120">
                    {dialog === "status" && rewards && (
                        <StatusSteps customerId={customerId} customerName={customerName} rewards={rewards} onClose={() => setDialog(null)} onDone={refresh} />
                    )}
                    {dialog === "adjust" && rewards && (
                        <AdjustSteps customerId={customerId} customerName={customerName} rewards={rewards} onClose={() => setDialog(null)} onDone={refresh} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

type StepsProps = { customerId: string; customerName: string; rewards: Rewards; onClose: () => void; onDone: () => Promise<unknown> };

function StatusSteps({ customerId, customerName, rewards, onClose, onDone }: StepsProps) {
    const restoring = rewards.status === "suspended";
    return (
        <>
            <div className="flex flex-col gap-1">
                <DialogTitle>{restoring ? `Restore ${customerName}'s rewards?` : `Suspend ${customerName}'s rewards?`}</DialogTitle>
                <DialogDescription>
                    {restoring
                        ? "Their referral link and coupons work again, and they earn on new referred orders."
                        : "Their referral link and coupons stop working, and they stop earning. Points they have can still be spent."}
                </DialogDescription>
            </div>
            <ShopReasonForm
                label="Reason"
                placeholder={restoring ? "e.g. Agreed to stop posting codes on deal sites" : "e.g. Posting codes on deal sites"}
                description="Kept in the activity log for other super admins."
                submitLabel={restoring ? "Restore" : "Suspend"}
                loadingLabel="Saving..."
                onCancel={onClose}
                onSubmit={async (reason) => {
                    try {
                        await customerService.setRewardsStatus(customerId, restoring ? "active" : "suspended", reason);
                        toast.success(restoring ? `${customerName}'s rewards are back on.` : `${customerName}'s rewards are suspended.`);
                        onClose();
                        await onDone();
                    } catch (error) {
                        toast.error(getErrorMessage(error, "Couldn't change their rewards. Please try again."));
                    }
                }}
            />
        </>
    );
}

type AdjustValues = { direction: "add" | "remove"; amount: string; note: string };

function AdjustSteps({ customerId, customerName, rewards, onClose, onDone }: StepsProps) {
    const [pending, setPending] = useState<{ amountKobo: number; note: string } | null>(null);
    const methods = useForm<AdjustValues>({ mode: "onTouched", defaultValues: { direction: "add", amount: "", note: "" } });
    const available = fromKobo(Math.max(0, rewards.balance.availableKobo));

    const fields: FormFieldConfig[] = [
        {
            name: "direction",
            type: "radio",
            label: "Adjustment",
            options: [
                { value: "add", label: "Add points" },
                { value: "remove", label: "Take points off" },
            ],
        },
        {
            name: "amount",
            type: "amount",
            label: "Amount (1 point = ₦1)",
            placeholder: "₦0",
            description: `They have ${formatPrice(available)} to spend. Added points expire like earned ones.`,
            validation: {
                required: "Enter an amount",
                validate: (value: string, values: Record<string, unknown>) =>
                    Number(value) < 1 ? "Enter at least ₦1" : values.direction === "remove" && Number(value) > available ? "That's more than they have to spend" : true,
            },
        },
        {
            name: "note",
            type: "textarea",
            label: "Note",
            placeholder: "e.g. Sorry for the late delivery on SO-7K2Q9D",
            height: 72,
            description: "Shown to other super admins on their statement.",
            validation: { required: "Say why", minLength: { value: 3, message: "Say why" }, maxLength: { value: 300, message: "Keep it under 300 characters" } },
        },
    ];

    const header = (
        <div className="flex flex-col gap-1">
            <DialogTitle>Adjust {customerName}&apos;s points</DialogTitle>
            <DialogDescription>Points are store credit MANDE owes them, spendable on MANDE products.</DialogDescription>
        </div>
    );

    if (pending) {
        return (
            <>
                {header}
                <ReauthSteps
                    confirmLabel={pending.amountKobo > 0 ? `Add ${formatPrice(fromKobo(pending.amountKobo))}` : `Take off ${formatPrice(fromKobo(-pending.amountKobo))}`}
                    onCancel={onClose}
                    onConfirmed={async (reauthToken) => {
                        try {
                            await customerService.adjustRewards(customerId, pending.amountKobo, pending.note, reauthToken);
                        } catch (error) {
                            // Shown in the dialog, which stays open to try again
                            throw new Error(getErrorMessage(error, "Couldn't adjust their points. Please try again."));
                        }
                        toast.success(`${customerName}'s points were adjusted.`);
                        onClose();
                        await onDone();
                    }}
                />
            </>
        );
    }

    return (
        <>
            {header}
            <MainForm<AdjustValues>
                methods={methods}
                fields={fields}
                hideRequiredMarks
                onSubmit={(values) => {
                    try {
                        const kobo = Math.round(Number(values.amount) * 100);
                        setPending({ amountKobo: values.direction === "add" ? kobo : -kobo, note: values.note.trim() });
                    } catch {
                        toast.error("Couldn't check the adjustment. Please try again.");
                    }
                }}
                renderFooter={({ isLoading, canSubmit }) => (
                    <div className="flex justify-end gap-3">
                        <Button type="button" onClick={onClose} className="h-11 cursor-pointer rounded-button bg-mist-100 px-5 font-medium font-text text-mist-950 hover:bg-mist-200">
                            Cancel
                        </Button>
                        <FormSubmitButton label="Continue" isLoading={isLoading} disabled={!canSubmit} className="w-auto px-5" />
                    </div>
                )}
            />
        </>
    );
}
