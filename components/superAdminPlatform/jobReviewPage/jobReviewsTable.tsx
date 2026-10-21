"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import {
    DataTable,
    StatusBadge,
    TableToolbar,
    useTableRows,
    type ColumnDef,
    type SelectFilterItem,
    type SortOptionDef,
} from "@/components/customTable";
import UserAvatar from "@/components/ui/userAvatar";
import { cn } from "@/lib/utils";
import { formatOrdinalDate } from "@/lib/date";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService, type JobReview, type JobReviewKind } from "@/lib/services/reportsService";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";

/** A review as the table's row: names and the rating as text, so the toolbar can search and filter them. */
type Row = JobReview & { subjectName: string; authorName: string; stars: string };

const RATING_ITEMS: SelectFilterItem[] = [5, 4, 3, 2, 1].map((rating) => ({
    value: String(rating),
    label: `${rating} star${rating === 1 ? "" : "s"}`,
}));

const SORT_OPTIONS: SortOptionDef<Row>[] = [
    { value: "date", field: "date", type: "date" },
    { value: "rating", field: "rating", type: "number", direction: "desc" },
];

/** Five stars, the first `rating` filled. */
function Stars({ rating }: { rating: number }) {
    return (
        <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={cn("size-3.5", star <= rating ? "fill-amber-400 text-amber-400" : "fill-mist-100 text-mist-200")}
                    aria-hidden
                />
            ))}
        </span>
    );
}

/**
 * Every review of one kind (/reports/job-reviews), newest first: who was
 * rated, by whom, on which job, the stars and the comment, and whether it's
 * held for sign-off or has a super admin's follow-up. Searched, filtered by
 * rating and sorted here. A manufacturer review's row opens the manufacturer.
 */
export default function JobReviewsTable({ kind }: { kind: JobReviewKind }) {
    const router = useRouter();
    const { getManufacturerUrl } = useStaffPlatform();
    const isManufacturer = kind === "manufacturer";
    const tableId = isManufacturer ? "manufacturer-reviews" : "lead-reviews";
    const query = useQuery({
        queryKey: queryKeys.reports.jobReviews(kind),
        queryFn: () => reportsService.getAllJobReviews(kind),
        staleTime: 30_000,
    });

    const { rows, pagination } = useTableRows({
        tableId,
        data: (query.data ?? []).map((review) => ({
            ...review,
            subjectName: review.subject.name,
            authorName: review.author.name,
            stars: String(review.rating),
        })),
        searchFields: ["subjectName", "authorName", "jobTitle", "jobCode", "comment"],
        filters: [{ paramKey: "rating", field: "stars" }],
        sortOptions: SORT_OPTIONS,
        rowsPerPage: 10,
    });

    const columns: ColumnDef<Row>[] = [
        {
            key: "subject",
            header: isManufacturer ? "Manufacturer" : "Project lead",
            cell: (row) => (
                <span className="flex items-center gap-3">
                    <UserAvatar name={row.subjectName} src={row.subject.avatarUrl} className="size-8 text-xs" />
                    <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-mist-950">{row.subjectName}</span>
                        <span className="truncate text-xs text-mist-500">{row.subject.companyName || (row.jobCode ?? row.jobTitle)}</span>
                    </span>
                </span>
            ),
        },
        {
            key: "review",
            header: "Review",
            className: "min-w-64 whitespace-normal",
            cell: (row) => (
                <span className="flex flex-col gap-1">
                    <Stars rating={row.rating} />
                    <span className="text-sm text-mist-700">{row.comment}</span>
                    {row.followUp && (
                        <span className="rounded-md bg-mist-50 px-2 py-1 text-xs text-mist-600">
                            Follow-up by {row.followUp.byName}: {row.followUp.note}
                        </span>
                    )}
                </span>
            ),
        },
        {
            key: "job",
            header: "Job",
            className: "hidden lg:table-cell",
            cell: (row) => (
                <span className="flex min-w-0 flex-col">
                    <span className="max-w-48 truncate text-mist-950">{row.jobTitle}</span>
                    {row.jobCode && <span className="text-xs text-mist-500">{row.jobCode}</span>}
                </span>
            ),
        },
        {
            key: "author",
            header: "By",
            className: "hidden md:table-cell",
            cell: (row) => (
                <span className="flex flex-col">
                    <span className="text-mist-700">{row.authorName}</span>
                    <span className="text-xs text-mist-400">{formatOrdinalDate(new Date(row.date))}</span>
                </span>
            ),
        },
        {
            key: "status",
            header: "Status",
            cell: (row) =>
                row.status === "held" ? (
                    <StatusBadge label="Held for sign-off" tone="amber" variant="pill" />
                ) : row.followUp ? (
                    <StatusBadge label="Followed up" tone="blue" variant="pill" />
                ) : (
                    <StatusBadge label="Published" tone="green" variant="pill" />
                ),
        },
    ];

    return (
        <DataTable
            tableId={tableId}
            columns={columns}
            rows={rows}
            pagination={pagination}
            loading={query.isPending}
            error={query.isError ? "Couldn't load the reviews. Please refresh to try again." : undefined}
            emptyMessage={(query.data?.length ?? 0) === 0 ? "No reviews yet." : "No reviews match your search."}
            onRowClick={isManufacturer ? (row) => router.push(getManufacturerUrl(row.subject.id)) : undefined}
            toolbar={
                <TableToolbar
                    search={{ placeholder: isManufacturer ? "Search by manufacturer, lead, job or comment" : "Search by lead, manufacturer, job or comment" }}
                    filters={[{ title: "All ratings", paramKey: "rating", items: RATING_ITEMS }]}
                    sortBy={{
                        title: "Sort by",
                        items: [
                            { label: "Date", value: "date" },
                            { label: "Rating", value: "rating" },
                        ],
                    }}
                />
            }
        />
    );
}
