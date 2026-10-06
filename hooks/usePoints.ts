import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { pointsService, type PointsSummaryResponse } from "@/lib/services/pointsService";

export function useMyPoints() {
    const query = useQuery<PointsSummaryResponse>({
        queryKey: queryKeys.points.mySummary(),
        queryFn: () => pointsService.getMyPoints(),
        staleTime: 60 * 1000,
    });

    return {
        summary: query.data,
        isLoading: query.isPending,
        isError: query.isError,
        refetch: query.refetch,
    };
}

export function usePointsHistory(userId?: string) {
    const isSelf = !userId;
    const query = useQuery({
        queryKey: isSelf ? queryKeys.points.myHistory() : queryKeys.points.userHistory(userId!),
        queryFn: () => (isSelf ? pointsService.getMyHistory() : pointsService.getUserHistory(userId!)),
        staleTime: 30 * 1000,
    });

    return {
        entries: query.data?.entries ?? [],
        nextBefore: query.data?.nextBefore ?? null,
        isLoading: query.isPending,
        isError: query.isError,
        refetch: query.refetch,
    };
}
