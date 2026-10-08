"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { registerManufacturers, type AdminJobAttachment } from "@/constant/admin";
import type { DeletionRequestRecord, DocumentVerification, ManufacturerAccountStatus, ManufacturerRecord } from "@/constant/platformRecords";
import { isJobUnderwayFor, useAdminJobs } from "./adminJobsContext";
import { useAdminProfile } from "./adminProfileContext";

// ─────────────────────────────────────────────────────────────────────────────
// AdminManufacturersProvider — every manufacturer, shared across the admin
// (or super admin) dashboard so a flag, a suspension, a verification
// decision or a closed account stays put while they move between pages.
// Admins can't close an account: they ask a super admin to, who closes it or
// turns the request down. Closing ("deleting") deactivates the account: the
// API keeps every record, and a super admin can reopen it. Loaded from the
// API; each change is sent there.
// ─────────────────────────────────────────────────────────────────────────────

/** A document an admin can verify or reject. */
export type ManufacturerDocument = "nin-card" | "tax-number" | "business-license";

/** What's still going on on an account — worth a warning before it's deleted. Empty lists and 0 when nothing is. */
export type AccountDeleteWarnings = {
    /** Jobs offered to them or being worked on, and whether each goes back to pending (theirs alone) or carries on with a co-manufacturer. */
    jobsUnderway: { job: { id: string; title: string }; goesBackToPending: boolean }[];
    /** Pending jobs they've applied for. */
    applications: { id: string; title: string }[];
    /** Still in their wallet, in naira. */
    walletBalance: number;
    /** What they owe the platform (e.g. rejection charges not yet taken), in naira. */
    owed: number;
    hasPendingAppeal: boolean;
    hasPendingWithdrawal: boolean;
};

type ApiDeactivationWarnings = {
    jobsUnderway: { id: string; title: string; status: string; goesBackToPending: boolean }[];
    applications: { id: string; title: string }[];
    walletBalanceKobo: number;
    owedKobo: number;
    hasPendingAppeal: boolean;
    hasPendingWithdrawal: boolean;
};

/** What closing a manufacturer's account would affect, from the API (super admins only). */
export function useDeleteWarnings(manufacturerId: string) {
    return useQuery({
        queryKey: [...queryKeys.manufacturers.detail(manufacturerId), "deactivation-warnings"],
        queryFn: async (): Promise<AccountDeleteWarnings> => {
            const { warnings } = (await manufacturerService.getDeactivationWarnings(manufacturerId)) as {
                warnings: ApiDeactivationWarnings;
            };
            return {
                jobsUnderway: warnings.jobsUnderway.map((job) => ({
                    job: { id: job.id, title: job.title },
                    goesBackToPending: job.goesBackToPending,
                })),
                applications: warnings.applications,
                walletBalance: warnings.walletBalanceKobo / 100,
                owed: warnings.owedKobo / 100,
                hasPendingAppeal: warnings.hasPendingAppeal,
                hasPendingWithdrawal: warnings.hasPendingWithdrawal,
            };
        },
        // Always as things are now, when the dialog opens
        staleTime: 0,
    });
}

export const hasDeleteWarnings = (warnings: AccountDeleteWarnings) =>
    warnings.jobsUnderway.length > 0 ||
    warnings.applications.length > 0 ||
    warnings.walletBalance > 0 ||
    warnings.owed > 0 ||
    warnings.hasPendingAppeal ||
    warnings.hasPendingWithdrawal;

type AdminManufacturersContextValue = {
    manufacturers: ManufacturerRecord[];
    /** True while the first load of the manufacturers is in flight (show skeletons). */
    isLoading: boolean;
    /** True when the manufacturers couldn't be loaded (show an inline error, not an empty state). */
    isError: boolean;
    getManufacturer: (id: string) => ManufacturerRecord | undefined;
    /**
     * Flagged: they can hold one job at a time. Suspended: everything is
     * paused but an appeal. Active: lifts the flag or suspension.
     */
    changeStatus: (id: string, status: ManufacturerAccountStatus, reason: string | null) => Promise<void>;
    /** Approving lifts the suspension; turning it down keeps it, with why. */
    decideAppeal: (id: string, appealId: string, decision: "approved" | "declined", response: string | null) => Promise<void>;
    /** Sends the deletion to a super admin to carry out. */
    requestDeletion: (id: string, request: { reason: string; attachments: AdminJobAttachment[] }) => Promise<void>;
    /**
     * Super admins only: closes (deactivates) the account, after a warning
     * when useDeleteWarnings finds anything, taking them off their jobs too
     * (see releaseManufacturer). It leaves the list here, as closed accounts
     * leave the API's list; nothing is deleted.
     */
    deleteManufacturer: (id: string, reauthToken?: string, reason?: string) => Promise<void>;
    /** Super admins only: turns down an admin's request to delete the account. */
    declineDeletionRequest: (id: string) => void;
    decideVerification: (
        id: string,
        document: ManufacturerDocument,
        decision: "verified" | "rejected",
        rejectionReason?: string,
    ) => void;
    /**
     * Why a manufacturer can't be given another job — suspended, or flagged
     * with a job already underway. Null when they can.
     */
    getAssignBlocker: (id: string) => string | null;
};

