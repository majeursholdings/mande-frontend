"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProjectLead, registerProjectLeads, type ProjectLeadRecord } from "@/constant/platformRecords";
import { queryKeys } from "@/lib/queryKeys";
import { staffService } from "@/lib/services/staffService";

/**
 * The project leads (admins), from the API: active ones, or every one with
 * `status: "all"`. Each is also kept in the lead registry, so getProjectLead
 * finds them by id anywhere. Empty until loaded.
 */
export function useProjectLeads({ status = "active" }: { status?: "active" | "all" } = {}) {
    const params = status === "all" ? {} : { status };
    const query = useQuery({
        queryKey: queryKeys.staff.projectLeads(params),
        queryFn: async () => {
            const data = await staffService.getProjectLeads(params);
            if (data?.projectLeads) registerProjectLeads(data.projectLeads);
            return data;
        },
        staleTime: 60_000,
    });
    const leads: ProjectLeadRecord[] = useMemo(
        () =>
            ((query.data?.projectLeads ?? []) as { id: string }[]).flatMap((lead) => {
                const record = getProjectLead(lead.id);
                return record ? [record] : [];
            }),
        [query.data],
    );
    return { ...query, leads };
}
