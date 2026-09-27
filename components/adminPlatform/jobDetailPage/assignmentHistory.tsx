import { cn } from "@/lib/utils";
import { formatOrdinalDate, getRelativeTimeLabel } from "@/lib/date";
import { getAdminManufacturer, type AdminJobAssignment } from "@/constant/admin";
import { DetailSection } from "./detailParts";

const OUTCOME_LABELS: Record<AdminJobAssignment["outcome"], { label: string; className: string }> = {
    awaiting: { label: "Waiting for answer", className: "bg-warning-50 text-warning-700" },
    accepted: { label: "Accepted", className: "bg-primary-50 text-primary-700" },
    declined: { label: "Declined", className: "bg-error-50 text-error-600" },
    reassigned: { label: "Reassigned", className: "bg-mist-100 text-mist-600" },
};

const companyNames = (ids: string[]) =>
    ids.map((id) => getAdminManufacturer(id)?.companyName ?? "Unknown manufacturer").join(" & ");

/**
 * Who the job has been offered to, newest first, and what came of each
 * offer — with Assign/Reassign for the lead while it's pending.
 */
export default function AssignmentHistory({
    history,
    canReassign,
    onReassign,
}: {
    history: AdminJobAssignment[];
    canReassign: boolean;
    onReassign: () => void;
}) {
    const current = history.find((assignment) => assignment.outcome === "awaiting");

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
            </p>

            {history.length > 0 && (
                <ol className="flex flex-col">
                    {history.map((assignment, index) => {
                        const outcome = OUTCOME_LABELS[assignment.outcome];
                        const isLast = index === history.length - 1;
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
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-sm font-medium font-text text-mist-950">
                                            {companyNames(assignment.manufacturerIds)}
                                        </span>
                                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium font-text", outcome.className)}>
                                            {outcome.label}
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
