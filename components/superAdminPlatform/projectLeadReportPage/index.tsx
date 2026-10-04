"use client";

import { DataTable, SelectFilter, TableToolbar, useTableRows } from "@/components/customTable";
import AdminPageHeader from "@/components/adminPlatform/pageHeader";
import { ADMIN_POSITION_OPTIONS } from "@/constant/admin";
import { SUPER_ADMIN_REPORTING_URL } from "@/constant/superAdmin";
import { PROJECT_LEAD_REPORT_COLUMNS } from "../reportingPage/projectLeadReportColumns";
import { useProjectLeadReport } from "../reportingPage/reportingStats";

const TABLE_ID = "project-lead-report";

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminProjectLeadReportPage: every project lead's numbers, from
// /reports/project-leads (the Reporting page shows the top few): search by
// name, filter by position, ten to a page. The report isn't paged, so it's
// fetched once and searched and filtered here.
// ─────────────────────────────────────────────────────────────────────────────

export default function SuperAdminProjectLeadReportPage() {
    const report = useProjectLeadReport();
    const { rows, pagination } = useTableRows({
        tableId: TABLE_ID,
        data: report.rows,
        searchFields: ["name"],
        filters: [{ paramKey: "position", field: "position" }],
        rowsPerPage: 10,
    });

    return (
        <div className="flex flex-col gap-2">
            <AdminPageHeader
                title="Project Lead Report"
                backLink={{ href: SUPER_ADMIN_REPORTING_URL, label: "Reporting" }}
            />

            <DataTable
                tableId={TABLE_ID}
                columns={PROJECT_LEAD_REPORT_COLUMNS}
                rows={rows}
                pagination={pagination}
                loading={report.isPending}
                error={report.isError ? "Couldn't load the project lead report. Please refresh to try again." : undefined}
                emptyMessage="No project leads match your search."
                toolbar={
                    <TableToolbar
                        search={{ placeholder: "Search by name" }}
                        actions={
                            <SelectFilter
                                title="Position"
                                paramKey="position"
                                items={ADMIN_POSITION_OPTIONS}
                                prefixLabel="Position:"
                            />
                        }
                    />
                }
            />
        </div>
    );
}
