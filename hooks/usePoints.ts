import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { pointsService, type PointsSummaryResponse } from "@/lib/services/pointsService";

export function useMyPoints({ enabled = true }: { enabled?: boolean } = {}) {
    const query = useQuery<PointsSummaryResponse>({
        queryKey: queryKeys.points.mySummary(),
        queryFn: () => pointsService.getMyPoints(),
        staleTime: 60 * 1000,
        enabled,
    });

    return {
        summary: query.data,
        isLoading: query.isPending && enabled,
        isError: query.isError,
        refetch: query.refetch,
    };
}

const HISTORY_PAGE_SIZE = 20;

/** Someone's point history (theirs without `userId`), newest first, a page at a time. */
export function usePointsHistory(userId?: string) {
    const isSelf = !userId;
    const query = useInfiniteQuery({
        queryKey: isSelf ? queryKeys.points.myHistory() : queryKeys.points.userHistory(userId!),
        queryFn: ({ pageParam }) => {
            const params = { limit: HISTORY_PAGE_SIZE, before: pageParam ?? undefined };
            return isSelf ? pointsService.getMyHistory(params) : pointsService.getUserHistory(userId!, params);
        },
        initialPageParam: null as string | null,
        getNextPageParam: (last) => last.nextBefore,
        staleTime: 30 * 1000,
    });

    return {
        entries: query.data?.pages.flatMap((page) => page.entries) ?? [],
        isLoading: query.isPending,
        isError: query.isError,
        hasMore: !!query.hasNextPage,
        loadMore: () => void query.fetchNextPage(),
        isLoadingMore: query.isFetchingNextPage,
        refetch: query.refetch,
    };
}