const AdminManufacturersContext = createContext<AdminManufacturersContextValue | null>(null);

const DOCUMENT_FIELDS: Record<
    ManufacturerDocument,
    (manufacturer: ManufacturerRecord, verification: DocumentVerification) => ManufacturerRecord
> = {
    "nin-card": (manufacturer, verification) => ({
        ...manufacturer,
        ninCard: { ...manufacturer.ninCard, ...verification },
    }),
    "tax-number": (manufacturer, verification) => ({ ...manufacturer, companyTaxNumberVerification: verification }),
    "business-license": (manufacturer, verification) => ({
        ...manufacturer,
        businessLicenseNumberVerification: verification,
    }),
};

/** Shape of a manufacturer from the staff list endpoint. */
type ServerManufacturer = {
    id: string;
    userId?: string | null;
    firstName: string;
    lastName: string;
    companyName: string;
    email: string | null;
    phone: string;
    avatar: { url: string } | null;
    specialities: string[];
    plan: { planId: string; billingCycle: "monthly" | "yearly"; status: string; renewsAt: string | null } | null;
    accountStatus: ManufacturerRecord["accountStatus"];
    isDeactivated: boolean;
    verification: string;
    joinedAt: string | null;
    hasDeletionRequest: boolean;
    deletionRequest?: DeletionRequestRecord | null;
};

/** Build a full ManufacturerRecord from a server list item with sensible defaults for fields the list doesn't carry. */
const toManufacturerRecord = (sm: ServerManufacturer): ManufacturerRecord => ({
    id: sm.id,
    userId: sm.userId ?? null,
    firstName: sm.firstName ?? "",
    lastName: sm.lastName ?? "",
    contactName: `${sm.firstName ?? ""} ${sm.lastName ?? ""}`.trim() || sm.companyName,
    companyName: sm.companyName ?? "",
    email: sm.email ?? "",
    phone: sm.phone ?? "",
    dateOfBirth: null,
    avatarUrl: sm.avatar?.url ?? null,
    joinedAt: sm.joinedAt ?? new Date().toISOString(),
    address: { streetAddress: "", city: "", state: "", country: "NG" },
    specialities: sm.specialities ?? [],
    staffRange: "",
    productionLeadTime: "",
    materialsInventory: "",
    ninCard: { imageUrl: "", status: "pending", rejectionReason: null },
    companyTaxNumber: "",
    companyTaxNumberVerification: { status: "pending", rejectionReason: null },
    businessLicenseNumber: "",
    businessLicenseNumberVerification: { status: "pending", rejectionReason: null },
    subscription: {
        // No plan: an empty id, which no plan matches (shown as having none)
        planId: sm.plan?.planId ?? "",
        billingCycle: sm.plan?.billingCycle === "yearly" ? "annual" : "monthly",
        renewsAt: sm.plan?.renewsAt ?? new Date().toISOString(),
        renewalsPaidFrom: "card",
    },
    bankAccount: null,
    security: { twoFactorMethod: null, linkedAccounts: { google: null, facebook: null } },
    activity: [],
    accountStatus: sm.accountStatus ?? "active",
    statusHistory: [],
    appeals: [],
    deletionRequest: sm.deletionRequest
        ? {
              reason: sm.deletionRequest.reason,
              attachments: (sm.deletionRequest.attachments as unknown as AdminJobAttachment[]) ?? [],
              requestedBy: sm.deletionRequest.requestedBy || (sm.deletionRequest as unknown as { requestedByName?: string }).requestedByName || "Admin",
              requestedAt: String(sm.deletionRequest.requestedAt),
          }
        : sm.hasDeletionRequest
          ? {
                reason: "Account closure requested.",
                attachments: [],
                requestedBy: "Admin",
                requestedAt: new Date().toISOString(),
            }
          : null,
});

