"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CreditCard, PauseCircle, Phone, Trash2, UserRoundX, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { getRelativeTimeLabel } from "@/lib/date";
import { AttachmentList } from "@/components/adminPlatform/jobDetailPage/detailParts";
import { RatingStarsDisplay } from "@/components/adminPlatform/jobDetailPage/manufacturerRating";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";
import { getAdminManufacturer, getProjectLead } from "@/constant/admin";
import { getPricingPlan } from "@/constant/sampleData";
import { API_PROVIDERS, SUPER_ADMIN_SETTINGS_URL } from "@/constant/superAdmin";
import type { SuperAdminAction } from "../actions/pendingActions";

/** What each action's buttons do — the page opens the dialog for it. */
export type ActionHandlers = {
    onDeleteAccount: (manufacturerId: string) => void;
    onTurnDownDeletion: (manufacturerId: string) => void;
    onSignOff: (jobId: string) => void;
    onReject: (jobId: string) => void;
    onFollowUp: (jobId: string, manufacturerId: string) => void;
};

const BUTTON = "flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium font-text transition-colors cursor-pointer";
const SECONDARY = `${BUTTON} border border-border bg-white text-mist-900 hover:bg-mist-50`;
const PRIMARY = `${BUTTON} bg-secondary-700 text-white hover:bg-secondary-900`;
const DANGER = `${BUTTON} bg-error-600 text-white hover:bg-error-700`;

const ICONS: Record<SuperAdminAction["kind"], { icon: LucideIcon; className: string; label: string }> = {
    "account-deletion": { icon: Trash2, className: "bg-error-50 text-error-600", label: "Account closing" },
    "held-job": { icon: PauseCircle, className: "bg-warning-50 text-warning-700", label: "Low job rating" },
    "lead-rating": { icon: UserRoundX, className: "bg-indigo-50 text-indigo-600", label: "Low lead rating" },
    payments: { icon: CreditCard, className: "bg-error-50 text-error-600", label: "Payments" },
};

const providerLabel = (provider: string | null) => API_PROVIDERS.find((option) => option.value === provider)?.label ?? "A platform";

