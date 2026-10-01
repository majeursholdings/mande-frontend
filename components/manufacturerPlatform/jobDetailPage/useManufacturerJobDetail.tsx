"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { jobsService } from "@/lib/services/jobsService";
import {
    mapApiJobToManufacturerJob,
    mapApiOpenJobToOpenJob,
    type ApiJobPayload,
} from "@/lib/mappers/jobMappers";
import {
    JOBS,
    OPEN_JOBS,
    type Job,
    type OpenJob,
} from "@/constant/manufacturer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export type ManufacturerJobDetailResult =
    | { type: "assigned"; job: Job }
    | { type: "open"; job: OpenJob };

export async function fetchManufacturerJobDetail(
    jobId: string,
): Promise<ManufacturerJobDetailResult | null> {
    const cleanId = (jobId ?? "").trim();
    if (!cleanId) return null;

    // 1. Try to fetch as an assigned job for the signed-in manufacturer
    try {
        const response = await jobsService.getMyJobDetail(cleanId);
        if (response?.job) {
            return {
                type: "assigned",
                job: mapApiJobToManufacturerJob(response.job as ApiJobPayload),
            };
        }
    } catch {
        // Not an assigned job for this user, check open jobs next
    }

    // 2. Try to fetch as an open marketplace job
    try {
        const response = await jobsService.getOpenJob(cleanId);
        if (response?.job) {
            return {
                type: "open",
                job: mapApiOpenJobToOpenJob(response.job as ApiJobPayload),
            };
        }
    } catch {
        // Not found via API, fall through to static fixtures
    }

    // 3. Fallback to sample data (matching by id or code)
    const lower = cleanId.toLowerCase();
    const staticOpen = OPEN_JOBS.find(
        (j) => j.id.toLowerCase() === lower || j.code?.toLowerCase() === lower,
    );
    if (staticOpen) {
        return { type: "open", job: staticOpen };
    }

    const staticAssigned = JOBS.find(
        (j) => j.id.toLowerCase() === lower || j.code?.toLowerCase() === lower,
    );
    if (staticAssigned) {
        return { type: "assigned", job: staticAssigned };
    }

    return null;
}

export function useManufacturerJobDetail(jobId: string) {
    return useQuery({
        queryKey: queryKeys.jobs.detail(jobId),
        queryFn: () => fetchManufacturerJobDetail(jobId),
        enabled: Boolean(jobId),
    });
}

export function JobDetailSkeleton({ closeSlot }: { closeSlot?: ReactNode }) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border">
                <Skeleton className="h-4 w-24" />
                {closeSlot}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">
                <Skeleton className="aspect-4/3 w-full rounded-xl" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-3.5 w-1/3" />
                </div>
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="rounded-xl border border-border p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="mt-auto pt-4">
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function JobDetailNotFound({
    closeSlot,
    onBack,
}: {
    closeSlot?: ReactNode;
    onBack?: () => void;
}) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border">
                <span className="text-sm font-medium font-text text-mist-500">Job Detail</span>
                {closeSlot}
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
                <p className="text-base font-semibold font-text text-mist-900">Job not found</p>
                <p className="text-xs font-text text-mist-500 max-w-xs">
                    This job may have been removed, reassigned, or the link is invalid.
                </p>
                {onBack && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onBack}
                        className="mt-2"
                    >
                        Back to Jobs
                    </Button>
                )}
            </div>
        </div>
    );
}
