"use client";

import Link from "next/link";
import { CheckCircle2, Clock, LogOut, OctagonPause, Paperclip, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatOrdinalDate, getRelativeTimeLabel } from "@/lib/date";
import LogoLink from "@/components/ui/logoLink";
import { MANUFACTURER_DASHBOARD_URL } from "@/constant/manufacturer";
import AppealForm from "@/components/manufacturerPlatform/form/appealForm";
import { useLogout } from "./logoutContext";
import type { AccountAppealRecord } from "@/constant/sampleDb";
import { useManufacturerAccount } from "./manufacturerAccountContext";

const APPEAL_STATUS: Record<
    AccountAppealRecord["status"],
    { label: string; icon: typeof Clock; className: string }
> = {
    pending: { label: "Being looked at", icon: Clock, className: "bg-amber-50 text-amber-700" },
    approved: { label: "Approved", icon: CheckCircle2, className: "bg-primary-50 text-primary-700" },
    declined: { label: "Turned down", icon: XCircle, className: "bg-red-50 text-red-600" },
};

// ─────────────────────────────────────────────────────────────────────────────
// SuspendedAccountScreen — all a suspended manufacturer sees, in place of
// the whole dashboard: why the account is suspended, their appeal (the form
// to send one, or the one being looked at), and what came of earlier ones.
// Everything else on the account is paused until an admin lifts it.
// ─────────────────────────────────────────────────────────────────────────────

export default function SuspendedAccountScreen() {
    const { hold, appeals, pendingAppeal, sendAppeal } = useManufacturerAccount();
    const { requestLogout } = useLogout();
    const pastAppeals = appeals.filter((appeal) => appeal.status !== "pending");
    const lastTurnedDown = pastAppeals[0]?.status === "declined";

    return (
        <div className="flex min-h-dvh flex-col bg-mist-50">
            <header className="flex items-center justify-between border-b border-border bg-white px-4 py-3.5 lg:px-8">
                <LogoLink href={MANUFACTURER_DASHBOARD_URL} className="w-30" />
                <button
                    type="button"
                    onClick={requestLogout}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium font-text text-mist-600 transition-colors hover:bg-mist-100 hover:text-mist-900"
                >
                    <LogOut className="size-4" strokeWidth={1.75} />
                    Logout
                </button>
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 lg:py-12">
                <section className="flex flex-col gap-3 rounded-xl border border-red-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <OctagonPause className="size-5" aria-hidden />
                        </span>
                        <div>
                            <h1 className="text-lg font-semibold font-text text-mist-950">Your account is suspended</h1>
                            {hold && (
                                <p className="text-xs font-text text-mist-500">
                                    Since {formatOrdinalDate(new Date(hold.at))}
                                </p>
                            )}
                        </div>
                    </div>
                    {hold?.reason && (
                        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-text text-red-700">{hold.reason}</p>
                    )}
                    <p className="text-sm font-text text-mist-600">
                        Everything on your account is paused while it&apos;s suspended — your jobs, payments,
                        profile and settings. If you think it&apos;s a mistake, send an appeal and an admin will look at
                        it.
                    </p>
                </section>

                {pendingAppeal ? (
                    <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-base font-semibold font-text text-mist-950">Your appeal</h2>
                            <AppealStatus status="pending" />
                        </div>
                        <p className="text-xs font-text text-mist-500">
                            Sent {getRelativeTimeLabel(new Date(pendingAppeal.sentAt))}. We&apos;ll let you know once an
                            admin has looked at it.
                        </p>
                        <AppealMessage appeal={pendingAppeal} />
                    </section>
                ) : (
                    <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
                        <div>
                            <h2 className="text-base font-semibold font-text text-mist-950">
                                {lastTurnedDown ? "Send a new appeal" : "Send an appeal"}
                            </h2>
                            <p className="text-xs font-text text-mist-500">
                                {lastTurnedDown
                                    ? "Your last appeal was turned down — see why below. Send another with anything that answers it."
                                    : "Tell us what happened, with any invoices, receipts or photos that show it."}
                            </p>
                        </div>
                        <AppealForm onSend={sendAppeal} />
                    </section>
                )}

                {pastAppeals.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <h2 className="text-base font-semibold font-text text-mist-950">Earlier appeals</h2>
                        <ul className="flex flex-col gap-3">
                            {pastAppeals.map((appeal) => (
                                <li key={appeal.id} className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-xs font-text text-mist-500">
                                            Sent {formatOrdinalDate(new Date(appeal.sentAt))}
                                        </span>
                                        <AppealStatus status={appeal.status} />
                                    </div>
                                    <AppealMessage appeal={appeal} />
                                    {appeal.response && (
                                        <div className="flex flex-col gap-1 rounded-lg bg-mist-50 px-4 py-3">
                                            <span className="text-xs font-medium font-text text-mist-500">
                                                Reply
                                                {appeal.decidedAt && ` · ${formatOrdinalDate(new Date(appeal.decidedAt))}`}
                                            </span>
                                            <p className="text-sm font-text text-mist-900">{appeal.response}</p>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>
        </div>
    );
}

function AppealStatus({ status }: { status: AccountAppealRecord["status"] }) {
    const { label, icon: Icon, className } = APPEAL_STATUS[status];
    return (
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium font-text", className)}>
            <Icon className="size-3.5" aria-hidden />
            {label}
        </span>
    );
}

/** What they wrote, and the files they sent with it. */
function AppealMessage({ appeal }: { appeal: AccountAppealRecord }) {
    return (
        <>
            <p className="text-sm font-text whitespace-pre-line text-mist-800">{appeal.message}</p>
            {appeal.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {appeal.attachments.map((attachment) => (
                        <Link key={attachment.url} href={attachment.url} target="_blank" title={attachment.name}>
                            <span className="flex items-center gap-1.5 rounded-lg border border-border bg-mist-50 px-3 py-2 text-xs font-text text-mist-700">
                                <Paperclip className="size-3.5 text-mist-400" aria-hidden />
                                {attachment.name}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}
