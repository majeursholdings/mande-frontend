import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate, getRelativeTimeLabel, getTimeUntilLabel } from "@/lib/date";
import { getAdminJobPayments, type AdminJob } from "@/constant/admin";
import { FAULT_REPORT_DAYS, canReportFault, type JobBonus } from "@/constant/jobWorkflow";
import { DetailSection } from "./detailParts";

/**
 * How the manufacturer is paid for the job — its six payments, each
 * released as the job moves, and the on-time bonus — with "Report a fault"
 * for the lead in the days after sign-off.
 */
export default function JobPayments({
    job,
    isLead,
    onReportFault,
}: {
    job: AdminJob;
    isLead: boolean;
    onReportFault: () => void;
}) {
    const { payments, bonus } = getAdminJobPayments(job);
    const released = payments.reduce((sum, payment) => sum + (payment.releasedAt ? payment.amount : 0), 0);
    const canReport = isLead && canReportFault({ signedOffAt: job.completedAt, faultReport: job.faultReport });

    return (
        <DetailSection
            title="Payments"
            action={
                canReport && (
                    <button
                        type="button"
                        onClick={onReportFault}
                        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium font-text text-mist-900 transition-colors hover:bg-mist-50 cursor-pointer"
                    >
                        <TriangleAlert className="size-3.5" aria-hidden />
                        Report a fault
                    </button>
                )
            }
        >
            <p className="text-sm font-text text-mist-600">
                {formatPrice(job.amount)} for the manufacturer&apos;s labour, paid in six parts as the job moves —{" "}
                {formatPrice(released)} released so far.
            </p>

            <ul className="flex flex-col divide-y divide-border border-y border-border">
                {payments.map((payment) => (
                    <PaymentRow
                        key={payment.milestone}
                        label={payment.label}
                        percent={payment.percent}
                        amount={payment.amount}
                        status={
                            payment.releasedAt
                                ? `Released ${getRelativeTimeLabel(new Date(payment.releasedAt))}${
                                      payment.milestone === "signed-off" && !job.completedBy ? " · approved automatically" : ""
                                  }`
                                : "To come"
                        }
                        isReleased={!!payment.releasedAt}
                    />
                ))}
                <PaymentRow
                    label="On-time bonus"
                    percent={bonus.percent}
                    amount={bonus.amount}
                    status={getBonusStatus(bonus, job)}
                    isReleased={bonus.status === "released"}
                    isLost={bonus.status === "lost"}
                />
            </ul>

            {job.faultReport && (
                <p className="rounded-lg bg-error-50 px-3.5 py-3 text-xs leading-5 font-text text-error-700">
                    {job.faultReport.reportedBy} reported a fault {formatOrdinalDate(new Date(job.faultReport.reportedAt))}:{" "}
                    {job.faultReport.reason}
                </p>
            )}
        </DetailSection>
    );
}

function getBonusStatus(bonus: JobBonus, job: AdminJob): string {
    switch (bonus.status) {
        case "released":
            return `Released ${bonus.releaseAt ? getRelativeTimeLabel(new Date(bonus.releaseAt)) : ""}`;
        case "due":
            return `Released ${bonus.releaseAt ? getTimeUntilLabel(new Date(bonus.releaseAt)) : ""} unless a fault is reported`;
        case "lost":
            return bonus.lostReason === "fault"
                ? "Lost — a fault was reported"
                : bonus.lostReason === "late"
                  ? "Lost — delivered after the due date"
                  : "Lost — work was sent back";
        default:
            return `If delivered by ${formatOrdinalDate(new Date(job.dueDate))} with nothing sent back and no fault in the ${FAULT_REPORT_DAYS} days after`;
    }
}

function PaymentRow({
    label,
    percent,
    amount,
    status,
    isReleased,
    isLost = false,
}: {
    label: string;
    percent: number;
    amount: number;
    status: string;
    isReleased: boolean;
    isLost?: boolean;
}) {
    return (
        <li className="flex items-start justify-between gap-4 py-3">
            <div className="flex min-w-0 flex-col gap-0.5">
                <span className={cn("text-sm font-text", isLost ? "text-mist-400 line-through" : "text-mist-950")}>{label}</span>
                <span
                    className={cn(
                        "text-xs font-text",
                        isReleased ? "text-primary-700" : isLost ? "text-error-600" : "text-mist-500",
                    )}
                >
                    {status}
                </span>
            </div>
            <span className={cn("shrink-0 text-sm font-text tabular-nums", isLost ? "text-mist-400" : "text-mist-950")}>
                {percent}% · {formatPrice(amount)}
            </span>
        </li>
    );
}
