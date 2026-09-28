"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, Flag, Hourglass, MailQuestion, OctagonPause, ReceiptText, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrdinalDate, getRelativeTimeLabel } from "@/lib/date";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ProfileCard from "@/components/manufacturerPlatform/profilePage/profileCard";
import ResponsiveTabs from "@/components/ui/responsiveTabs";
import ActiveJobsPanel from "@/components/manufacturerPlatform/jobsPage/activeJobsPanel";
import { SortByDropdown } from "@/components/manufacturerPlatform/jobsPage/sortByDropdown";
import TransactionsList, { sortTransactions } from "@/components/manufacturerPlatform/transactionsPage/transactionsList";
import {
    TRANSACTION_SORT_OPTIONS,
    getManufacturerJobs,
    getManufacturerTransactions,
    getTransactionSummary,
    toManufacturerProfile,
} from "@/constant/manufacturer";
import {
    SAMPLE_SUPPORT_FEEDBACK,
    getAccountHold,
    getManufacturerVerification,
    type AccountAppealRecord,
    type ManufacturerRecord,
} from "@/constant/sampleDb";
import { useAdminJobs } from "../dashboardLayout/adminJobsContext";
import { useAdminManufacturers } from "../dashboardLayout/adminManufacturersContext";
import { useStaffPlatform } from "../dashboardLayout/staffPlatformContext";
import { AttachmentList } from "../jobDetailPage/detailParts";
import EmptyState from "../emptyState";
import {
    AppealDecisionDialog,
    ManufacturerActionDialog,
    isActionHidden,
    useManufacturerActions,
    type ManufacturerAction,
} from "../manufacturersPage/manufacturerActions";
import TransactionSummaryCards from "../transactionsPage/transactionSummaryCards";
import AccountHistory from "./accountHistory";
import ManufacturerInfo from "./manufacturerInfo";
import ManufacturerPlanCard from "./manufacturerPlanCard";
import ManufacturerReports from "./manufacturerReports";

type DetailTab = "jobs" | "transactions" | "reports" | "info" | "history";

// ─────────────────────────────────────────────────────────────────────────────
// AdminManufacturerDetailPage — one manufacturer, as their own profile page
// lays it out: their card and the plan they're on, beside their jobs,
// transactions, job reports and support feedback, everything they told
// Mande, and the account's history —
// what they changed on it, and its flags and suspensions. From here an
// admin flags or suspends them, lifts a flag or suspension, answers their
// appeal, or asks a super admin to delete the account — but doesn't hand out
// jobs. A super admin deletes the account, or turns an admin's request down.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminManufacturerDetailPage({ manufacturerId }: { manufacturerId: string }) {
    const router = useRouter();
    const { getManufacturer } = useAdminManufacturers();
    const { jobs: allJobs } = useAdminJobs();
    const { jobsUrl, manufacturersUrl } = useStaffPlatform();
    const [action, setAction] = useState<ManufacturerAction | null>(null);
    const [appealDecision, setAppealDecision] = useState<{
        appeal: AccountAppealRecord;
        decision: "approved" | "declined";
    } | null>(null);
    const manufacturer = getManufacturer(manufacturerId);

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
    // Plans they paid by card too — all they've spent on the platform
    const transactions = getManufacturerTransactions(manufacturer.id, allJobs, { includeCardPayments: true });

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
                                panel: (
                                    <ActiveJobsPanel
                                        jobs={jobs}
                                        getJobHref={(job) => `${jobsUrl}?job=${job.id}`}
                                        emptyDescription="Jobs offered to this manufacturer will show up here."
                                    />
                                ),
                            },
                            {
                                value: "transactions",
                                label: "Transactions",
                                panel: <Transactions transactions={transactions} />,
                            },
                            {
                                value: "reports",
                                label: "Reports",
                                panel: (
                                    <ManufacturerReports
                                        jobs={jobs}
                                        feedback={SAMPLE_SUPPORT_FEEDBACK.filter(
                                            (item) => item.manufacturerId === manufacturer.id,
                                        )}
                                    />
                                ),
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

/** Their totals — earned, withdrawn, spent on plans, and their balance — over every transaction. */
function Transactions({ transactions }: { transactions: ReturnType<typeof getManufacturerTransactions> }) {
    const [sortBy, setSortBy] = useState("");

    return (
        <div className="flex flex-col gap-6">
            <TransactionSummaryCards summary={getTransactionSummary(transactions)} scope="manufacturer" />
            {transactions.length === 0 ? (
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
                    />
                </section>
            )}
        </div>
    );
}

/** Flag, Suspend and Request deletion (Delete account, for a super admin) — each off, with why, when it can't be taken. */
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
            toast.success("Deletion request turned down. The account stays");
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
                    title={`Deletion requested by ${deletionRequest.requestedBy} on ${formatOrdinalDate(new Date(deletionRequest.requestedAt))}${permissions.deletes ? "" : ", waiting for a super admin"}`}
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
                                    Delete account
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
