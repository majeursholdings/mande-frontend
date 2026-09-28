import { RatingStars, type ColumnDef } from "@/components/customTable";
import UserAvatar from "@/components/ui/userAvatar";
import type { ProjectLeadReportRow } from "./reportingStats";

/**
 * The Project Lead Report's columns — on the Reporting page and the full
 * report: who (with their position under their name), the jobs they've
 * handled, and how manufacturers rated them once each job was completed.
 */
export const PROJECT_LEAD_REPORT_COLUMNS: ColumnDef<ProjectLeadReportRow>[] = [
    {
        key: "name",
        header: "Full name",
        cell: (row) => (
            <span className="flex items-center gap-3">
                <UserAvatar name={row.name} src={row.avatarUrl} className="size-8 text-xs" />
                <span className="flex min-w-0 flex-col">
                    <span className="font-medium text-mist-950">{row.name}</span>
                    <span className="text-xs text-gray-500">{row.positionLabel}</span>
                </span>
            </span>
        ),
    },
    {
        key: "jobsHandled",
        header: "Jobs handled",
        className: "text-center",
        cell: (row) => <span className="text-mist-950 tabular-nums">{row.jobsHandled}</span>,
    },
    {
        key: "reviews",
        header: "Reviews",
        className: "text-center",
        cell: (row) => <span className="text-mist-950 tabular-nums">{row.reviews}</span>,
    },
    {
        key: "averageRating",
        header: "Avg. rating",
        cell: (row) =>
            row.averageRating === null ? (
                <span className="text-xs text-mist-400">No ratings yet</span>
            ) : (
                <span className="flex items-center gap-2" title={`From ${row.reviews} rating${row.reviews === 1 ? "" : "s"}`}>
                    <RatingStars value={row.averageRating} />
                    <span className="text-xs text-mist-500 tabular-nums">{row.averageRating.toFixed(1)}</span>
                    <span className="sr-only">out of 5</span>
                </span>
            ),
    },
];
