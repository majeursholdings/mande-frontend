"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ADMIN_MANUFACTURERS, ADMIN_PROFILE, isRejectionFinal, type AdminJobAttachment } from "@/constant/admin";
import type { DocumentVerification, ManufacturerAccountStatus, ManufacturerRecord } from "@/constant/sampleDb";
import { useAdminJobs } from "./adminJobsContext";

// ─────────────────────────────────────────────────────────────────────────────
// AdminManufacturersProvider — every manufacturer, shared across the admin
// dashboard so a flag, a suspension, a verification decision or a deletion
// request stays put while the admin moves between pages. Admins can't delete
// an account — they ask a super admin to. Seeded from the sample database
// and kept in memory for now; once the backend is connected, load
// manufacturers from the API and send each change there.
// ─────────────────────────────────────────────────────────────────────────────

/** A document an admin can verify or reject. */
export type ManufacturerDocument = "nin-card" | "tax-number" | "business-license";

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

const MY_NAME = `${ADMIN_PROFILE.firstName} ${ADMIN_PROFILE.lastName}`;

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
    const { jobs } = useAdminJobs();
    const [manufacturers, setManufacturers] = useState(ADMIN_MANUFACTURERS);

    const patch = (id: string, change: (manufacturer: ManufacturerRecord) => ManufacturerRecord) =>
        setManufacturers((current) =>
            current.map((manufacturer) => (manufacturer.id === id ? change(manufacturer) : manufacturer)),
        );

    const getManufacturer = (id: string) => manufacturers.find((manufacturer) => manufacturer.id === id);

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
                    statusHistory: [{ status, reason, by: MY_NAME, at: now }, ...manufacturer.statusHistory],
                    appeals: liftsSuspension
                        ? manufacturer.appeals.map((appeal) =>
                              appeal.status === "pending"
                                  ? {
                                        ...appeal,
                                        status: "approved" as const,
                                        response: reason ?? "Suspension lifted.",
                                        decidedBy: MY_NAME,
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
                            ? { ...candidate, status: decision, response, decidedBy: MY_NAME, decidedAt: now }
                            : candidate,
                    ),
                };
                // An approved appeal lifts the suspension
                return decision === "approved" && manufacturer.accountStatus === "suspended"
                    ? {
                          ...decided,
                          accountStatus: "active",
                          statusHistory: [
                              { status: "active", reason: response ?? "Appeal approved.", by: MY_NAME, at: now },
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
                          deletionRequest: { ...request, requestedBy: MY_NAME, requestedAt: new Date().toISOString() },
                      },
            ),
        decideVerification: (id, document, decision, rejectionReason) =>
            patch(id, (manufacturer) =>
                DOCUMENT_FIELDS[document](manufacturer, {
                    status: decision,
                    rejectionReason: decision === "rejected" ? (rejectionReason ?? null) : null,
                }),
            ),
        getAssignBlocker: (id) => {
            const manufacturer = getManufacturer(id);
            if (manufacturer?.accountStatus === "suspended") return "Suspended — can't take jobs";
            if (manufacturer?.accountStatus !== "flagged") return null;
            // Offered, or being worked on — anything not finished
            const hasJob = jobs.some(
                (job) =>
                    job.manufacturerIds.includes(id) &&
                    job.status !== "completed" &&
                    !isRejectionFinal(job),
            );
            return hasJob ? "Flagged — already has a job" : null;
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
