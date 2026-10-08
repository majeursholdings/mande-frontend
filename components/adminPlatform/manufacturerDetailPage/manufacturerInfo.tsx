"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import ResponsiveTabs from "@/components/ui/responsiveTabs";
import { Skeleton } from "@/components/ui/skeleton";
import ReasonForm from "@/components/adminPlatform/form/reasonForm";
import VerificationBadge from "@/components/manufacturerPlatform/verificationBadge";
import { getCountryName } from "@/constant/africanCountries";
import {
    COMPANY_SPECIALITY_OPTIONS,
    MATERIALS_INVENTORY_OPTIONS,
    PRODUCTION_LEAD_TIME_OPTIONS,
    STAFF_RANGE_OPTIONS,
    getOptionLabel,
} from "@/constant/manufacturer";
import { getPlanPrice, requiresBusinessDocuments } from "@/constant/plans";
import type { DocumentVerification, ManufacturerRecord } from "@/constant/platformRecords";
import {
    useAdminManufacturers,
    type ManufacturerDocument,
} from "../dashboardLayout/adminManufacturersContext";
import { usePlans } from "@/hooks/usePlans";
import { getErrorMessage } from "@/lib/api";

type InfoTab = "basic" | "verification" | "address" | "plan";

const DOCUMENT_LABELS: Record<ManufacturerDocument, string> = {
    "nin-card": "NIN card",
    "tax-number": "Company tax number",
    "business-license": "Business license number",
};

// ─────────────────────────────────────────────────────────────────────────────
// ManufacturerInfo — everything a manufacturer told Mande about themselves,
// in the sections of their own settings page. Admins can't change any of
// it; they can only verify, or reject with a reason, the documents waiting
// to be checked.
// ─────────────────────────────────────────────────────────────────────────────

