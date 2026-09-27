import { cn } from "@/lib/utils";
import { formatOrdinalDate, getRelativeTimeLabel } from "@/lib/date";
import { getAdminManufacturer, type AdminJobApplication, type AdminJobAssignment } from "@/constant/admin";
import { DetailSection } from "./detailParts";

const OUTCOME_LABELS: Record<AdminJobAssignment["outcome"], { label: string; className: string }> = {
    awaiting: { label: "Waiting for answer", className: "bg-warning-50 text-warning-700" },
    accepted: { label: "Accepted", className: "bg-primary-50 text-primary-700" },
    declined: { label: "Declined", className: "bg-error-50 text-error-600" },
    reassigned: { label: "Reassigned", className: "bg-mist-100 text-mist-600" },
};

const APPLICATION_LABELS: Record<AdminJobApplication["status"], { label: string; className: string }> = {
    pending: { label: "Waiting for you", className: "bg-warning-50 text-warning-700" },
    accepted: { label: "Accepted", className: "bg-primary-50 text-primary-700" },
    declined: { label: "Declined", className: "bg-error-50 text-error-600" },
};

const companyNames = (ids: string[]) =>
    ids.map((id) => getAdminManufacturer(id)?.companyName ?? "Unknown manufacturer").join(" & ");

/**
 * Who the job has been offered to, newest first, and what came of each
 * offer — with when each answer came — plus manufacturers who applied for
 * it, for the lead to accept or decline. Assign/Reassign for the lead while
 * it's pending.
 */
export default function AssignmentHistory({
    history,
    applications,
    canReassign,
    onReassign,
    onDecideApplication,
    getAcceptBlocker,
}: {
    history: AdminJobAssignment[];
    applications: AdminJobApplication[];
    /** Whether the lead can act: reassign, and accept or decline applications. */
    canReassign: boolean;
    onReassign: () => void;
    onDecideApplication: (applicationId: string, decision: "accepted" | "declined") => void;
    /** Why a manufacturer's application can't be accepted — suspended, or flagged with a job already. */
    getAcceptBlocker: (manufacturerId: string) => string | null;
}) {
    const current = history.find((assignment) => assignment.outcome === "awaiting");
    const waitingApplications = applications.filter((application) => application.status === "pending").length;

    return (
        <DetailSection
            title="Assignment"
            action={
                canReassign && (
                    <button
                        type="button"
                        onClick={onReassign}
                        className="text-sm font-medium font-text text-error-600 hover:underline cursor-pointer"
                    >
                        {current || history.length > 0 ? "Reassign" : "Assign manufacturer"}
                    </button>
                )
            }
        >
            <p className="text-sm font-text text-mist-600">
                {current
                    ? `Waiting for ${companyNames(current.manufacturerIds)} to accept — offered ${getRelativeTimeLabel(new Date(current.assignedAt))}.`
                    : history.length > 0
                      ? "No manufacturer has this job right now. Reassign it to keep it moving."
                      : "This job hasn't been offered to a manufacturer yet."}
                {waitingApplications > 0 &&
                    ` ${waitingApplications} ${waitingApplications === 1 ? "manufacturer has" : "manufacturers have"} applied for it.`}
            </p>

            {applications.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-medium font-text uppercase text-mist-500">
                        Applications ({applications.length})
                    </h4>
                    <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
                        {applications.map((application) => (
                            <ApplicationRow
                                key={application.id}
                                application={application}
                                canDecide={canReassign}
                                acceptBlocker={getAcceptBlocker(application.manufacturerId)}
                                onDecide={(decision) => onDecideApplication(application.id, decision)}
                            />
                        ))}
                    </ul>
                </div>
            )}

            {history.length > 0 && (
                <ol className="flex flex-col">
                    {history.map((assignment, index) => {
                        const outcome = OUTCOME_LABELS[assignment.outcome];
                        const isLast = index === history.length - 1;
                        // When the offer got its answer — or, while it's open, when it was made
                        const statusAt =
                            assignment.outcome === "awaiting" ? assignment.assignedAt : (assignment.outcomeAt ?? assignment.assignedAt);
                        return (
                            <li key={assignment.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <span
                                        className={cn(
                                            "mt-1.5 size-2.5 shrink-0 rounded-full",
                                            index === 0 ? "bg-secondary-700" : "bg-mist-300",
                                        )}
                                    />
                                    {!isLast && <span className="my-1 w-px flex-1 bg-mist-200" />}
                                </div>
                                <div className={cn("flex min-w-0 flex-1 flex-col gap-1", !isLast && "pb-4")}>
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-sm font-medium font-text text-mist-950">
                                            {companyNames(assignment.manufacturerIds)}
                                        </span>
                                        <span className="flex shrink-0 flex-col items-end gap-1">
                                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium font-text", outcome.className)}>
                                                {outcome.label}
                                            </span>
                                            <span className="text-xs font-text text-mist-400">
                                                {getRelativeTimeLabel(new Date(statusAt))}
                                            </span>
                                        </span>
                                    </div>
                                    <span className="text-xs font-text text-mist-500">
                                        Assigned by {assignment.assignedBy} · {formatOrdinalDate(new Date(assignment.assignedAt))}
                                        {assignment.outcomeAt &&
                                            assignment.outcome !== "awaiting" &&
                                            ` · ${outcome.label.toLowerCase()} ${formatOrdinalDate(new Date(assignment.outcomeAt))}`}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </DetailSection>
    );
}

function ApplicationRow({
    application,
    canDecide,
    acceptBlocker,
    onDecide,
}: {
    application: AdminJobApplication;
    canDecide: boolean;
    acceptBlocker: string | null;
    onDecide: (decision: "accepted" | "declined") => void;
}) {
    const manufacturer = getAdminManufacturer(application.manufacturerId);
    const status = APPLICATION_LABELS[application.status];
    const isPending = application.status === "pending";

    return (
        <li className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3">
            <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium font-text text-mist-950">
                    {manufacturer?.companyName ?? "Unknown manufacturer"}
                </span>
                <span className="text-xs font-text text-mist-500">
                    {manufacturer ? `${manufacturer.contactName} · ` : ""}Applied{" "}
                    {getRelativeTimeLabel(new Date(application.appliedAt))}
                </span>
                {isPending && acceptBlocker && (
                    <span className="text-xs font-text text-warning-700">{acceptBlocker}</span>
                )}
            </div>
            {isPending && canDecide ? (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onDecide("declined")}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium font-text text-mist-700 transition-colors hover:bg-mist-50 cursor-pointer"
                    >
                        Decline
                    </button>
                    <button
                        type="button"
                        disabled={!!acceptBlocker}
                        title={acceptBlocker ?? undefined}
                        onClick={() => onDecide("accepted")}
                        className="rounded-md bg-secondary-700 px-3 py-1.5 text-xs font-medium font-text text-white transition-colors enabled:hover:bg-secondary-900 enabled:cursor-pointer disabled:bg-mist-200 disabled:text-mist-500"
                    >
                        Accept
                    </button>
                </div>
            ) : (
                <span className="flex flex-col items-end gap-1">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium font-text", status.className)}>
                        {status.label}
                    </span>
                    {application.decidedAt && (
                        <span className="text-xs font-text text-mist-400">
                            {getRelativeTimeLabel(new Date(application.decidedAt))}
                        </span>
                    )}
                </span>
            )}
        </li>
    );
}
