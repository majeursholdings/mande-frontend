"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    DataTable,
    TableToolbar,
    useTableRows,
    type ColumnDef,
    type SelectFilterItem,
    type SortOptionDef,
} from "@/components/customTable";
import UserAvatar from "@/components/ui/userAvatar";
import { RatingStars } from "@/components/customTable";
import RankBadge from "@/components/common/points/rankBadge";
import { ADMIN_POSITION_OPTIONS } from "@/constant/admin";
import { getOptionLabel } from "@/constant/manufacturer";
import { useProjectLeads } from "@/components/adminPlatform/dashboardLayout/useProjectLeads";
import type { ProjectLeadRecord } from "@/constant/platformRecords";

const TABLE_ID = "super-admin-project-leads";

interface ProjectLeadRow extends ProjectLeadRecord {
    positionLabel: string;
    pointsVal: number;
    rankVal: string;
    activeCount: number;
    completedCount: number;
}

const POSITION_ITEMS: SelectFilterItem[] = ADMIN_POSITION_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
}));

const RANK_ITEMS: SelectFilterItem[] = [
    { label: "Associate Lead", value: "associate-lead" },
    { label: "Senior Lead", value: "senior-lead" },
    { label: "Principal Lead", value: "principal-lead" },
];

const SORT_ITEMS: SelectFilterItem[] = [
    { label: "Name", value: "name" },
    { label: "Points", value: "points" },
    { label: "Active Jobs", value: "activeJobs" },
];

const SORT_OPTIONS: SortOptionDef<ProjectLeadRow>[] = [
    { value: "name", field: "name" },
    { value: "points", field: "pointsVal", type: "number" },
    { value: "activeJobs", field: "activeCount", type: "number" },
];

export default function SuperAdminProjectLeadsPage() {
    const router = useRouter();
    const { leads, isLoading, isError } = useProjectLeads({ status: "all" });

    const allRows: ProjectLeadRow[] = leads.map((lead) => ({
        ...lead,
        positionLabel: getOptionLabel(ADMIN_POSITION_OPTIONS, lead.position),
        pointsVal: lead.points ?? 0,
        rankVal: lead.rank ?? "associate-lead",
        activeCount: lead.activeJobsCount ?? 0,
        completedCount: lead.completedJobsCount ?? 0,
    }));

    const { rows, pagination } = useTableRows({
        tableId: TABLE_ID,
        data: allRows,
        searchFields: ["name", "email", "phone"],
        filters: [
            { paramKey: "position", field: "position" },
            { paramKey: "rank", field: "rankVal" },
        ],
        sortOptions: SORT_OPTIONS,
        rowsPerPage: 10,
    });

    const columns: ColumnDef<ProjectLeadRow>[] = [
        {
            key: "name",
            header: "Project Lead",
            cell: (row) => (
                <span className="flex items-center gap-3">
                    <UserAvatar name={row.name} src={row.avatarUrl} className="size-8 text-xs" />
                    <span className="flex min-w-0 flex-col">
                        <Link
                            href={`/super-admin/project-leads/${encodeURIComponent(row.userId ?? row.id)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-mist-950 hover:underline focus-visible:underline"
                        >
                            {row.name}
                        </Link>
                        <span className="text-xs text-gray-500">{row.email}</span>
                    </span>
                </span>
            ),
        },
        {
            key: "position",
            header: "Position",
            cell: (row) => <span className="text-sm font-text text-mist-800">{row.positionLabel}</span>,
        },
        {
            key: "rank",
            header: "Rank",
            cell: (row) => <RankBadge rankId={row.rankVal} role="admin" size="sm" />,
        },
        {
            key: "points",
            header: "Points",
            className: "text-right font-mono tabular-nums",
            cell: (row) => <span className="font-semibold text-mist-950">{row.pointsVal.toLocaleString()}</span>,
        },
        {
            key: "jobs",
            header: "Jobs (Active / Done)",
            className: "text-center tabular-nums text-xs font-text",
            cell: (row) => (
                <span className="text-mist-800">
                    <strong className="text-mist-950">{row.activeCount}</strong> active /{" "}
                    <span className="text-mist-500">{row.completedCount} done</span>
                </span>
            ),
        },
        {
            key: "rating",
            header: "Avg. Rating",
            cell: (row) =>
                row.averageRating ? (
                    <span className="flex items-center gap-1.5 text-xs text-mist-700">
                        <RatingStars value={row.averageRating} />
                        <span className="font-semibold">{row.averageRating.toFixed(1)}</span>
                    </span>
                ) : (
                    <span className="text-xs text-mist-400">No ratings yet</span>
                ),
        },
    ];

    return (
        <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold font-text text-mist-950">Project Leads</h1>

            <DataTable
                tableId={TABLE_ID}
                columns={columns}
                rows={rows}
                loading={isLoading}
                pagination={pagination}
                error={isError && leads.length === 0 ? "Failed to load project leads. Please refresh." : undefined}
                emptyMessage="No project leads match your search."
                onRowClick={(row) => router.push(`/super-admin/project-leads/${encodeURIComponent(row.userId ?? row.id)}`)}
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search by name, email or phone" }}
                        filters={[
                            { title: "Position", paramKey: "position", items: POSITION_ITEMS },
                            { title: "Rank", paramKey: "rank", items: RANK_ITEMS },
                        ]}
                        sortBy={{ title: "Sort by", items: SORT_ITEMS }}
                    />
                }
            />
        </div>
    );
}
