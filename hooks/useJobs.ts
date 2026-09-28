import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export interface JobListItem {
  id: string;
  code: string;
  title: string;
  category: string;
  status: "open" | "in-progress" | "completed" | "cancelled";
  currentStep?: string;
  progressPercent: number;
  totalCostKobo: number;
  payoutKobo: number;
  deliveryDate: string;
  createdAt: string;
}

export interface JobsQueryFilters {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Hook to retrieve jobs for the active user (manufacturer or staff)
 */
export function useMyJobs(filters: JobsQueryFilters = {}) {
  return useQuery({
    queryKey: queryKeys.jobs.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const { data } = await api.get<{ jobs: JobListItem[]; total: number }>(
        "/my-jobs",
        { params: filters }
      );
      return data;
    },
  });
}

/**
 * Hook to retrieve open jobs marketplace for manufacturers
 */
export function useOpenJobs(filters: JobsQueryFilters = {}) {
  return useQuery({
    queryKey: queryKeys.jobs.openJobs(filters as Record<string, unknown>),
    queryFn: async () => {
      const { data } = await api.get<{ jobs: JobListItem[]; total: number }>(
        "/open-jobs",
        { params: filters }
      );
      return data;
    },
  });
}

/**
 * Hook to retrieve a single job's detail
 */
export function useJobDetail(jobId: string) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(jobId),
    queryFn: async () => {
      const { data } = await api.get(`/my-jobs/${jobId}`);
      return data;
    },
    enabled: Boolean(jobId),
  });
}

/**
 * Hook to accept an assigned job
 */
export function useAcceptJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await api.post(`/my-jobs/${jobId}/accept`);
      return data;
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.lists() });
    },
  });
}
