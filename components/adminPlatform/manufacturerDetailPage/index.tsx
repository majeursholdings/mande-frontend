"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, Flag, Hourglass, MailQuestion, OctagonPause, ReceiptText, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrdinalDate, getRelativeTimeLabel } from "@/lib/date";
import { queryKeys } from "@/lib/queryKeys";
import { MandeApiError } from "@/lib/types/api";
import { manufacturerService } from "@/lib/services/manufacturerService";
import { registerManufacturers } from "@/constant/admin";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import ProfileCard from "@/components/manufacturerPlatform/profilePage/profileCard";
import ResponsiveTabs from "@/components/ui/responsiveTabs";
import ActiveJobsPanel from "@/components/manufacturerPlatform/jobsPage/activeJobsPanel";
import { SortByDropdown } from "@/components/manufacturerPlatform/jobsPage/sortByDropdown";
import TransactionsList, { sortTransactions } from "@/components/manufacturerPlatform/transactionsPage/transactionsList";
import {
    TRANSACTION_SORT_OPTIONS,
    getManufacturerJobs,
    toManufacturerProfile,
} from "@/constant/manufacturer";
import {
    getAccountHold,
    getManufacturerVerification,
    type AccountAppealRecord,
    type ManufacturerRecord,
} from "@/constant/platformRecords";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import { useAdminManufacturers } from "../dashboardLayout/adminManufacturersContext";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import { AttachmentList } from "../jobDetailPage/detailParts";
import EmptyState, { LoadError } from "../emptyState";
import {
    AppealDecisionDialog,
    ManufacturerActionDialog,
    isActionHidden,
    useManufacturerActions,
    type ManufacturerAction,
} from "../manufacturersPage/manufacturerActions";
import TransactionSummaryCards, { fromApiTransactionSummary } from "../transactionsPage/transactionSummaryCards";
import AccountHistory from "./accountHistory";
import ManufacturerInfo from "./manufacturerInfo";
import ManufacturerPlanCard, { ManufacturerPlanCardSkeleton } from "./manufacturerPlanCard";
import ManufacturerReports from "./manufacturerReports";
import { reportsService } from "@/lib/services/reportsService";
import type { ManufacturerTransaction } from "@/constant/manufacturer";
import { usePointsHistory } from "@/hooks/usePoints";
import PointsSummaryCard from "@/components/common/points/pointsSummaryCard";
import PointsHistoryList from "@/components/common/points/pointsHistoryList";
import PointsGuideModal from "@/components/common/points/pointsGuideModal";
import { getRankProgression } from "@/constant/points";

type DetailTab = "jobs" | "transactions" | "reports" | "points" | "info" | "history";

const DETAIL_TABS: { value: DetailTab; label: string }[] = [
    { value: "jobs", label: "Jobs" },
    { value: "transactions", label: "Transactions" },
    { value: "reports", label: "Reports" },
    { value: "points", label: "Points & Rank" },
    { value: "info", label: "More Info" },
    { value: "history", label: "Account history" },
];

/** A list of rows while it loads, e.g. the manufacturer's jobs. */
function RowsSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="flex flex-col gap-3" aria-busy="true">
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 rounded-xl border border-border bg-white p-4">
                    <Skeleton className="size-14 shrink-0 rounded-lg" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3.5 w-1/3" />
                    </div>
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            ))}
        </div>
    );
}

/**
 * The manufacturer's page while they load: the way back, the Actions button
 * and the tabs show straight away; their name, card, plan and the open tab
 * are skeletons.
 */
