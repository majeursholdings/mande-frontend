"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ADMIN_MANUFACTURERS, type AdminJob, type AdminJobAttachment } from "@/constant/admin";
import { getManufacturerTransactions, getTransactionSummary } from "@/constant/manufacturer";
import type { DocumentVerification, ManufacturerAccountStatus, ManufacturerRecord } from "@/constant/sampleDb";
import { isJobUnderwayFor, useAdminJobs } from "./adminJobsContext";
import { useAdminProfile } from "./adminProfileContext";

// ─────────────────────────────────────────────────────────────────────────────
// AdminManufacturersProvider — every manufacturer, shared across the admin
// (or super admin) dashboard so a flag, a suspension, a verification
// decision or a deletion stays put while they move between pages. Admins
// can't delete an account: they ask a super admin to, who deletes it or
// turns the request down. Seeded from the sample database and kept in memory
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
    getManufacturer: (id: string) => ManufacturerRecord | undefined;
    /**
     * Flagged: they can hold one job at a time. Suspended: everything is
     * paused but an appeal. Active: lifts the flag or suspension.
     */
    changeStatus: (id: string, status: ManufacturerAccountStatus, reason: string | null) => void;
    /** Approving lifts the suspension; turning it down keeps it, with why. */
    decideAppeal: (id: string, appealId: string, decision: "approved" | "declined", response: string | null) => void;
    /** Sends the deletion to a super admin to carry out. */
    requestDeletion: (id: string, request: { reason: string; attachments: AdminJobAttachment[] }) => void;
    /**
     * Super admins only: removes the account for good — after a warning when
     * getDeleteWarnings finds anything, it takes them off their jobs too (see
     * releaseManufacturer).
     */
    deleteManufacturer: (id: string) => void;
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

export function AdminManufacturersProvider({ children }: { children: ReactNode }) {
    const { jobs, releaseManufacturer } = useAdminJobs();
    const { fullName: myName } = useAdminProfile();
    const [manufacturers, setManufacturers] = useState(ADMIN_MANUFACTURERS);

    const patch = (id: string, change: (manufacturer: ManufacturerRecord) => ManufacturerRecord) =>
        setManufacturers((current) =>
            current.map((manufacturer) => (manufacturer.id === id ? change(manufacturer) : manufacturer)),
        );

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
        getManufacturer,
        changeStatus: (id, status, reason) =>
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
            }),
        decideAppeal: (id, appealId, decision, response) =>
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
            }),
        requestDeletion: (id, request) =>
            patch(id, (manufacturer) =>
                manufacturer.deletionRequest
                    ? manufacturer
                    : {
                          ...manufacturer,
                          deletionRequest: { ...request, requestedBy: myName, requestedAt: new Date().toISOString() },
                      },
            ),
        deleteManufacturer: (id) => {
            releaseManufacturer(id);
            setManufacturers((current) => current.filter((manufacturer) => manufacturer.id !== id));
        },
        declineDeletionRequest: (id) => patch(id, (manufacturer) => ({ ...manufacturer, deletionRequest: null })),
        getDeleteWarnings,
        decideVerification: (id, document, decision, rejectionReason) =>
            patch(id, (manufacturer) =>
                DOCUMENT_FIELDS[document](manufacturer, {
                    status: decision,
                    rejectionReason: decision === "rejected" ? (rejectionReason ?? null) : null,
                }),
            ),
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