/** One thing waiting for a super admin: what it is, what's behind it, and the buttons to deal with it. */
export default function ActionCard({ action, handlers, now }: { action: SuperAdminAction; handlers: ActionHandlers; now: Date }) {
    const { getManufacturerUrl, jobsUrl, permissions } = useStaffPlatform();
    const { icon: Icon, className, label } = ICONS[action.kind];
    const since = action.at ? getRelativeTimeLabel(new Date(action.at), now) : null;

    let title: string;
    let body: ReactNode;
    let buttons: ReactNode;

    switch (action.kind) {
        case "account-deletion": {
            const { manufacturer, request } = action;
            title = `Delete the ${manufacturer.companyName} account?`;
            body = (
                <>
                    <p className="text-sm font-text text-mist-600">
                        {request.requestedBy} asked to close {manufacturer.contactName}&apos;s account (
                        {getPricingPlan(manufacturer.subscription.planId)?.name ?? "no"} plan).
                    </p>
                    <blockquote className="rounded-lg bg-mist-50 px-4 py-3 text-sm font-text whitespace-pre-line text-mist-800">
                        {request.reason}
                    </blockquote>
                    {request.attachments.length > 0 && <AttachmentList attachments={request.attachments} />}
                </>
            );
            buttons = (
                <>
                    <Link href={getManufacturerUrl(manufacturer.id)} className={SECONDARY}>
                        View account
                    </Link>
                    <button type="button" onClick={() => handlers.onTurnDownDeletion(manufacturer.id)} className={SECONDARY}>
                        Turn down
                    </button>
                    <button type="button" onClick={() => handlers.onDeleteAccount(manufacturer.id)} className={DANGER}>
                        Close account
                    </button>
                </>
            );
            break;
        }
        case "held-job": {
            const { job, review } = action;
            const makers = job.manufacturerIds.map((id) => getAdminManufacturer(id)?.companyName).filter(Boolean).join(" & ");
            title = `${review.authorName} rated ${job.title} ${review.rating} out of 5`;
            body = (
                <>
                    <p className="text-sm font-text text-mist-600">
                        The finished work by {makers || "the manufacturer"} ({formatPrice(job.amount)}) wasn&apos;t signed
                        off. Sign it off to pay the final part, or reject it with what to fix.
                    </p>
                    <div className="flex flex-col gap-2 rounded-lg bg-mist-50 px-4 py-3">
                        <RatingStarsDisplay rating={review.rating} />
                        <p className="text-sm font-text whitespace-pre-line text-mist-800">{review.comment}</p>
                    </div>
                    {job.completionImageUrls.length > 0 && (
                        <ul className="flex gap-2" aria-label="Photos of the finished furniture">
                            {job.completionImageUrls.slice(0, 4).map((url, index) => (
                                <li key={url} className="relative size-16 overflow-hidden rounded-lg bg-mist-100">
                                    <Image src={url} alt={`Photo ${index + 1}`} fill sizes="64px" className="object-cover" />
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            );
            buttons = (
                <>
                    <Link href={`${jobsUrl}?job=${job.id}`} className={SECONDARY}>
                        Open job
                    </Link>
                    <button type="button" onClick={() => handlers.onReject(job.id)} className={SECONDARY}>
                        Reject
                    </button>
                    <button type="button" onClick={() => handlers.onSignOff(job.id)} className={PRIMARY}>
                        Sign off
                    </button>
                </>
            );
            break;
        }
        case "lead-rating": {
            const { job, review } = action;
            const lead = getProjectLead(review.leadId);
            const maker = getAdminManufacturer(review.manufacturerId);
            title = `${maker?.contactName ?? "A manufacturer"} rated ${lead?.name ?? "their lead"} ${review.rating} out of 5`;
            body = (
                <>
                    <p className="text-sm font-text text-mist-600">
                        As project lead on {job.title}, for {maker?.companyName ?? "their company"}. Follow it up with{" "}
                        {lead?.firstName ?? "the lead"}, then note what you did.
                    </p>
                    <div className="flex flex-col gap-2 rounded-lg bg-mist-50 px-4 py-3">
                        <RatingStarsDisplay rating={review.rating} />
                        <p className="text-sm font-text whitespace-pre-line text-mist-800">{review.comment}</p>
                    </div>
                </>
            );
            buttons = (
                <>
                    {lead && (
                        <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className={SECONDARY}>
                            <Phone className="size-4" aria-hidden />
                            Call {lead.firstName}
                        </a>
                    )}
                    <Link href={`${jobsUrl}?job=${job.id}`} className={SECONDARY}>
                        Open job
                    </Link>
                    <button
                        type="button"
                        onClick={() => handlers.onFollowUp(job.id, review.manufacturerId)}
                        className={PRIMARY}
                    >
                        Mark as followed up
                    </button>
                </>
            );
            break;
        }
        case "payments": {
            const isOff = action.problem === "no-live-keys";
            title = isOff ? "Payments are off" : `${providerLabel(action.provider)} is in test mode`;
            body = (
                <p className="text-sm font-text text-mist-600">
                    {isOff
                        ? `${
                              action.testProviders.length > 0
                                  ? `${action.testProviders.map(providerLabel).join(" and ")} ${action.testProviders.length === 1 ? "is" : "are"} on test keys, and no`
                                  : "No"
                          } payment platform has live keys active, so manufacturers can't pay for their plans and payouts can't go out. Make a set of live keys active.`
                        : "Its active keys are test keys, so payments through it aren't real. Make a set of live keys active when you're ready."}
                </p>
            );
            // API keys are for owners and tech support: a manager is told who can fix it
            buttons = permissions.managesApiKeys ? (
                <Link href={`${SUPER_ADMIN_SETTINGS_URL}?tab=api-keys`} className={PRIMARY}>
                    Go to API keys
                </Link>
            ) : (
                <p className="text-sm font-text text-mist-500">Only an owner or tech support can change API keys. Let one of them know.</p>
            );
            break;
        }
    }

    return (
        <li className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 sm:flex-row sm:gap-5">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", className)}>
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-medium font-text tracking-wide text-mist-500 uppercase">
                        {label}
                        {since && <span className="font-normal normal-case tracking-normal"> · {since}</span>}
                    </p>
                    <h2 className="text-base font-semibold font-text text-mist-950">{title}</h2>
                </div>
                {body}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">{buttons}</div>
            </div>
        </li>
    );
}
