import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate, getRelativeTimeLabel, getTimeUntilLabel } from "@/lib/date";
import {
    FAULT_REPORT_DAYS,
    REVIEW_WINDOW_HOURS,
    type JobBonus,
    type JobFaultReport,
    type JobPayment,
    type StepProgress,
} from "@/constant/jobWorkflow";

// ─────────────────────────────────────────────────────────────────────────────
// JobDetailPayments — the manufacturer's pay for the job, in the six parts
// it reaches their wallet in as the work passes, and the on-time bonus on
// top. Every percentage is a share of their pay; nothing is kept back to
// the end.
// ─────────────────────────────────────────────────────────────────────────────

export default function JobDetailPayments({
    amount,
    dueDate,
    payments,
    bonus,
    progress,
    faultReport,
}: {
    /** Their pay for the job, in naira. */
    amount: number;
    /** ISO date. */
    dueDate: string;
    payments: JobPayment[];
    bonus: JobBonus;
    progress: StepProgress[];
    faultReport: JobFaultReport | null;
}) {
    const paid = payments.reduce((sum, payment) => sum + (payment.releasedAt ? payment.amount : 0), 0);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold font-text text-mist-950">Your pay</h3>
                <span className="text-xs font-text text-mist-500">{formatPrice(paid)} paid so far</span>
            </div>
            <p className="text-xs font-text text-mist-500">
                {formatPrice(amount)} for your labour, paid into your wallet in six parts as your work passes. Nothing is
                kept back to the end.
            </p>

            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
                {payments.map((payment) => {
                    const step = progress.find((candidate) => candidate.key === payment.milestone);
                    return (
                        <PaymentRow
                            key={payment.milestone}
                            label={payment.label}
                            percent={payment.percent}
                            amount={payment.amount}
                            status={
                                payment.releasedAt
                                    ? `In your wallet · ${getRelativeTimeLabel(new Date(payment.releasedAt))}`
                                    : step?.state === "in-review"
                                      ? "Waiting for review"
                                      : "To come"
                            }
                            tone={payment.releasedAt ? "paid" : "due"}
                        />
                    );
                })}
                <PaymentRow
                    label="On-time bonus"
                    percent={bonus.percent}
                    amount={bonus.amount}
                    status={getBonusStatus(bonus, dueDate, faultReport)}
                    tone={bonus.status === "released" ? "paid" : bonus.status === "lost" ? "lost" : "due"}
                />
            </ul>

            <p className="flex gap-2 text-xs font-text text-mist-500">
                <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Review taking a while? Anything waiting more than {REVIEW_WINDOW_HOURS} hours is approved automatically —
                Sundays don&apos;t count.
            </p>
        </div>
    );
}

function getBonusStatus(bonus: JobBonus, dueDate: string, faultReport: JobFaultReport | null): string {
    switch (bonus.status) {
        case "released":
            return `In your wallet · ${bonus.releaseAt ? getRelativeTimeLabel(new Date(bonus.releaseAt)) : ""}`;
        case "due":
            return `Paid ${bonus.releaseAt ? getTimeUntilLabel(new Date(bonus.releaseAt)) : ""} if no fault is reported`;
        case "lost":
            return bonus.lostReason === "fault"
                ? `Missed — a fault was reported${faultReport ? `: ${faultReport.reason}` : ""}`
                : bonus.lostReason === "late"
                  ? "Missed — delivered after the due date"
                  : "Missed — a stage was sent back";
        default:
            return `Yours if you deliver by ${formatOrdinalDate(new Date(dueDate))} with no stage sent back and no fault reported in the ${FAULT_REPORT_DAYS} days after sign-off`;
    }
}

function PaymentRow({
    label,
    percent,
    amount,
    status,
    tone,
}: {
    label: string;
    percent: number;
    amount: number;
    status: string;
    tone: "paid" | "due" | "lost";
}) {
    return (
        <li className="flex items-start justify-between gap-4 px-3.5 py-3">
            <div className="flex min-w-0 flex-col gap-0.5">
                <span className={cn("text-sm font-text", tone === "lost" ? "text-mist-400 line-through" : "text-mist-950")}>
                    {label}
                </span>
                <span
                    className={cn(
                        "text-xs font-text",
                        tone === "paid" && "text-primary-600",
                        tone === "due" && "text-mist-500",
                        tone === "lost" && "text-red-600",
                    )}
                >
                    {status}
                </span>
            </div>
            <span className={cn("shrink-0 text-sm font-text tabular-nums", tone === "lost" ? "text-mist-400" : "text-mist-950")}>
                {percent}% · {formatPrice(amount)}
            </span>
        </li>
    );
}
