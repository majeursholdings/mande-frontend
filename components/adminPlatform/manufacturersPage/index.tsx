"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    DataTable,
    TableToolbar,
    useTableRows,
    type ColumnDef,
    type RowAction,
    type SelectFilterItem,
    type SortOptionDef,
} from "@/components/customTable";
import UserAvatar from "@/components/ui/userAvatar";
import VerificationBadge from "@/components/manufacturerPlatform/verificationBadge";
import { COMPANY_SPECIALITY_OPTIONS, getOptionLabel } from "@/constant/manufacturer";
import { PRICING_PLANS, getPricingPlan } from "@/constant/sampleData";
import {
    getManufacturerVerification,
    type ManufacturerRecord,
    type VerificationStatus,
} from "@/constant/sampleDb";
import { useAdminManufacturers } from "../dashboardLayout/adminManufacturersContext";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import {
    AccountStatusTag,
    DeletionRequestedTag,
    ManufacturerActionDialog,
    isActionHidden,
    useManufacturerActions,
    type ManufacturerAction,
} from "./manufacturerActions";

const TABLE_ID = "manufacturers";

type ManufacturerRow = Pick<
    ManufacturerRecord,
    "id" | "email" | "avatarUrl" | "companyName" | "specialities" | "accountStatus" | "deletionRequest"
> & {
    hasPendingAppeal: boolean;
    fullName: string;
    city: string;
    state: string;
    /** A PRICING_PLANS id, for the filter. */
    planId: string;
    planName: string;
    billingCycle: ManufacturerRecord["subscription"]["billingCycle"];
    verification: VerificationStatus;
    /** For sorting — the ones that need an admin first. */
    verificationRank: number;
};

const VERIFICATION_RANK: Record<VerificationStatus, number> = {
    manual_review: 0,
    pending: 1,
    processing: 2,
    rejected: 3,
    verified: 4,
};

const PLAN_ITEMS: SelectFilterItem[] = PRICING_PLANS.map((plan) => ({ label: plan.name, value: plan.id }));

const SORT_ITEMS: SelectFilterItem[] = [
    { label: "Name", value: "name" },
    { label: "Verification", value: "verification" },
];

const SORT_OPTIONS: SortOptionDef<ManufacturerRow>[] = [
    { value: "name", field: "fullName" },
    { value: "verification", field: "verificationRank", type: "number" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Admin Manufacturers — every manufacturer on the platform: search them,
// filter by speciality or plan, sort by their name or how far along their
// verification is. Each row opens the manufacturer; its menu
// flags or suspends them (or lifts either), and asks a super admin to delete
// the account (or, for a super admin, deletes it).
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminManufacturersPage() {
    const router = useRouter();
    const { manufacturers, getManufacturer } = useAdminManufacturers();
    const { getManufacturerUrl } = useStaffPlatform();
    const { actions, getBlocker } = useManufacturerActions();
    const [target, setTarget] = useState<{ id: string; action: ManufacturerAction } | null>(null);

    const allRows: ManufacturerRow[] = manufacturers.map((manufacturer) => {
        const verification = getManufacturerVerification(manufacturer);
        return {
            id: manufacturer.id,
            fullName: manufacturer.contactName,
            email: manufacturer.email,
            avatarUrl: manufacturer.avatarUrl,
            companyName: manufacturer.companyName,
            city: manufacturer.address.city,
            state: manufacturer.address.state,
            specialities: manufacturer.specialities,
            planId: manufacturer.subscription.planId,
            planName: getPricingPlan(manufacturer.subscription.planId)?.name ?? "No plan",
            billingCycle: manufacturer.subscription.billingCycle,
            verification,
            verificationRank: VERIFICATION_RANK[verification],
            accountStatus: manufacturer.accountStatus,
            deletionRequest: manufacturer.deletionRequest,
            hasPendingAppeal: manufacturer.appeals.some((appeal) => appeal.status === "pending"),
        };
    });

    const { rows, pagination } = useTableRows({
        tableId: TABLE_ID,
        data: allRows,
        searchFields: ["fullName", "companyName", "email", "city"],
        filters: [
            { paramKey: "speciality", field: "specialities", matchMode: "includes" },
            { paramKey: "plan", field: "planId" },
        ],
        sortOptions: SORT_OPTIONS,
        rowsPerPage: 10,
    });

    const columns: ColumnDef<ManufacturerRow>[] = [
        {
            key: "fullName",
            header: "Full name",
            cell: (row) => (
                <span className="flex items-center gap-3">
                    <UserAvatar name={row.fullName} src={row.avatarUrl} className="size-8 text-xs" />
                    <span className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-2">
                            <Link
                                href={getManufacturerUrl(row.id)}
                                // The row opens it too; this is for keyboards
                                onClick={(event) => event.stopPropagation()}
                                className="font-medium text-mist-950 outline-none hover:underline focus-visible:underline"
                            >
                                {row.fullName}
                            </Link>
                            <AccountStatusTag status={row.accountStatus} hasPendingAppeal={row.hasPendingAppeal} />
                            {row.deletionRequest && <DeletionRequestedTag />}
                        </span>
                        <span className="text-xs text-gray-500">{row.email}</span>
                    </span>
                </span>
            ),
        },
        {
            key: "companyName",
            header: "Company",
            cell: (row) => (
                <span className="flex flex-col">
                    <span className="text-mist-950">{row.companyName}</span>
                    <span className="text-xs text-gray-500">
                        {row.city}, {row.state}
                    </span>
                </span>
            ),
        },
        {
            key: "specialities",
            header: "Speciality",
            className: "min-w-40 whitespace-normal",
            cell: (row) => row.specialities.map((value) => getOptionLabel(COMPANY_SPECIALITY_OPTIONS, value)).join(", "),
        },
        {
            key: "plan",
            header: "Plan",
            cell: (row) => (
                <span className="flex flex-col">
                    <span className="text-mist-950">{row.planName}</span>
                    <span className="text-xs text-gray-500">{row.billingCycle === "annual" ? "Yearly" : "Monthly"}</span>
                </span>
            ),
        },
        {
            key: "verification",
            header: "Verification",
            cell: (row) => <VerificationBadge status={row.verification} />,
        },
    ];

    return (
        <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Manufacturers</h1>

            <DataTable
                tableId={TABLE_ID}
                columns={columns}
                rows={rows}
                pagination={pagination}
                emptyMessage="No manufacturers match your search."
                onRowClick={(row) => router.push(getManufacturerUrl(row.id))}
                rowActions={actions.map((action): RowAction<ManufacturerRow> => ({
                    label: action.label,
                    icon: <action.icon className="size-3.5" aria-hidden />,
                    tone: action.tone,
                    onSelect: (row) => setTarget({ id: row.id, action: action.value }),
                    hidden: (row) => isActionHidden(row, action.value),
                    disabledReason: (row) => getBlocker(row, action.value),
                }))}
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search by name, company, email or city" }}
                        filters={[
                            { title: "Speciality", paramKey: "speciality", items: COMPANY_SPECIALITY_OPTIONS },
                            { title: "Plan", paramKey: "plan", items: PLAN_ITEMS },
                        ]}
                        sortBy={{ title: "Sort by", items: SORT_ITEMS }}
                    />
                }
            />

            <ManufacturerActionDialog
                manufacturer={target ? getManufacturer(target.id) : undefined}
                action={target?.action ?? null}
                onClose={() => setTarget(null)}
            />
        </div>
    );
}