export default function ManufacturerInfo({ manufacturer }: { manufacturer: ManufacturerRecord }) {
    const { decideVerification } = useAdminManufacturers();
    const [rejecting, setRejecting] = useState<ManufacturerDocument | null>(null);
    const { getPlan, discountPercent, isLoading: isPlansLoading } = usePlans();
    const plan = getPlan(manufacturer.subscription?.planId);
    const needsBusinessDocuments = requiresBusinessDocuments(manufacturer.subscription?.planId ?? "");
    const specialities = manufacturer.specialities
        .map((value) => getOptionLabel(COMPANY_SPECIALITY_OPTIONS, value))
        .join(", ");

    const verify = async (document: ManufacturerDocument) => {
        try {
            await decideVerification(manufacturer.id, document, "verified");
            toast.success(`${DOCUMENT_LABELS[document]} verified`);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't save your decision. Please try again."));
        }
    };

    const documents: { document: ManufacturerDocument; value: ReactNode; verification: DocumentVerification | null }[] = [
        {
            document: "nin-card",
            value: manufacturer.ninCard?.imageUrl ? (
                <Link
                    href={manufacturer.ninCard.imageUrl}
                    target="_blank"
                    title="NIN card: open full size"
                    className="relative block aspect-16/10 w-full max-w-72 overflow-hidden rounded-lg border border-border bg-mist-50"
                >
                    <Image src={manufacturer.ninCard.imageUrl} alt="NIN card" fill unoptimized className="object-cover" />
                </Link>
            ) : null,
            verification: manufacturer.ninCard?.imageUrl ? manufacturer.ninCard : null,
        },
        {
            document: "tax-number",
            value: manufacturer.companyTaxNumber || null,
            verification: manufacturer.companyTaxNumber ? (manufacturer.companyTaxNumberVerification ?? null) : null,
        },
        {
            document: "business-license",
            value: manufacturer.businessLicenseNumber || null,
            verification: manufacturer.businessLicenseNumber ? (manufacturer.businessLicenseNumberVerification ?? null) : null,
        },
    ];

    return (
        <>
            <ResponsiveTabs<InfoTab>
                label="Manufacturer details"
                defaultValue="basic"
                variant="segmented"
                tabs={[
                    {
                        value: "basic",
                        label: "Basic",
                        panel: (
                            <Panel>
                                <FieldGrid>
                                    <Field label="Full name">{manufacturer.contactName}</Field>
                                    <Field label="Email">{manufacturer.email}</Field>
                                    <Field label="Phone number">{manufacturer.phone}</Field>
                                    <Field label="Date of birth">
                                        {manufacturer.dateOfBirth ? formatOrdinalDate(new Date(manufacturer.dateOfBirth)) : null}
                                    </Field>
                                    <Field label="Company name">{manufacturer.companyName}</Field>
                                    <Field label="Speciality">{specialities}</Field>
                                    <Field label="Staff strength">{getOptionLabel(STAFF_RANGE_OPTIONS, manufacturer.staffRange)}</Field>
                                    <Field label="Average production lead time">
                                        {getOptionLabel(PRODUCTION_LEAD_TIME_OPTIONS, manufacturer.productionLeadTime)}
                                    </Field>
                                    <Field label="Keeps their own materials">
                                        {getOptionLabel(MATERIALS_INVENTORY_OPTIONS, manufacturer.materialsInventory)}
                                    </Field>
                                </FieldGrid>

                                <h3 className="text-base font-semibold font-text text-mist-950">Bank details</h3>
                                {manufacturer.bankAccount ? (
                                    <FieldGrid>
                                        <Field label="Bank">{manufacturer.bankAccount.bankName}</Field>
                                        <Field label="Account number">{manufacturer.bankAccount.accountNumber}</Field>
                                        <Field label="Account name">{manufacturer.bankAccount.accountName}</Field>
                                    </FieldGrid>
                                ) : (
                                    <p className="text-sm font-text text-mist-500">No bank account added yet.</p>
                                )}
                            </Panel>
                        ),
                    },
                    {
                        value: "verification",
                        label: "Verification",
                        panel: (
                            <Panel>
                                {!needsBusinessDocuments && (
                                    <p className="rounded-lg bg-mist-100 px-4 py-3 text-sm font-text text-mist-600">
                                        On the {plan?.name ?? "Solo"} plan only the NIN card is needed. The tax and business license
                                        numbers are optional.
                                    </p>
                                )}
                                <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-white">
                                    {documents.map(({ document, value, verification }) => {
                                        // Rejected ones wait for the manufacturer to send it again
                                        const canDecide =
                                            verification !== null &&
                                            verification.status !== "verified" &&
                                            verification.status !== "rejected";
                                        return (
                                            <li key={document} className="flex flex-col gap-3 p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <span className="text-sm font-medium font-text text-mist-950">
                                                        {DOCUMENT_LABELS[document]}
                                                    </span>
                                                    {verification ? (
                                                        <VerificationBadge status={verification.status} />
                                                    ) : (
                                                        <span className="text-xs font-text text-mist-400">Not submitted</span>
                                                    )}
                                                </div>
                                                {value && <div className="text-sm font-text text-mist-900">{value}</div>}
                                                {verification?.status === "rejected" && verification.rejectionReason && (
                                                    <p className="rounded-lg bg-error-50 px-3 py-2 text-xs font-text text-error-700">
                                                        {verification.rejectionReason}
                                                    </p>
                                                )}
                                                {canDecide && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => verify(document)}
                                                            className="flex items-center gap-1.5 rounded-md bg-secondary-700 px-3 py-1.5 text-xs font-medium font-text text-white transition-colors hover:bg-secondary-900 cursor-pointer"
                                                        >
                                                            <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                                                            Verify
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRejecting(document)}
                                                            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium font-text text-mist-700 transition-colors hover:bg-mist-50 cursor-pointer"
                                                        >
                                                            <X className="size-3.5" strokeWidth={2.5} aria-hidden />
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </Panel>
                        ),
                    },
                    {
                        value: "address",
                        label: "Address",
                        panel: (
                            <Panel>
                                <FieldGrid>
                                    <Field label="Street address">{manufacturer.address?.streetAddress || ""}</Field>
                                    <Field label="City">{manufacturer.address?.city || ""}</Field>
                                    <Field label="State">{manufacturer.address?.state || ""}</Field>
                                    <Field label="Country">{manufacturer.address?.country ? getCountryName(manufacturer.address.country) : "Nigeria"}</Field>
                                </FieldGrid>
                            </Panel>
                        ),
                    },
                    {
                        value: "plan",
                        label: "Plan",
                        panel: (
                            <Panel>
                                <FieldGrid>
                                    <Field label="Plan">
                                        {isPlansLoading ? <Skeleton className="h-5 w-24" /> : plan?.name}
                                    </Field>
                                    <Field label="Billing">
                                        {isPlansLoading && manufacturer.subscription ? (
                                            <Skeleton className="h-5 w-32" />
                                        ) : (
                                            plan &&
                                            manufacturer.subscription &&
                                            `${formatPrice(getPlanPrice(plan, manufacturer.subscription.billingCycle, discountPercent))} a ${
                                                manufacturer.subscription.billingCycle === "annual" ? "year" : "month"
                                            }`
                                        )}
                                    </Field>
                                    <Field label="Renews on">
                                        {manufacturer.subscription?.renewsAt
                                            ? formatOrdinalDate(new Date(manufacturer.subscription.renewsAt))
                                            : ""}
                                    </Field>
                                    <Field label="Jobs at once">
                                        {isPlansLoading ? (
                                            <Skeleton className="h-5 w-16" />
                                        ) : plan ? (
                                            plan.maxConcurrentJobs === null ? "Unlimited" : String(plan.maxConcurrentJobs)
                                        ) : null}
                                    </Field>
                                    <Field label="Business documents">{needsBusinessDocuments ? "Required" : "Optional"}</Field>
                                </FieldGrid>
                            </Panel>
                        ),
                    },
                ]}
            />

            <Dialog open={rejecting !== null} onOpenChange={(open) => !open && setRejecting(null)}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Reject the {rejecting ? DOCUMENT_LABELS[rejecting].toLowerCase() : ""}?</DialogTitle>
                        <DialogDescription>
                            {manufacturer.contactName} will see why and can send it again.
                        </DialogDescription>
                    </div>
                    <ReasonForm
                        label="Why it was rejected"
                        placeholder="What's wrong with it, and what should they send instead?"
                        submitLabel="Reject"
                        loadingLabel="Rejecting..."
                        errorMessage="Couldn't save your decision. Please try again."
                        onCancel={() => setRejecting(null)}
                        maxLength={300}
                        onSubmit={async (reason) => {
                            if (!rejecting) return;
                            // A failure throws: the form shows it and stays open
                            await decideVerification(manufacturer.id, rejecting, "rejected", reason);
                            toast.success(`${DOCUMENT_LABELS[rejecting]} rejected`);
                            setRejecting(null);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

function Panel({ children }: { children: ReactNode }) {
    return <div className="flex flex-col gap-6">{children}</div>;
}

function FieldGrid({ children }: { children: ReactNode }) {
    return <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</dl>;
}

/** A read-only value, boxed like a form field — "Not provided" when empty. */
function Field({ label, children }: { label: string; children: ReactNode }) {
    const isEmpty = children === null || children === undefined || children === "";
    return (
        <div className="flex flex-col gap-2">
            <dt className="text-sm font-text text-mist-700">{label}</dt>
            <dd
                className={cn(
                    "rounded-lg border border-border bg-white px-4 py-3 text-sm font-text",
                    isEmpty ? "text-mist-400" : "text-mist-950",
                )}
            >
                {isEmpty ? "Not provided" : children}
            </dd>
        </div>
    );
}
