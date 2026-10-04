"use client";

import { useQuery } from "@tanstack/react-query";
import { useAdminJobs } from "@/components/adminPlatform/dashboardLayout/adminJobsContext";
import { useAdminManufacturers } from "@/components/adminPlatform/dashboardLayout/adminManufacturersContext";
import type { AdminJob } from "@/constant/admin";
import type { ManufacturerRecord } from "@/constant/platformRecords";
import { queryKeys } from "@/lib/queryKeys";
import { contactService, type ContactMessage } from "@/lib/services/contactService";
import { reportsService, type PendingActions } from "@/lib/services/reportsService";
import { useOptionalSuperAdminSettings } from "../settingsContext";

// ─────────────────────────────────────────────────────────────────────────────
// What's waiting for a super admin: the Actions page, and the count beside
// it in the menu. The API's /reports/actions lists account deletions admins
// asked for, finished work a lead rated too low to sign off, manufacturers'
// low ratings of their lead, anything stopping payments, and withdrawals
// stuck with the payment platform; messages from the website's contact form
// come from their own endpoint. The job or account behind an action, when
// the platform has it loaded, rides along for the card's extra detail (the
// photos, the plan, the attachments) and for its dialogs.
// ─────────────────────────────────────────────────────────────────────────────

export type SuperAdminActionKind =
    | "account-deletion"
    | "held-job"
    | "lead-rating"
    | "stuck-withdrawal"
    | "contact-message"
    | "payments";

export const ACTION_KINDS: { value: SuperAdminActionKind; label: string; one: string; many: string }[] = [
    { value: "account-deletion", label: "Accounts to close", one: "account to close", many: "accounts to close" },
    { value: "held-job", label: "Low job ratings", one: "low job rating", many: "low job ratings" },
    { value: "lead-rating", label: "Low lead ratings", one: "low lead rating", many: "low lead ratings" },
    { value: "stuck-withdrawal", label: "Stuck withdrawals", one: "stuck withdrawal", many: "stuck withdrawals" },
    { value: "contact-message", label: "Contact messages", one: "message from the website", many: "messages from the website" },
    { value: "payments", label: "Payments", one: "payment problem", many: "payment problems" },
];

export type DeletionRequestAction = PendingActions["deletionRequests"][number];
export type HeldJobAction = PendingActions["heldJobs"][number];
export type LeadRatingAction = PendingActions["leadRatings"][number];
export type StuckWithdrawalAction = PendingActions["stuckWithdrawals"][number];

export type SuperAdminAction =
    | {
          kind: "account-deletion";
          id: string;
          at: string;
          request: DeletionRequestAction;
          /** The account, if it's loaded: its plan and the request's attachments. */
          manufacturer: ManufacturerRecord | undefined;
      }
    | {
          kind: "held-job";
          id: string;
          at: string | null;
          held: HeldJobAction;
          /** The job, if it's loaded: its manufacturers, amount and photos. */
          job: AdminJob | undefined;
      }
    | { kind: "lead-rating"; id: string; at: string; rating: LeadRatingAction; job: AdminJob | undefined }
    | { kind: "stuck-withdrawal"; id: string; at: string; withdrawal: StuckWithdrawalAction }
    | { kind: "contact-message"; id: string; at: string; message: ContactMessage }
    | {
          kind: "payments";
          id: string;
          at: null;
          /** No platform can take real payments; or one is set to test keys. */
          problem: "no-live-keys" | "test-mode";
          /** For "test-mode", the platform. */
          provider: string | null;
          /** Platforms whose active keys are test keys. */
          testProviders: string[];
      };

/** Payment problems first (they stop money coming in), then whatever has waited longest. */
export function toSuperAdminActions(
    pending: PendingActions | undefined,
    contactMessages: ContactMessage[],
    getJob: (id: string) => AdminJob | undefined,
    getManufacturer: (id: string) => ManufacturerRecord | undefined,
): SuperAdminAction[] {
    if (!pending) return [];

    const payments = pending.payments.map(
        (payment): SuperAdminAction => ({
            kind: "payments",
            id: payment.provider ? `payments-test-${payment.provider}` : "payments-off",
            at: null,
            ...payment,
        }),
    );

    const waiting: SuperAdminAction[] = [
        ...pending.deletionRequests.map(
            (request): SuperAdminAction => ({
                kind: "account-deletion",
                id: `deletion-${request.manufacturerId}`,
                at: request.requestedAt,
                request,
                manufacturer: getManufacturer(request.manufacturerId),
            }),
        ),
        ...pending.heldJobs.map(
            (held): SuperAdminAction => ({
                kind: "held-job",
                id: `held-${held.jobId}`,
                at: held.ratedAt,
                held,
                job: getJob(held.jobId),
            }),
        ),
        ...pending.leadRatings.map(
            (rating): SuperAdminAction => ({
                kind: "lead-rating",
                id: `lead-rating-${rating.jobId}-${rating.manufacturerId}`,
                at: rating.createdAt,
                rating,
                job: getJob(rating.jobId),
            }),
        ),
        ...pending.stuckWithdrawals.map(
            (withdrawal): SuperAdminAction => ({
                kind: "stuck-withdrawal",
                id: `withdrawal-${withdrawal.reference}`,
                at: withdrawal.sentAt,
                withdrawal,
            }),
        ),
        ...contactMessages.map(
            (message): SuperAdminAction => ({ kind: "contact-message", id: `contact-${message.id}`, at: message.sentAt, message }),
        ),
    ];

    return [
        ...payments,
        ...waiting.sort((a, b) => new Date(a.at ?? 0).getTime() - new Date(b.at ?? 0).getTime()),
    ];
}

/**
 * Contact messages still waiting, from the API. Only on the super admin's
 * platform (the menu is shared with admins, who can't read them).
 */
function useOpenContactMessages(onSuperAdminPlatform: boolean) {
    return useQuery({
        queryKey: queryKeys.contactMessages.list("open"),
        queryFn: () => contactService.listMessages("open"),
        enabled: onSuperAdminPlatform,
        // A new message shouldn't wait for a reload to show in the menu's count
        refetchInterval: 2 * 60 * 1000,
    });
}

/**
 * Everything waiting for the super admin now, and whether it's still
 * loading or failed to. Only on their platform (admins can't see it): empty
 * elsewhere.
 */
export function useSuperAdminActionsQuery() {
    const { getJob } = useAdminJobs();
    const { getManufacturer } = useAdminManufacturers();
    const onSuperAdminPlatform = useOptionalSuperAdminSettings() !== null;
    const enabled = onSuperAdminPlatform;
    const pending = useQuery({
        queryKey: queryKeys.reports.actions(),
        queryFn: () => reportsService.getSuperAdminActions(),
        enabled,
        refetchInterval: 2 * 60 * 1000,
    });
    const contact = useOpenContactMessages(onSuperAdminPlatform);
    return {
        actions: toSuperAdminActions(
            pending.data?.actions,
            contact.data?.contactMessages ?? [],
            getJob,
            getManufacturer,
        ),
        isPending: enabled && (pending.isPending || contact.isPending),
        // Contact messages failing to load leaves them out, as before; the rest is the queue
        isError: pending.isError,
    };
}

/** Everything waiting for the super admin now (for the menu's count). Empty until loaded, and off their platform. */
export function useSuperAdminActions(): SuperAdminAction[] {
    return useSuperAdminActionsQuery().actions;
}