function ManufacturerDetailSkeleton() {
    return (
        <div className="flex flex-col gap-6" aria-busy="true">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <BackLink />
                    <h1 className="sr-only">Manufacturer</h1>
                    <Skeleton className="h-8 w-56" />
                </div>
                <button
                    type="button"
                    disabled
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium font-text text-mist-400"
                >
                    Actions
                    <ChevronDown className="size-4" />
                </button>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex flex-col gap-6 lg:w-65 lg:shrink-0">
                    <section className="flex flex-col gap-5 border-b border-border pb-6 lg:rounded-xl lg:border lg:bg-white lg:p-5">
                        <div className="flex flex-col items-center gap-3 lg:items-start">
                            <Skeleton className="size-22 rounded-full" />
                            <div className="flex flex-col items-center gap-2 lg:items-start">
                                <Skeleton className="h-6 w-36" />
                                <Skeleton className="h-3.5 w-24" />
                            </div>
                        </div>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5 lg:grid-cols-1">
                            {["Company", "Email", "Speciality", "Location"].map((label) => (
                                <li key={label} className="flex min-w-0 items-start gap-3">
                                    <Skeleton className="size-8 shrink-0 rounded-lg lg:size-10" />
                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                        <p className="text-xs font-text text-mist-500">{label}</p>
                                        <Skeleton className="h-4 w-28" />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <ManufacturerPlanCardSkeleton />
                </div>

                <div className="min-w-0 flex-1">
                    <ResponsiveTabs<DetailTab>
                        label="Manufacturer details"
                        defaultValue="jobs"
                        tabs={DETAIL_TABS.map((tab) => ({ ...tab, panel: <RowsSkeleton /> }))}
                    />
                </div>
            </div>
        </div>
    );
}

export default function AdminManufacturerDetailPage({ manufacturerId }: { manufacturerId: string }) {
    const router = useRouter();
    const { getManufacturer, isLoading: isContextLoading } = useAdminManufacturers();
    const { jobs: allJobs, isLoading: isJobsLoading, isError: isJobsError } = useAdminJobs();
    const { jobsUrl, manufacturersUrl, getManufacturerUrl } = useStaffPlatform();
    const [action, setAction] = useState<ManufacturerAction | null>(null);
    const [appealDecision, setAppealDecision] = useState<{
        appeal: AccountAppealRecord;
        decision: "approved" | "declined";
    } | null>(null);

    const { data: detailData, isLoading: isDetailLoading, error: detailError } = useQuery({
        queryKey: queryKeys.manufacturers.detail(manufacturerId),
        queryFn: () => manufacturerService.getStaffManufacturer(manufacturerId),
        staleTime: 10_000,
        retry: 1,
    });

    const contextManufacturer = getManufacturer(manufacturerId);
    const manufacturer = useMemo(() => {
        const raw = detailData?.manufacturer;
        if (raw) {
            const fromApi: Partial<ManufacturerRecord> & { id: string } = {
                id: raw.id,
                userId: raw.userId ?? null,
                companyName: raw.companyName,
                firstName: raw.firstName,
                lastName: raw.lastName,
                contactName: `${raw.firstName ?? ""} ${raw.lastName ?? ""}`.trim() || raw.companyName,
                email: raw.email ?? "",
                phone: raw.phone ?? "",
                dateOfBirth: raw.dateOfBirth,
                avatarUrl: raw.avatar?.url ?? null,
                joinedAt: raw.joinedAt,
                address: raw.address ?? { streetAddress: "", city: "", state: "", country: "NG" },
                specialities: raw.specialities ?? [],
                staffRange: raw.staffRange ?? "",
                productionLeadTime: raw.productionLeadTime ?? "",
                materialsInventory: raw.materialsInventory ?? "",
                accountStatus: raw.accountStatus ?? "active",
                ninCard: raw.kyc?.nin
                    ? {
                          imageUrl: raw.kyc.nin.image?.url ?? "",
                          status: raw.kyc.nin.status ?? "pending",
                          rejectionReason: raw.kyc.nin.rejectionReason ?? null,
                      }
                    : { imageUrl: "", status: "pending", rejectionReason: null },
                companyTaxNumber: raw.kyc?.companyTaxNumber?.value ?? "",
                companyTaxNumberVerification: {
                    status: raw.kyc?.companyTaxNumber?.status ?? "pending",
                    rejectionReason: raw.kyc?.companyTaxNumber?.rejectionReason ?? null,
                },
                businessLicenseNumber: raw.kyc?.businessLicenseNumber?.value ?? "",
                businessLicenseNumberVerification: {
                    status: raw.kyc?.businessLicenseNumber?.status ?? "pending",
                    rejectionReason: raw.kyc?.businessLicenseNumber?.rejectionReason ?? null,
                },
                statusHistory: (raw.statusHistory ?? []).map((s: { status: "active" | "flagged" | "suspended"; reason?: string | null; by?: string; byName?: string; at?: string }) => ({
                    status: s.status,
                    reason: s.reason ?? null,
                    by: s.by || s.byName || "Admin",
                    at: s.at ? new Date(s.at).toISOString() : new Date().toISOString(),
                })),
                appeals: (raw.appeals ?? []).map((a: { id: string; message: string; attachments?: unknown[]; sentAt?: string; status: "pending" | "approved" | "declined"; response?: string | null; decidedBy?: string; decidedByName?: string; decidedAt?: string | null }) => ({
                    id: a.id,
                    message: a.message,
                    attachments: a.attachments ?? [],
                    sentAt: a.sentAt ? new Date(a.sentAt).toISOString() : new Date().toISOString(),
                    status: a.status,
                    response: a.response ?? null,
                    decidedBy: a.decidedByName || a.decidedBy || null,
                    decidedAt: a.decidedAt ? new Date(a.decidedAt).toISOString() : null,
                })),
                deletionRequest: raw.deletionRequest
                    ? {
                          reason: raw.deletionRequest.reason,
                          attachments: raw.deletionRequest.attachments ?? [],
                          requestedBy: raw.deletionRequest.requestedBy || raw.deletionRequest.requestedByName || "Admin",
                          requestedAt: String(raw.deletionRequest.requestedAt),
                      }
                    : null,
                subscription: raw.plan
                    ? {
                          planId: raw.plan.planId,
                          billingCycle: raw.plan.billingCycle === "yearly" ? "annual" : "monthly",
                          renewsAt: raw.plan.renewsAt ?? new Date().toISOString(),
                          renewalsPaidFrom: raw.plan.renewalsPaidFrom ?? "wallet",
                      }
                    : undefined,
            };
            registerManufacturers([fromApi]);
            return getManufacturer(manufacturerId) || (fromApi as unknown as ManufacturerRecord);
        }
        return contextManufacturer;
    }, [detailData, contextManufacturer, manufacturerId, getManufacturer]);

    // Profile URLs use the readable userId: a link by database id lands on it
    const canonicalId = manufacturer?.userId;
    useEffect(() => {
        if (canonicalId && canonicalId !== manufacturerId) router.replace(getManufacturerUrl(canonicalId));
    }, [canonicalId, manufacturerId, router, getManufacturerUrl]);

    const isInitialLoading = (isContextLoading || isDetailLoading) && !manufacturer;

    if (isInitialLoading) {
        return <ManufacturerDetailSkeleton />;
    }

    // Not there (a 404) reads as not found below; anything else is a failed load
    const isNotFound = detailError instanceof MandeApiError && detailError.status === 404;
    if (!manufacturer && detailError && !isNotFound) {
        return (
            <div className="flex flex-col gap-6">
                <BackLink />
                <LoadError message="We couldn't load this manufacturer. Please refresh the page." />
            </div>
        );
    }

    if (!manufacturer) {
        return (
            <EmptyState
                icon={Wrench}
                title="Manufacturer not found"
                description="They may have been deleted, or the link is wrong"
                action={<BackLink />}
            />
        );
    }

    const jobs = getManufacturerJobs(manufacturer.id, allJobs);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <BackLink />
                    <h1 className="text-2xl font-semibold font-text text-mist-950">{manufacturer.contactName}</h1>
                </div>
                <ActionsMenu manufacturer={manufacturer} onSelect={setAction} />
            </div>

            <AccountNotices
                manufacturer={manufacturer}
                onAction={setAction}
                onDecideAppeal={(appeal, decision) => setAppealDecision({ appeal, decision })}
            />

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex flex-col gap-6 lg:w-65 lg:shrink-0">
                    <ProfileCard
                        profile={toManufacturerProfile(manufacturer)}
                        editHref={null}
                        verificationStatus={getManufacturerVerification(manufacturer)}
                    />
                    <ManufacturerPlanCard subscription={manufacturer.subscription} />
                </div>

                <div className="min-w-0 flex-1">
                    <ResponsiveTabs<DetailTab>
                        label={`${manufacturer.contactName}'s details`}
                        defaultValue="jobs"
                        tabs={[
                            {
                                value: "jobs",
                                label: "Jobs",
                                panel: isJobsLoading ? (
                                    <RowsSkeleton />
                                ) : isJobsError && allJobs.length === 0 ? (
                                    <LoadError message="We couldn't load their jobs. Please refresh the page." />
                                ) : (
                                    <ActiveJobsPanel
                                        jobs={jobs}
                                        getJobHref={(job) => `${jobsUrl}?job=${encodeURIComponent(job.code ? job.code.toLowerCase() : job.id)}`}
                                        emptyDescription="Jobs offered to this manufacturer will show up here."
                                    />
                                ),
                            },
                            {
                                value: "transactions",
                                label: "Transactions",
                                panel: <Transactions manufacturerId={manufacturer.id} />,
                            },
                            {
                                value: "reports",
                                label: "Reports",
                                panel: isJobsLoading ? (
                                    <RowsSkeleton />
                                ) : (
                                    <ManufacturerReports
                                        jobs={jobs}
                                        // The API has no staff view of a manufacturer's feedback yet
                                        feedback={[]}
                                    />
                                ),
                            },
                            {
                                value: "points",
                                label: "Points & Rank",
                                panel: <ManufacturerPointsTab manufacturerId={manufacturer.id} points={manufacturer.points ?? 0} rank={manufacturer.rank ?? "rising-maker"} />,
                            },
                            { value: "info", label: "More Info", panel: <ManufacturerInfo manufacturer={manufacturer} /> },
                            {
                                value: "history",
                                label: "Account history",
                                panel: <AccountHistory manufacturer={manufacturer} />,
                            },
                        ]}
                    />
                </div>
            </div>

            <ManufacturerActionDialog
                manufacturer={manufacturer}
                action={action}
                onClose={() => setAction(null)}
                onDeleted={() => router.push(manufacturersUrl)}
            />
            <AppealDecisionDialog
                manufacturer={manufacturer}
                appeal={appealDecision?.appeal}
                decision={appealDecision?.decision ?? null}
                onClose={() => setAppealDecision(null)}
            />
        </div>
    );
}

function BackLink() {
    const { manufacturersUrl } = useStaffPlatform();

    return (
        <Link
            href={manufacturersUrl}
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium font-text text-secondary-700 hover:underline"
        >
            <ArrowLeft className="size-4" />
            Back to Manufacturers
        </Link>
    );
}

/**
 * Their totals (earned, withdrawn, spent on plans, their balance) and every
 * transaction, from the API's ledger: job payments, withdrawals, plans paid
 * by card or from the wallet, charges and reversals.
 */
function Transactions({ manufacturerId }: { manufacturerId: string }) {
    const [sortBy, setSortBy] = useState("");
    const summaryQuery = useQuery({
        queryKey: queryKeys.reports.transactionsSummary(manufacturerId),
        queryFn: () => reportsService.getTransactionsSummary(manufacturerId),
    });
    const transactionsQuery = useQuery({
        queryKey: queryKeys.reports.transactions({ manufacturerId, all: true }),
        queryFn: () => reportsService.getAllTransactions({ manufacturerId }),
    });
    const transactions: ManufacturerTransaction[] = (transactionsQuery.data ?? []).map((transaction) => ({
        id: transaction.id,
        // A reversal puts a failed withdrawal back: money in, like a payment
        type: transaction.type === "reversal" ? "payment" : transaction.type,
        label: transaction.label,
        projectName: transaction.jobTitle,
        date: transaction.date,
        amount: transaction.amountKobo / 100,
        ...(transaction.paidByCard && { paidByCard: true }),
    }));
    const isEmpty = transactionsQuery.isSuccess && transactions.length === 0;

    return (
        <div className="flex flex-col gap-6">
            {summaryQuery.isError ? (
                <LoadError message="We couldn't load their totals. Please refresh the page." />
            ) : (
                <TransactionSummaryCards
                    summary={summaryQuery.data ? fromApiTransactionSummary(summaryQuery.data.summary) : undefined}
                    scope="manufacturer"
                />
            )}
            {isEmpty ? (
                <EmptyState icon={ReceiptText} title="No Transactions" description="There are no transactions to display" />
            ) : (
                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-base font-semibold font-text text-mist-950">Transaction history</h2>
                        <SortByDropdown items={TRANSACTION_SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
                    </div>
                    <TransactionsList
                        tableId="manufacturer-transactions"
                        transactions={sortTransactions(transactions, sortBy)}
                        loading={transactionsQuery.isPending}
                        error={transactionsQuery.isError ? "We couldn't load their transactions. Please refresh the page." : undefined}
                    />
                </section>
            )}
        </div>
    );
}

/** Flag, Suspend and Ask to close account (Close account, for a super admin), each off, with why, when it can't be taken. */
function ActionsMenu({
    manufacturer,
    onSelect,
}: {
    manufacturer: ManufacturerRecord;
    onSelect: (action: ManufacturerAction) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const { actions, getBlocker } = useManufacturerActions();

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium font-text text-mist-900 transition-colors hover:bg-mist-50 cursor-pointer">
                Actions
                <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={6} className="w-56 gap-0.5 p-1.5">
                {actions.filter(({ value }) => !isActionHidden(manufacturer, value)).map(({ value, label, icon: Icon, tone }) => {
                    const blocker = getBlocker(manufacturer, value);
                    return (
                        <button
                            key={value}
                            type="button"
                            disabled={!!blocker}
                            onClick={() => {
                                setIsOpen(false);
                                onSelect(value);
                            }}
                            className={cn(
                                "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium font-text transition-colors",
                                blocker
                                    ? "cursor-not-allowed text-mist-300"
                                    : tone === "danger"
                                      ? "text-error-600 hover:bg-error-50 cursor-pointer"
                                      : "text-mist-700 hover:bg-mist-50 hover:text-mist-950 cursor-pointer",
                            )}
                        >
                            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                            <span className="flex flex-col">
                                {label}
                                {blocker && <span className="text-xs font-normal text-mist-400">{blocker}</span>}
                            </span>
                        </button>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
}

const NOTICE_BUTTON_CLASS =
    "rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium font-text text-mist-900 transition-colors hover:bg-mist-50 cursor-pointer";

/**
 * What's going on with the account now — a flag or suspension (with a way
 * to lift it), an appeal waiting for an answer, a deletion waiting for a
 * super admin (who deletes the account or turns the request down here).
 * What happened before is under Account history › Issue history.
 */
function AccountNotices({
    manufacturer,
    onAction,
    onDecideAppeal,
}: {
    manufacturer: ManufacturerRecord;
    onAction: (action: ManufacturerAction) => void;
    onDecideAppeal: (appeal: AccountAppealRecord, decision: "approved" | "declined") => void;
}) {
    const { accountStatus, deletionRequest } = manufacturer;
    const { permissions } = useStaffPlatform();
    const { declineDeletionRequest } = useAdminManufacturers();

    const turnDownDeletion = () => {
        try {
            declineDeletionRequest(manufacturer.id);
            toast.success("Request to close the account turned down. The account stays open");
        } catch {
            toast.error("Couldn't turn the request down. Please try again.");
        }
    };
    const hold = getAccountHold(manufacturer);
    const pendingAppeal = manufacturer.appeals.find((appeal) => appeal.status === "pending");
    if (!hold && !pendingAppeal && !deletionRequest) return null;

    return (
        <div className="flex flex-col gap-3">
            {hold && (
                <Notice
                    tone={accountStatus === "suspended" ? "danger" : "warning"}
                    icon={accountStatus === "suspended" ? OctagonPause : Flag}
                    title={`${accountStatus === "suspended" ? "Suspended" : "Flagged"} by ${hold.by} · ${getRelativeTimeLabel(new Date(hold.at))}`}
                    action={
                        <button
                            type="button"
                            onClick={() => onAction(accountStatus === "suspended" ? "lift-suspension" : "lift-flag")}
                            className={NOTICE_BUTTON_CLASS}
                        >
                            {accountStatus === "suspended" ? "Lift suspension" : "Lift flag"}
                        </button>
                    }
                >
                    {hold.reason && <p className="text-mist-800">{hold.reason}</p>}
                    <p>
                        {accountStatus === "suspended"
                            ? "Everything on their account is paused. All they can do is send an appeal."
                            : "They can hold one job at a time."}
                    </p>
                </Notice>
            )}
            {pendingAppeal && (
                <Notice
                    tone="neutral"
                    icon={MailQuestion}
                    title={`Appeal waiting · sent ${getRelativeTimeLabel(new Date(pendingAppeal.sentAt))}`}
                    action={
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => onDecideAppeal(pendingAppeal, "declined")}
                                className={NOTICE_BUTTON_CLASS}
                            >
                                Turn down
                            </button>
                            <button
                                type="button"
                                onClick={() => onDecideAppeal(pendingAppeal, "approved")}
                                className="rounded-md bg-secondary-700 px-3 py-1.5 text-xs font-medium font-text text-white transition-colors hover:bg-secondary-900 cursor-pointer"
                            >
                                Approve
                            </button>
                        </div>
                    }
                >
                    <p className="whitespace-pre-line text-mist-800">{pendingAppeal.message}</p>
                    {pendingAppeal.attachments.length > 0 && <AttachmentList attachments={pendingAppeal.attachments} />}
                </Notice>
            )}
            {deletionRequest && (
                <Notice
                    tone="neutral"
                    icon={Hourglass}
                    title={`Closing asked for by ${deletionRequest.requestedBy} on ${formatOrdinalDate(new Date(deletionRequest.requestedAt))}${permissions.deletes ? "" : ", waiting for a super admin"}`}
                    action={
                        permissions.deletes && (
                            <div className="flex gap-2">
                                <button type="button" onClick={turnDownDeletion} className={NOTICE_BUTTON_CLASS}>
                                    Turn down
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onAction("delete")}
                                    className="rounded-md bg-error-600 px-3 py-1.5 text-xs font-medium font-text text-white transition-colors hover:bg-error-700 cursor-pointer"
                                >
                                    Close account
                                </button>
                            </div>
                        )
                    }
                >
                    <p className="whitespace-pre-line text-mist-800">{deletionRequest.reason}</p>
                    {deletionRequest.attachments.length > 0 && <AttachmentList attachments={deletionRequest.attachments} />}
                </Notice>
            )}
        </div>
    );
}

function Notice({
    tone,
    icon: Icon,
    title,
    action,
    children,
}: {
    tone: "danger" | "warning" | "neutral";
    icon: typeof Flag;
    title: string;
    /** What can be done about it — shown beside it from sm up, under it on phones. */
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section
            className={cn(
                "flex gap-3 rounded-xl border p-4",
                tone === "danger" && "border-error-200 bg-error-50/60",
                tone === "warning" && "border-warning-200 bg-warning-50/60",
                tone === "neutral" && "border-border bg-white",
            )}
        >
            <Icon
                className={cn(
                    "mt-0.5 size-5 shrink-0",
                    tone === "danger" && "text-error-600",
                    tone === "warning" && "text-warning-600",
                    tone === "neutral" && "text-mist-500",
                )}
                aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1.5 text-sm font-text text-mist-600">
                    <h2 className="font-medium text-mist-950">{title}</h2>
                    {children}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        </section>
    );
}

function ManufacturerPointsTab({
    manufacturerId,
    points,
    rank,
}: {
    manufacturerId: string;
    points: number;
    rank: string;
}) {
    const { entries, isLoading } = usePointsHistory(manufacturerId);
    const [guideOpen, setGuideOpen] = useState(false);
    void rank;
    const progression = getRankProgression("manufacturer", points);

    return (
        <div className="flex flex-col gap-6">
            <PointsSummaryCard
                points={points}
                progression={progression}
                role="manufacturer"
                onOpenGuide={() => setGuideOpen(true)}
            />

            <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold font-text text-mist-950">Point history</h2>
                    <span className="text-xs text-mist-500 font-text">{entries.length} recorded events</span>
                </div>
                <PointsHistoryList entries={entries} loading={isLoading} />
            </section>

            <PointsGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} role="manufacturer" />
        </div>
    );
}
