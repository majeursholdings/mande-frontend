"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { ADMIN_MANUFACTURERS, registerManufacturers, type AdminJob, type AdminJobAttachment } from "@/constant/admin";
import { getManufacturerTransactions, getTransactionSummary } from "@/constant/manufacturer";
import type { DeletionRequestRecord, DocumentVerification, ManufacturerAccountStatus, ManufacturerRecord } from "@/constant/sampleDb";
import { isJobUnderwayFor, useAdminJobs } from "./adminJobsContext";
import { useAdminProfile } from "./adminProfileContext";

// ─────────────────────────────────────────────────────────────────────────────
// AdminManufacturersProvider — every manufacturer, shared across the admin
// (or super admin) dashboard so a flag, a suspension, a verification
// decision or a closed account stays put while they move between pages.
// Admins can't close an account: they ask a super admin to, who closes it or
// turns the request down. Closing ("deleting") deactivates the account: the
// API keeps every record, and a super admin can reopen it. Seeded from the sample database and kept in memory
// for now; once the backend is connected, load manufacturers from the API
// and send each change there.
// ─────────────────────────────────────────────────────────────────────────────

/** A document an admin can verify or reject. */
export type ManufacturerDocument = "nin-card" | "tax-number" | "business-license";

/** What's still going on on an account — worth a warning before it's deleted. Empty lists and 0 when nothing is. */
export type AccountDeleteWarnings = {
    /** Jobs offered to them or being worked on, and whether each goes back to pending (theirs alone) or carries on with a co-manufacturer. */
    jobsUnderway: { job: AdminJob; goesBackToPending: boolean }[];
    /** Pending jobs they've applied for. */
    applications: AdminJob[];
    /** Still in their wallet, in naira. */
    walletBalance: number;
    hasPendingAppeal: boolean;
};

export const hasDeleteWarnings = (warnings: AccountDeleteWarnings) =>
    warnings.jobsUnderway.length > 0 ||
    warnings.applications.length > 0 ||
    warnings.walletBalance > 0 ||
    warnings.hasPendingAppeal;

type AdminManufacturersContextValue = {
    manufacturers: ManufacturerRecord[];
    isLoading: boolean;
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
     * when getDeleteWarnings finds anything, taking them off their jobs too
     * (see releaseManufacturer). It leaves the list here, as closed accounts
     * leave the API's list; nothing is deleted.
     */
    deleteManufacturer: (id: string, reauthToken?: string, reason?: string) => Promise<void>;
    /** Super admins only: turns down an admin's request to delete the account. */
    declineDeletionRequest: (id: string) => void;
    getDeleteWarnings: (id: string) => AccountDeleteWarnings;
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
        planId: sm.plan?.planId ?? "solo",
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
    const { data: serverData, isLoading: isServerLoading } = useQuery({
        queryKey: queryKeys.manufacturers.lists(),
        queryFn: () => manufacturerService.getStaffManufacturers({ limit: 50 }),
        staleTime: 30_000,
        retry: 1,
    });

    const baseManufacturers = useMemo(() => {
        if (serverData && Array.isArray(serverData.manufacturers) && serverData.manufacturers.length > 0) {
            const serverManufacturers = serverData.manufacturers as ServerManufacturer[];
            const serverIds = new Set(serverManufacturers.map((sm) => sm.id));
            // Keep sample manufacturers that don't clash with server data
            const sampleOnly = ADMIN_MANUFACTURERS.filter((m) => !serverIds.has(m.id));
            // Merge server data over matching sample entries, or create new records
            const fromServer = serverManufacturers.map((sm) => {
                const sample = ADMIN_MANUFACTURERS.find((m) => m.id === sm.id);
                const deletionRequest = sm.deletionRequest
                    ? {
                          reason: sm.deletionRequest.reason,
                          attachments: (sm.deletionRequest.attachments as unknown as AdminJobAttachment[]) ?? [],
                          requestedBy: sm.deletionRequest.requestedBy || (sm.deletionRequest as unknown as { requestedByName?: string }).requestedByName || "Admin",
                          requestedAt: String(sm.deletionRequest.requestedAt),
                      }
                    : sm.hasDeletionRequest
                      ? (sample?.deletionRequest ?? {
                            reason: "Account closure requested.",
                            attachments: [],
                            requestedBy: "Admin",
                            requestedAt: new Date().toISOString(),
                        })
                      : null;

                if (sample) {
                    return {
                        ...sample,
                        firstName: sm.firstName ?? sample.firstName,
                        lastName: sm.lastName ?? sample.lastName,
                        contactName: `${sm.firstName ?? ""} ${sm.lastName ?? ""}`.trim() || sample.contactName,
                        companyName: sm.companyName ?? sample.companyName,
                        phone: sm.phone ?? sample.phone,
                        accountStatus: sm.accountStatus ?? sample.accountStatus,
                        deletionRequest,
                    };
                }
                return toManufacturerRecord(sm);
            });
            return [...fromServer, ...sampleOnly];
        }
        return ADMIN_MANUFACTURERS;
    }, [serverData]);

    const [localPatches, setLocalPatches] = useState<Record<string, ManufacturerRecord>>({});
    const [deletedIds, setDeletedIds] = useState<string[]>([]);

    const manufacturers = useMemo(() => {
        const result = baseManufacturers
            .filter((m) => !deletedIds.includes(m.id))
            .map((m) => localPatches[m.id] ?? m);
        registerManufacturers(result);
        return result;
    }, [baseManufacturers, localPatches, deletedIds]);

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

    const getManufacturer = (id: string) => manufacturers.find((manufacturer) => manufacturer.id === id);

    const hasJobUnderway = (id: string) => jobs.some((job) => isJobUnderwayFor(job, id));

    const getDeleteWarnings = (id: string): AccountDeleteWarnings => ({
        jobsUnderway: jobs
            .filter((job) => isJobUnderwayFor(job, id))
            .map((job) => ({ job, goesBackToPending: job.manufacturerIds.length === 1 })),
        applications: jobs.filter((job) =>
            job.applications.some((application) => application.manufacturerId === id && application.status === "pending"),
        ),
        walletBalance: Math.max(0, getTransactionSummary(getManufacturerTransactions(id, jobs)).balance),
        hasPendingAppeal: !!getManufacturer(id)?.appeals.some((appeal) => appeal.status === "pending"),
    });

    const value: AdminManufacturersContextValue = {
        manufacturers,
        isLoading: isServerLoading,
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
                queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
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
                queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
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
                queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
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
                queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.all });
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
                .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.all }))
                .catch((err) => console.error("Failed to decline deletion request on server:", err));
        },
        getDeleteWarnings,
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
                .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.manufacturers.all }))
                .catch((err) => console.error("Failed to decide document verification on server:", err));
        },
        getAssignBlocker: (id) => {
            const manufacturer = getManufacturer(id);
            if (manufacturer?.accountStatus === "suspended") return "Suspended, can't take jobs";
            if (manufacturer?.accountStatus !== "flagged") return null;
            return hasJobUnderway(id) ? "Flagged, already has a job" : null;
        },
    };

    return <AdminManufacturersContext.Provider value={value}>{children}</AdminManufacturersContext.Provider>;
}

export function useAdminManufacturers() {
    const context = useContext(AdminManufacturersContext);
    if (!context) {
        throw new Error("useAdminManufacturers must be used within an AdminManufacturersProvider");
    }
    return context;
}
