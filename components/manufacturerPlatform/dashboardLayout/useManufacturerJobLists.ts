"use client";

import { useMemo } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
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

/** How many matches the job search loads at a time. */
const SEARCH_PAGE_LIMIT = 20;

type JobListPage = { jobs?: unknown[]; nextBefore?: string | null };

/**
 * Searches every job in one list on the server, a page at a time: the open
 * jobs on the marketplace, or the signed-in manufacturer's own ("active").
 * Off while `term` is empty. A new term keeps showing the last results until
 * its own arrive, so the list doesn't flash.
 */
export function useJobSearch<T>(scope: "open" | "active", term: string, mapJob: (job: never) => T) {
    const q = term.trim().slice(0, 100);
    const query = useInfiniteQuery({
        queryKey: queryKeys.jobs.search(scope, q),
        queryFn: ({ pageParam }): Promise<JobListPage> => {
            const params = { limit: SEARCH_PAGE_LIMIT, q, before: pageParam ?? undefined };
            return scope === "open" ? jobsService.getOpenJobs(params) : jobsService.getMyJobs(params);
        },
        initialPageParam: null as string | null,
        getNextPageParam: (last) => last.nextBefore ?? null,
        enabled: q.length > 0,
        placeholderData: keepPreviousData,
    });
    const jobs: T[] = useMemo(
        () => (query.data?.pages ?? []).flatMap((page) => (page.jobs ?? []) as never[]).map((job) => mapJob(job)),
        [query.data, mapJob],
    );
    return { ...query, jobs };
}