export function AdminManufacturersProvider({ children }: { children: ReactNode }) {
    const { jobs, releaseManufacturer } = useAdminJobs();
    const { fullName: myName } = useAdminProfile();
    const queryClient = useQueryClient();
    // Fetch live manufacturers from backend
    const { data: serverData, isLoading: isServerLoading, isError: isServerError } = useQuery({
        queryKey: queryKeys.manufacturers.lists(),
        queryFn: () => manufacturerService.getStaffManufacturers({ limit: 50 }),
        staleTime: 30_000,
        retry: 1,
    });

    const baseManufacturers = useMemo(
        () => ((serverData?.manufacturers ?? []) as ServerManufacturer[]).map(toManufacturerRecord),
        [serverData],
    );

    const [localPatches, setLocalPatches] = useState<Record<string, ManufacturerRecord>>({});
    const [deletedIds, setDeletedIds] = useState<string[]>([]);

    const manufacturers = useMemo(() => {
        const result = baseManufacturers
            .filter((m) => !deletedIds.includes(m.id))
            .map((m) => localPatches[m.id] ?? m);
        registerManufacturers(result);
        return result;
    }, [baseManufacturers, localPatches, deletedIds]);

    // Everything the context hands out is built here, together, so it keeps its
    // identity until the manufacturers, the jobs (for getAssignBlocker) or who's
    // signed in change. The actions read the list as of the render that made them.
    const value: AdminManufacturersContextValue = useMemo(() => {
        // A change shows in the manufacturers lists and in the reports built from them
        const refreshManufacturers = () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.all }),
                queryClient.invalidateQueries({ queryKey: queryKeys.reports.all }),
            ]);

        const patch = (id: string, change: (manufacturer: ManufacturerRecord) => ManufacturerRecord) => {
            const current = manufacturers.find((m) => m.id === id);
            if (!current) return;
            const patched = change(current);
            setLocalPatches((prev) => ({ ...prev, [id]: patched }));
        };

        /** Undo an optimistic patch when the API call it was for fails. */
        const rollbackPatch = (id: string, previous: ManufacturerRecord | undefined) => {
            setLocalPatches((prev) => {
                const next = { ...prev };
                if (previous) {
                    next[id] = previous;
                } else {
                    delete next[id];
                }
                return next;
            });
        };

        // By database id, or the readable userId a profile URL uses
        const getManufacturer = (id: string) =>
            manufacturers.find((manufacturer) => manufacturer.id === id || manufacturer.userId === id);

        const hasJobUnderway = (id: string) => jobs.some((job) => isJobUnderwayFor(job, id));

        return {
            manufacturers,
            isLoading: isServerLoading,
            isError: isServerError,
            getManufacturer,
            changeStatus: async (id, status, reason) => {
                const previousPatch = localPatches[id];
                patch(id, (manufacturer) => {
                    if (manufacturer.accountStatus === status) return manufacturer;
                    const now = new Date().toISOString();
                    // Lifting a suspension answers any appeal still waiting
                    const liftsSuspension = manufacturer.accountStatus === "suspended" && status === "active";
                    return {
                        ...manufacturer,
                        accountStatus: status,
                        statusHistory: [{ status, reason, by: myName, at: now }, ...manufacturer.statusHistory],
                        appeals: liftsSuspension
                            ? manufacturer.appeals.map((appeal) =>
                                  appeal.status === "pending"
                                      ? {
                                            ...appeal,
                                            status: "approved" as const,
                                            response: reason ?? "Suspension lifted.",
                                            decidedBy: myName,
                                            decidedAt: now,
                                        }
                                      : appeal,
                              )
                            : manufacturer.appeals,
                    };
                });
                try {
                    await manufacturerService.changeStatus(id, status, reason);
                    refreshManufacturers();
                } catch (err) {
                    rollbackPatch(id, previousPatch);
                    throw err;
                }
            },
            decideAppeal: async (id, appealId, decision, response) => {
                const previousPatch = localPatches[id];
                patch(id, (manufacturer) => {
                    const appeal = manufacturer.appeals.find((candidate) => candidate.id === appealId);
                    if (appeal?.status !== "pending") return manufacturer;
                    const now = new Date().toISOString();
                    const decided: ManufacturerRecord = {
                        ...manufacturer,
                        appeals: manufacturer.appeals.map((candidate) =>
                            candidate.id === appealId
                                ? { ...candidate, status: decision, response, decidedBy: myName, decidedAt: now }
                                : candidate,
                        ),
                    };
                    // An approved appeal lifts the suspension
                    return decision === "approved" && manufacturer.accountStatus === "suspended"
                        ? {
                              ...decided,
                              accountStatus: "active",
                              statusHistory: [
                                  { status: "active", reason: response ?? "Appeal approved.", by: myName, at: now },
                                  ...manufacturer.statusHistory,
                              ],
                          }
                        : decided;
                });
                try {
                    await manufacturerService.decideAppeal(id, appealId, decision, response);
                    refreshManufacturers();
                } catch (err) {
                    rollbackPatch(id, previousPatch);
                    throw err;
                }
            },
            requestDeletion: async (id, request) => {
                const previousPatch = localPatches[id];
                patch(id, (manufacturer) =>
                    manufacturer.deletionRequest
                        ? manufacturer
                        : {
                              ...manufacturer,
                              deletionRequest: { ...request, requestedBy: myName, requestedAt: new Date().toISOString() },
                          },
                );
                const attachments = request.attachments
                    .filter((a) => !!a.publicId)
                    .map((a) => ({ publicId: a.publicId!, name: a.name }));
                try {
                    await manufacturerService.requestDeletion(id, { reason: request.reason, attachments });
                    refreshManufacturers();
                } catch (err) {
                    rollbackPatch(id, previousPatch);
                    throw err;
                }
            },
            deleteManufacturer: async (id, reauthToken, reason) => {
                const target = getManufacturer(id);
                releaseManufacturer(id);
                setDeletedIds((prev) => [...prev, id]);
                try {
                    await manufacturerService.deactivateManufacturer(
                        id,
                        {
                            reason: reason ?? "Closed by Super Admin",
                            confirmName: target?.contactName ?? target?.companyName ?? "Manufacturer",
                        },
                        reauthToken,
                    );
                    refreshManufacturers();
                } catch (err) {
                    // Roll back optimistic removal so the manufacturer reappears
                    setDeletedIds((prev) => prev.filter((deletedId) => deletedId !== id));
                    throw err;
                }
            },
            declineDeletionRequest: (id) => {
                patch(id, (manufacturer) => ({ ...manufacturer, deletionRequest: null }));
                manufacturerService
                    .declineDeletionRequest(id)
                    .then(() => refreshManufacturers())
                    .catch((err) => console.error("Failed to decline deletion request on server:", err));
            },
            decideVerification: (id, document, decision, rejectionReason) => {
                patch(id, (manufacturer) =>
                    DOCUMENT_FIELDS[document](manufacturer, {
                        status: decision,
                        rejectionReason: decision === "rejected" ? (rejectionReason ?? null) : null,
                    }),
                );
                const docMap: Record<ManufacturerDocument, "nin" | "company-tax-number" | "business-license-number"> = {
                    "nin-card": "nin",
                    "tax-number": "company-tax-number",
                    "business-license": "business-license-number",
                };
                manufacturerService
                    .decideDocumentVerification(id, docMap[document], decision, rejectionReason)
                    .then(() => refreshManufacturers())
                    .catch((err) => console.error("Failed to decide document verification on server:", err));
            },
            getAssignBlocker: (id) => {
                const manufacturer = getManufacturer(id);
                if (manufacturer?.accountStatus === "suspended") return "Suspended, can't take jobs";
                if (manufacturer?.accountStatus !== "flagged") return null;
                return hasJobUnderway(id) ? "Flagged, already has a job" : null;
            },
        } satisfies AdminManufacturersContextValue;
    }, [manufacturers, localPatches, jobs, releaseManufacturer, myName, queryClient, isServerLoading, isServerError]);

    return <AdminManufacturersContext.Provider value={value}>{children}</AdminManufacturersContext.Provider>;
}

export function useAdminManufacturers() {
    const context = useContext(AdminManufacturersContext);
    if (!context) {
        throw new Error("useAdminManufacturers must be used within an AdminManufacturersProvider");
    }
    return context;
}
