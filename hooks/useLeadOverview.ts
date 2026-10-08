import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { reportsService } from "@/lib/services/reportsService";

/** The signed-in project lead's own numbers (their jobs, manufacturers and money), for the overview cards. Off for a super admin. */
export function useLeadOverview({ enabled = true }: { enabled?: boolean } = {}) {
    const query = useQuery({
        queryKey: queryKeys.reports.leadOverview(),
        queryFn: () => reportsService.getLeadOverview(),
        staleTime: 30_000,
        enabled,
    });
    return { overview: query.data, isLoading: query.isPending && enabled, isError: query.isError };
}
