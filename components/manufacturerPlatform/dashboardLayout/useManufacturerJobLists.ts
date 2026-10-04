"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Job, OpenJob } from "@/constant/manufacturer";
import { mapApiJobToManufacturerJob, mapApiOpenJobToOpenJob, type ApiJobPayload } from "@/lib/mappers/jobMappers";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";

/** The most the API lists in one page: enough to cover every open job and every active one. */
const PAGE_LIMIT = 50;

/** An open job as the API sends it to a signed-in manufacturer: with their own application, if any. */
export type ApiOpenJobWithApplication = ApiJobPayload & {
    id: string;
    application?: { status?: string; appliedAt?: string } | null;
};

/** The signed-in manufacturer's own jobs (offered, underway, done), from the API. Empty until loaded. */
export function useMyJobList() {
    const query = useQuery({
        queryKey: queryKeys.jobs.list({ limit: PAGE_LIMIT }),
        queryFn: () => jobsService.getMyJobs({ limit: PAGE_LIMIT }),
    });
    const jobs: Job[] = useMemo(
        () => ((query.data?.jobs ?? []) as ApiJobPayload[]).map((job) => mapApiJobToManufacturerJob(job)),
        [query.data],
    );
    return { ...query, jobs };
}

/** The open jobs on the marketplace, from the API, raw (for applications) and mapped. Empty until loaded. */
export function useOpenJobList() {
    const query = useQuery({
        queryKey: queryKeys.jobs.openJobs({ limit: PAGE_LIMIT }),
        queryFn: () => jobsService.getOpenJobs({ limit: PAGE_LIMIT }),
    });
    const rawJobs = useMemo(() => (query.data?.jobs ?? []) as ApiOpenJobWithApplication[], [query.data]);
    const jobs: OpenJob[] = useMemo(() => rawJobs.map((job) => mapApiOpenJobToOpenJob(job)), [rawJobs]);
    return { ...query, rawJobs, jobs };
}
